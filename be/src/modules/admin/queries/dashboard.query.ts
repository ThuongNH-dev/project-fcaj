import {
  getUsersCollection,
  toPublicUser,
  type UserDocument,
} from "../../auth/auth.service.js";
import { getExpensesCollection } from "../../expenses/expenses.service.js";
import { getReceiptsCollection } from "../../receipts/receipts.service.js";
import type { AdminDashboardStats } from "../admin.types.js";
import { getGroupsCollection } from "./admin.shared.js";

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const users = await getUsersCollection();
  const groups = await getGroupsCollection();
  const expenses = await getExpensesCollection();
  const receipts = await getReceiptsCollection();
  const sevenDaysAgo = new Date();

  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [
    totalUsers,
    totalAdmins,
    totalGroups,
    totalExpenses,
    totalReceiptUploads,
    newUsersLast7Days,
    recentUsers,
  ] = await Promise.all([
    users.countDocuments({}),
    users.countDocuments({ role: "admin" }),
    groups.countDocuments({}),
    expenses.countDocuments({}),
    receipts.countDocuments({}),
    users.countDocuments({
      createdAt: {
        $gte: sevenDaysAgo,
      },
    }),
    users
      .find({})
      .sort({ createdAt: -1 })
      .limit(8)
      .toArray(),
  ]);

  return {
    newUsersLast7Days,
    recentUsers: recentUsers.map((user: UserDocument) => toPublicUser(user)),
    totalAdmins,
    totalExpenses,
    totalGroups,
    totalReceiptUploads,
    totalUsers,
  };
}
