import type { Collection, ObjectId } from "mongodb";
import { ObjectId as MongoObjectId } from "mongodb";
import { connectToMongo } from "../../db/mongo.js";
import {
  canManageGroup,
  canManageGroupMembers,
  getGroupPermission,
} from "../../policies/group.policy.js";
import { getUsersCollection } from "../auth/auth.service.js";
import type {
  AddGroupMemberInput,
  CreateGroupInput,
  GroupMember,
  PublicGroupMember,
  PublicGroup,
  RemoveGroupMemberInput,
  UpdateGroupInput,
} from "./groups.types.js";

interface GroupDocument {
  _id?: ObjectId;
  name: string;
  icon: string;
  color: string;
  createdBy: string;
  members: GroupMember[];
  createdAt: Date;
  updatedAt: Date;
}

async function getGroupsCollection(): Promise<Collection<GroupDocument>> {
  const db = await connectToMongo();
  return db.collection<GroupDocument>("groups");
}

async function getGroupDocumentById(groupId: string): Promise<GroupDocument | null> {
  if (!MongoObjectId.isValid(groupId)) {
    return null;
  }

  const groups = await getGroupsCollection();
  return groups.findOne({
    _id: new MongoObjectId(groupId),
  });
}

function toPublicGroup(group: GroupDocument): PublicGroup {
  throw new Error("Use toPublicGroupWithMembers instead.");
}

async function toPublicGroupWithMembers(group: GroupDocument): Promise<PublicGroup> {
  if (!group._id) {
    throw new Error("Group document is missing an id.");
  }

  const users = await getUsersCollection();
  const memberIds = group.members
    .map((member) => member.userId)
    .filter((memberId) => MongoObjectId.isValid(memberId));
  const usersById = new Map<string, { name: string; email: string }>();

  if (memberIds.length > 0) {
    const memberUsers = await users
      .find({
        _id: {
          $in: memberIds.map((memberId) => new MongoObjectId(memberId)),
        },
      })
      .toArray();

    memberUsers.forEach((user) => {
      if (user._id) {
        usersById.set(
          user._id.toString(),
          {
            name: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
          },
        );
      }
    });
  }

  const publicMembers: PublicGroupMember[] = group.members.map((member) => ({
    id: member.userId,
    name: usersById.get(member.userId)?.name ?? "Unknown user",
    email: usersById.get(member.userId)?.email ?? "",
    role: member.role,
  }));

  return {
    id: group._id.toString(),
    name: group.name,
    icon: group.icon,
    color: group.color,
    createdBy: group.createdBy,
    members: publicMembers,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
  };
}

export async function createGroup(input: CreateGroupInput): Promise<PublicGroup> {
  const groups = await getGroupsCollection();
  const users = await getUsersCollection();
  const normalizedName = input.name.trim();
  const normalizedIcon = input.icon.trim();
  const normalizedColor = input.color.trim();
  const createdAt = new Date();
  const updatedAt = createdAt;
  const memberEmails = Array.from(
    new Set(
      (input.members ?? [])
        .map((memberEmail) => memberEmail.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
  const existingMembers =
    memberEmails.length > 0
      ? await users
          .find({
            email: {
              $in: memberEmails,
            },
          })
          .toArray()
      : [];

  if (existingMembers.length !== memberEmails.length) {
    throw new Error("One or more member emails do not exist.");
  }

  const members: GroupMember[] = [
    {
      userId: input.createdBy,
      role: "owner",
    },
    ...existingMembers
      .filter((member) => member._id?.toString() !== input.createdBy)
      .map((member) => ({
      userId: member._id!.toString(),
      role: "member" as const,
    })),
  ];

  const result = await groups.insertOne({
    name: normalizedName,
    icon: normalizedIcon,
    color: normalizedColor,
    createdBy: input.createdBy,
    members,
    createdAt,
    updatedAt,
  });

  return toPublicGroupWithMembers({
    _id: result.insertedId,
    name: normalizedName,
    icon: normalizedIcon,
    color: normalizedColor,
    createdBy: input.createdBy,
    members,
    createdAt,
    updatedAt,
  });
}

export async function getGroupsByUserId(userId: string): Promise<PublicGroup[]> {
  const groups = await getGroupsCollection();
  const groupDocuments = await groups
    .find({
      "members.userId": userId,
    })
    .sort({ updatedAt: -1 })
    .toArray();

  return Promise.all(groupDocuments.map(toPublicGroupWithMembers));
}

export async function getGroupIdsByUserId(userId: string): Promise<string[]> {
  const groups = await getGroupsCollection();
  const groupDocuments = await groups
    .find(
      {
        "members.userId": userId,
      },
      {
        projection: {
          _id: 1,
        },
      },
    )
    .toArray();

  return groupDocuments
    .map((groupDocument) => groupDocument._id?.toString() ?? "")
    .filter(Boolean);
}

export async function getAllGroups(): Promise<PublicGroup[]> {
  const groups = await getGroupsCollection();
  const groupDocuments = await groups
    .find({})
    .sort({ updatedAt: -1 })
    .toArray();

  return Promise.all(groupDocuments.map(toPublicGroupWithMembers));
}

export async function getGroupByIdForUser(
  groupId: string,
  userId: string,
): Promise<PublicGroup | null> {
  const groupDocument = await getGroupDocumentById(groupId);

  if (!groupDocument) {
    return null;
  }

  if (getGroupPermission(groupDocument.members, userId) === "non-member") {
    return null;
  }

  return toPublicGroupWithMembers(groupDocument);
}

export async function getGroupById(groupId: string): Promise<PublicGroup | null> {
  if (!MongoObjectId.isValid(groupId)) {
    return null;
  }

  const groups = await getGroupsCollection();
  const groupDocument = await groups.findOne({
    _id: new MongoObjectId(groupId),
  });

  return groupDocument ? toPublicGroupWithMembers(groupDocument) : null;
}

export async function updateGroup(input: UpdateGroupInput): Promise<PublicGroup | null> {
  const groupDocument = await getGroupDocumentById(input.groupId);

  if (!groupDocument) {
    return null;
  }

  const groupPermission = getGroupPermission(groupDocument.members, input.userId);

  if (!canManageGroup(groupPermission)) {
    return null;
  }

  const groups = await getGroupsCollection();
  const normalizedName = input.name.trim();
  const normalizedIcon = input.icon.trim();
  const normalizedColor = input.color.trim();
  const updatedAt = new Date();
  const groupObjectId = new MongoObjectId(input.groupId);

  const result = await groups.findOneAndUpdate(
    {
      _id: groupObjectId,
    },
    {
      $set: {
        name: normalizedName,
        icon: normalizedIcon,
        color: normalizedColor,
        updatedAt,
      },
    },
    {
      returnDocument: "after",
    },
  );

  return result ? toPublicGroupWithMembers(result) : null;
}

export async function deleteGroup(groupId: string, userId: string): Promise<boolean> {
  const groupDocument = await getGroupDocumentById(groupId);

  if (!groupDocument) {
    return false;
  }

  const groupPermission = getGroupPermission(groupDocument.members, userId);

  if (!canManageGroup(groupPermission)) {
    return false;
  }

  const groups = await getGroupsCollection();
  const result = await groups.deleteOne({
    _id: new MongoObjectId(groupId),
  });

  return result.deletedCount > 0;
}

export async function deleteGroupById(groupId: string): Promise<boolean> {
  if (!MongoObjectId.isValid(groupId)) {
    return false;
  }

  const groups = await getGroupsCollection();
  const result = await groups.deleteOne({
    _id: new MongoObjectId(groupId),
  });

  return result.deletedCount > 0;
}

export async function addGroupMember(input: AddGroupMemberInput): Promise<PublicGroup | null> {
  const group = await getGroupDocumentById(input.groupId);

  if (!group) {
    return null;
  }

  const users = await getUsersCollection();
  const groups = await getGroupsCollection();
  const groupObjectId = new MongoObjectId(input.groupId);
  const normalizedEmail = input.email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Member email is required.");
  }

  if (!canManageGroupMembers(getGroupPermission(group.members, input.userId))) {
    return null;
  }

  const userToAdd = await users.findOne({ email: normalizedEmail });

  if (!userToAdd?._id) {
    throw new Error("Member email does not exist.");
  }

  const memberId = userToAdd._id.toString();

  if (group.members.some((member) => member.userId === memberId)) {
    throw new Error("This user is already a member of the group.");
  }

  const updatedMembers: GroupMember[] = [
    ...group.members,
    {
      userId: memberId,
      role: "member",
    },
  ];

  await groups.updateOne(
    { _id: groupObjectId },
    {
      $set: {
        members: updatedMembers,
        updatedAt: new Date(),
      },
    },
  );

  return toPublicGroupWithMembers({
    ...group,
    members: updatedMembers,
    updatedAt: new Date(),
  });
}

export async function removeGroupMember(input: RemoveGroupMemberInput): Promise<PublicGroup | null> {
  const group = await getGroupDocumentById(input.groupId);

  if (!group) {
    return null;
  }

  const groups = await getGroupsCollection();
  const groupObjectId = new MongoObjectId(input.groupId);

  if (!canManageGroupMembers(getGroupPermission(group.members, input.userId))) {
    return null;
  }

  if (getGroupPermission(group.members, input.memberId) === "owner") {
    throw new Error("The group owner cannot be removed.");
  }

  const updatedMembers = group.members.filter(
    (member) => member.userId !== input.memberId,
  );

  if (updatedMembers.length === group.members.length) {
    throw new Error("Member not found in this group.");
  }

  await groups.updateOne(
    { _id: groupObjectId },
    {
      $set: {
        members: updatedMembers,
        updatedAt: new Date(),
      },
    },
  );

  return toPublicGroupWithMembers({
    ...group,
    members: updatedMembers,
    updatedAt: new Date(),
  });
}
