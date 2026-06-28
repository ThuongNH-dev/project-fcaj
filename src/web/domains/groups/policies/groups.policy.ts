import type { AuthUser } from "../../auth";
import type { Group, GroupMember } from "../models/groups.types";

type GroupActor = Pick<AuthUser, "id"> | null | undefined;

export function isGroupOwner(user: GroupActor, group: Group) {
  return Boolean(user?.id && group.createdBy === user.id);
}

export function canManageGroup(user: GroupActor, group: Group) {
  return isGroupOwner(user, group);
}

export function canManageGroupMembers(user: GroupActor, group: Group) {
  return isGroupOwner(user, group);
}

export function canRemoveGroupMember(
  user: GroupActor,
  group: Group,
  member: GroupMember,
) {
  return canManageGroupMembers(user, group) && member.role !== "owner";
}
