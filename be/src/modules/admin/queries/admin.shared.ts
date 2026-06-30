import { ObjectId as MongoObjectId } from "mongodb";
import type { Collection, ObjectId } from "mongodb";
import { connectToMongo } from "../../../db/mongo.js";
import {
  getUsersCollection,
  toPublicUser,
  type UserDocument,
} from "../../auth/auth.service.js";
import {
  getExpensesCollection,
  type ExpenseDocument,
} from "../../expenses/expenses.service.js";
import type {
  AdminSettlementRecord,
} from "../admin.types.js";

export interface GroupDocument {
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

export async function getGroupsCollection(): Promise<Collection<GroupDocument>> {
  const db = await connectToMongo();
  return db.collection<GroupDocument>("groups");
}

export function getUserDisplayName(user: UserDocument) {
  const publicUser = toPublicUser(user);
  const fullName = `${publicUser.firstName} ${publicUser.lastName}`.trim();

  return fullName || publicUser.email || "Unknown user";
}

export async function buildReferenceMaps(params: {
  userIds: string[];
  groupIds: string[];
  expenseIds: string[];
}) {
  const users = await getUsersCollection();
  const groups = await getGroupsCollection();
  const expenses = await getExpensesCollection();

  const [userDocuments, groupDocuments, expenseDocuments] = await Promise.all([
    params.userIds.length > 0
      ? users
          .find({
            _id: {
              $in: params.userIds
                .filter((userId) => userId)
                .map((userId) => new MongoObjectId(userId)),
            },
          })
          .toArray()
      : Promise.resolve([]),
    params.groupIds.length > 0
      ? groups
          .find({
            _id: {
              $in: params.groupIds
                .filter((groupId) => groupId)
                .map((groupId) => new MongoObjectId(groupId)),
            },
          })
          .toArray()
      : Promise.resolve([]),
    params.expenseIds.length > 0
      ? expenses
          .find({
            _id: {
              $in: params.expenseIds
                .filter((expenseId) => expenseId)
                .map((expenseId) => new MongoObjectId(expenseId)),
            },
          })
          .toArray()
      : Promise.resolve([]),
  ]);

  const usersById = new Map(
    userDocuments
      .filter((user) => user._id)
      .map((user) => [
        user._id!.toString(),
        {
          name: getUserDisplayName(user),
          email: user.email,
        },
      ]),
  );
  const groupsById = new Map(
    groupDocuments
      .filter((group) => group._id)
      .map((group) => [group._id!.toString(), group.name]),
  );
  const expensesById = new Map(
    expenseDocuments
      .filter((expense) => expense._id)
      .map((expense) => [
        expense._id!.toString(),
        {
          title: expense.title,
          groupId: expense.groupId,
        },
      ]),
  );

  return {
    expensesById,
    groupsById,
    usersById,
  };
}

export function toAdminSettlementRecord(params: {
  expenseDocument: ExpenseDocument;
  groupsById: Map<string, string>;
  usersById: Map<string, { name: string; email: string }>;
}): AdminSettlementRecord {
  const { expenseDocument, groupsById, usersById } = params;

  return {
    amount: expenseDocument.amount,
    createdAt: expenseDocument.createdAt.toISOString(),
    createdByName: usersById.get(expenseDocument.createdBy)?.name ?? "Unknown user",
    createdByUserId: expenseDocument.createdBy,
    currency: expenseDocument.currency,
    expenseDate: expenseDocument.expenseDate.toISOString(),
    groupId: expenseDocument.groupId,
    groupName: groupsById.get(expenseDocument.groupId) ?? null,
    id: expenseDocument._id!.toString(),
    paidByName: usersById.get(expenseDocument.paidByUserId)?.name ?? "Unknown user",
    paidByUserId: expenseDocument.paidByUserId,
    participantCount: expenseDocument.participants.length,
    settledAt: expenseDocument.settledAt?.toISOString() ?? null,
    settledByName: expenseDocument.settledBy
      ? usersById.get(expenseDocument.settledBy)?.name ?? "Unknown user"
      : null,
    settledByUserId: expenseDocument.settledBy ?? null,
    settlementNote: expenseDocument.settlementNote ?? null,
    settlementStatus: expenseDocument.settlementStatus,
    title: expenseDocument.title,
    updatedAt: expenseDocument.updatedAt.toISOString(),
  };
}
