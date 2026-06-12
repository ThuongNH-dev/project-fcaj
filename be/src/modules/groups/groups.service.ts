import type { Collection, ObjectId } from "mongodb";
import { ObjectId as MongoObjectId } from "mongodb";
import { connectToMongo } from "../../db/mongo.js";
import { getUsersCollection } from "../auth/auth.service.js";
import type {
  CreateGroupInput,
  GroupMember,
  PublicGroupMember,
  PublicGroup,
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
  const usersById = new Map<string, string>();

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
          `${user.firstName} ${user.lastName}`.trim(),
        );
      }
    });
  }

  const publicMembers: PublicGroupMember[] = group.members.map((member) => ({
    name: usersById.get(member.userId) ?? "Unknown user",
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

export async function getGroupByIdForUser(
  groupId: string,
  userId: string,
): Promise<PublicGroup | null> {
  if (!MongoObjectId.isValid(groupId)) {
    return null;
  }

  const groups = await getGroupsCollection();
  const groupDocument = await groups.findOne({
    _id: new MongoObjectId(groupId),
    "members.userId": userId,
  });

  return groupDocument ? toPublicGroupWithMembers(groupDocument) : null;
}
