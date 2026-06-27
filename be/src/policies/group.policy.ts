import type { UserRole } from "../modules/auth/auth.types.js";
import { isAdminUserRole } from "./auth.policy.js";

export type GroupPermission = "non-member" | "member" | "owner";

export interface GroupPolicyMemberLike {
  id?: string;
  role: "owner" | "member";
  userId?: string;
}

function getMemberUserId(member: GroupPolicyMemberLike) {
  return member.userId ?? member.id ?? "";
}

export function getGroupPermission(
  members: GroupPolicyMemberLike[],
  userId: string,
): GroupPermission {
  const matchingMember = members.find((member) => getMemberUserId(member) === userId);

  if (!matchingMember) {
    return "non-member";
  }

  return matchingMember.role;
}

export function isUserInGroup(members: GroupPolicyMemberLike[], userId: string) {
  return getGroupPermission(members, userId) !== "non-member";
}

export function areUsersInGroup(
  members: GroupPolicyMemberLike[],
  userIds: string[],
) {
  return userIds.every((userId) => isUserInGroup(members, userId));
}

export function canManageGroup(permission: GroupPermission) {
  return permission === "owner";
}

export function canManageGroupMembers(permission: GroupPermission) {
  return permission === "owner";
}

export function canSettleGroupExpense(input: {
  currentUserId: string;
  groupPermission: GroupPermission;
  paidByUserId: string;
  userRole: UserRole;
}) {
  if (isAdminUserRole(input.userRole)) {
    return true;
  }

  return (
    input.currentUserId === input.paidByUserId ||
    input.groupPermission === "owner"
  );
}
