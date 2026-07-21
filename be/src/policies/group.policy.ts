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

export function canSettleExpense(input: {
  currentUserId: string;
  paidByUserId: string;
}) {
  return input.currentUserId === input.paidByUserId;
}
