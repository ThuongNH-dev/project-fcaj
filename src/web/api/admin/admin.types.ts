import type { AuthUser } from "../auth";

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
