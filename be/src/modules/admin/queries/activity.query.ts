import { ObjectId as MongoObjectId } from "mongodb";
import {
  getUsersCollection,
  toPublicUser,
  type UserDocument,
} from "../../auth/auth.service.js";
import {
  getExpensesCollection,
  type ExpenseDocument,
} from "../../expenses/expenses.service.js";
import {
  getReceiptsCollection,
  type ReceiptUploadDocument,
} from "../../receipts/receipts.service.js";
import type { AdminActivityLog } from "../admin.types.js";
import {
  buildReferenceMaps,
  getGroupsCollection,
  getUserDisplayName,
  type GroupDocument,
} from "./admin.shared.js";

export async function getAdminActivityLogs(): Promise<AdminActivityLog[]> {
  const users = await getUsersCollection();
  const groups = await getGroupsCollection();
  const expenses = await getExpensesCollection();
  const receipts = await getReceiptsCollection();
  const [
    recentUsers,
    recentGroups,
    recentExpenses,
    recentSettledExpenses,
    recentReceipts,
  ] = await Promise.all([
    users.find({}).sort({ createdAt: -1 }).limit(15).toArray(),
    groups.find({}).sort({ createdAt: -1 }).limit(15).toArray(),
    expenses.find({}).sort({ createdAt: -1 }).limit(15).toArray(),
    expenses
      .find({
        settledAt: {
          $ne: null,
        },
        settlementStatus: "settled",
      })
      .sort({ settledAt: -1, updatedAt: -1 })
      .limit(15)
      .toArray(),
    receipts.find({}).sort({ createdAt: -1 }).limit(15).toArray(),
  ]);

  const referenceMaps = await buildReferenceMaps({
    expenseIds: [],
    groupIds: Array.from(
      new Set([
        ...recentExpenses.map((expenseDocument) => expenseDocument.groupId),
        ...recentSettledExpenses.map((expenseDocument) => expenseDocument.groupId),
        ...recentReceipts
          .map((receiptDocument) => receiptDocument.groupId)
          .filter((groupId): groupId is string => Boolean(groupId)),
      ]),
    ).filter((groupId) => MongoObjectId.isValid(groupId)),
    userIds: Array.from(
      new Set([
        ...recentGroups.map((groupDocument) => groupDocument.createdBy),
        ...recentExpenses.map((expenseDocument) => expenseDocument.createdBy),
        ...recentSettledExpenses
          .map((expenseDocument) => expenseDocument.settledBy)
          .filter((userId): userId is string => Boolean(userId)),
        ...recentReceipts.map((receiptDocument) => receiptDocument.uploadedByUserId),
      ]),
    ).filter((userId) => MongoObjectId.isValid(userId)),
  });

  const activityLogs: AdminActivityLog[] = [
    ...recentUsers.map((userDocument: UserDocument) => ({
      createdAt: toPublicUser(userDocument).createdAt,
      description: getUserDisplayName(userDocument),
      eventType: "user_registered" as const,
      id: `user-${userDocument._id!.toString()}`,
      title: "New user registered",
    })),
    ...recentGroups.map((groupDocument: GroupDocument) => ({
      createdAt: groupDocument.createdAt.toISOString(),
      description: `${groupDocument.name} by ${
        referenceMaps.usersById.get(groupDocument.createdBy)?.name ?? "Unknown user"
      }`,
      eventType: "group_created" as const,
      id: `group-${groupDocument._id!.toString()}`,
      title: "Group created",
    })),
    ...recentExpenses.map((expenseDocument: ExpenseDocument) => ({
      createdAt: expenseDocument.createdAt.toISOString(),
      description: `${expenseDocument.title} in ${
        referenceMaps.groupsById.get(expenseDocument.groupId) ?? "Unknown group"
      }`,
      eventType: "expense_created" as const,
      id: `expense-${expenseDocument._id!.toString()}`,
      title: "Expense recorded",
    })),
    ...recentSettledExpenses.map((expenseDocument: ExpenseDocument) => ({
      createdAt:
        expenseDocument.settledAt?.toISOString() ??
        expenseDocument.updatedAt.toISOString(),
      description: `${expenseDocument.title} settled by ${
        expenseDocument.settledBy
          ? referenceMaps.usersById.get(expenseDocument.settledBy)?.name ?? "Unknown user"
          : "Unknown user"
      } in ${referenceMaps.groupsById.get(expenseDocument.groupId) ?? "Unknown group"}`,
      eventType: "expense_settled" as const,
      id: `expense-settled-${expenseDocument._id!.toString()}`,
      title: "Expense settled",
    })),
    ...recentReceipts.map((receiptDocument: ReceiptUploadDocument) => ({
      createdAt: receiptDocument.createdAt.toISOString(),
      description: `${receiptDocument.originalFileName} by ${
        referenceMaps.usersById.get(receiptDocument.uploadedByUserId)?.name ??
        "Unknown user"
      }`,
      eventType: "receipt_uploaded" as const,
      id: `receipt-${receiptDocument._id!.toString()}`,
      title: "Receipt uploaded",
    })),
  ];

  return activityLogs
    .sort(
      (leftLog, rightLog) =>
        new Date(rightLog.createdAt).getTime() -
        new Date(leftLog.createdAt).getTime(),
    )
    .slice(0, 40);
}
