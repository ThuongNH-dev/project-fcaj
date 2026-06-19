import type { PublicUser } from "../auth/auth.types.js";

export interface AdminDashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalGroups: number;
  newUsersLast7Days: number;
  recentUsers: PublicUser[];
}
