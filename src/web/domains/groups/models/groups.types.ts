export interface GroupMember {
  id: string;
  name: string;
  email: string;
  role: "owner" | "member";
}

export interface Group {
  id: string;
  name: string;
  icon: string;
  color: string;
  currency: "USD" | "VND";
  createdBy: string;
  members: GroupMember[];
  expenseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupsResponse {
  ok: boolean;
  message: string;
  groups?: Group[];
}

export interface CreateGroupPayload {
  name: string;
  icon: string;
  color: string;
  currency: "USD" | "VND";
  members?: string[];
}

export interface UpdateGroupPayload {
  name: string;
  icon: string;
  color: string;
  currency: "USD" | "VND";
}

export interface AddGroupMemberPayload {
  email: string;
}

export interface CreateGroupResponse {
  ok: boolean;
  message: string;
  group?: Group;
}

export interface GroupResponse {
  ok: boolean;
  message: string;
  group?: Group;
}

export interface DeleteGroupResponse {
  ok: boolean;
  message: string;
}
