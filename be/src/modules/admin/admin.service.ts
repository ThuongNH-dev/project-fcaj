import type { Collection, ObjectId } from "mongodb";
import { connectToMongo } from "../../db/mongo.js";
import {
  getUsersCollection,
  toPublicUser,
  type UserDocument,
} from "../auth/auth.service.js";
import type { AdminDashboardStats } from "./admin.types.js";

interface GroupDocument {
  _id?: ObjectId;
  name: string;
  icon: string;
  color: string;
  createdBy: string;
  members: Array<{
    userId: string;
    role: "owner" | "member";
  }>;
  createdAt: Date;
  updatedAt: Date;
}

async function getGroupsCollection(): Promise<Collection<GroupDocument>> {
  const db = await connectToMongo();
  return db.collection<GroupDocument>("groups");
}

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const users = await getUsersCollection();
  const groups = await getGroupsCollection();
  const sevenDaysAgo = new Date();

  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [totalUsers, totalAdmins, totalGroups, newUsersLast7Days, recentUsers] =
    await Promise.all([
      users.countDocuments({}),
      users.countDocuments({ role: "admin" }),
      groups.countDocuments({}),
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
    totalUsers,
    totalAdmins,
    totalGroups,
    newUsersLast7Days,
    recentUsers: recentUsers.map((user: UserDocument) => toPublicUser(user)),
  };
}
