import type { SupportedCurrency } from "../auth/auth.types.js";

export interface CreateGroupInput {
  name: string;
  icon: string;
  color: string;
  currency: SupportedCurrency;
  createdBy: string;
  members?: string[];
}

export interface UpdateGroupInput {
  groupId: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  currency: SupportedCurrency;
}

export interface GroupMember {
  userId: string;
  role: "owner" | "member";
}

export interface PublicGroupMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "member";
}

export interface PublicGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
  currency: SupportedCurrency;
  createdBy: string;
  members: PublicGroupMember[];
  expenseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGroupResponse {
  ok: boolean;
  message: string;
  group?: PublicGroup;
}

export interface GroupResponse {
  ok: boolean;
  message: string;
  group?: PublicGroup;
}

export interface DeleteGroupResponse {
  ok: boolean;
  message: string;
}

export interface AddGroupMemberInput {
  groupId: string;
  userId: string;
  email: string;
}

export interface RemoveGroupMemberInput {
  groupId: string;
  userId: string;
  memberId: string;
}
