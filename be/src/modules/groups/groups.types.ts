export interface CreateGroupInput {
  name: string;
  icon: string;
  color: string;
  createdBy: string;
  members?: string[];
}

export interface GroupMember {
  userId: string;
  role: "owner" | "member";
}

export interface PublicGroupMember {
  name: string;
  role: "owner" | "member";
}

export interface PublicGroup {
  id: string;
  name: string;
  icon: string;
  color: string;
  createdBy: string;
  members: PublicGroupMember[];
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
