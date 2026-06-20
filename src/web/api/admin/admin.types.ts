import type { AuthUser } from "../auth";
import type { Group } from "../groups";

export interface AdminSessionResponse {
  ok: boolean;
  message: string;
  user?: AuthUser;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalGroups: number;
  newUsersLast7Days: number;
  recentUsers: AuthUser[];
}

export interface AdminDashboardResponse {
  ok: boolean;
  message: string;
  stats?: AdminDashboardStats;
}

export interface AdminGroupsResponse {
  ok: boolean;
  message: string;
  groups?: Group[];
}

export interface AdminGroupResponse {
  ok: boolean;
  message: string;
  group?: Group;
}
