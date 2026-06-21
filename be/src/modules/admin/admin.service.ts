import { ObjectId as MongoObjectId } from "mongodb";
import type { Collection, ObjectId } from "mongodb";
import { connectToMongo } from "../../db/mongo.js";
import {
  getUsersCollection,
  toPublicUser,
  type UserDocument,
} from "../auth/auth.service.js";
import {
  getExpensesCollection,
  type ExpenseDocument,
} from "../expenses/expenses.service.js";
import {
  getReceiptsCollection,
  type ReceiptUploadDocument,
} from "../receipts/receipts.service.js";
import type {
  AdminActivityLog,
  AdminDashboardStats,
  AdminRejectedRecord,
  AdminUploadRecord,
} from "./admin.types.js";

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

async function buildReferenceMaps(params: {
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
          name: `${user.firstName} ${user.lastName}`.trim(),
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
    usersById,
    groupsById,
    expensesById,
  };
}

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
  ] =
    await Promise.all([
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
    totalUsers,
    totalAdmins,
    totalGroups,
    totalExpenses,
    totalReceiptUploads,
    newUsersLast7Days,
    recentUsers: recentUsers.map((user: UserDocument) => toPublicUser(user)),
  };
}

export async function getAdminUploadRecords(): Promise<AdminUploadRecord[]> {
  const receipts = await getReceiptsCollection();
  const receiptDocuments = await receipts
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  const referenceMaps = await buildReferenceMaps({
    userIds: Array.from(
      new Set(receiptDocuments.map((receiptDocument) => receiptDocument.uploadedByUserId)),
    ).filter((userId) => MongoObjectId.isValid(userId)),
    groupIds: Array.from(
      new Set(
        receiptDocuments
          .map((receiptDocument) => receiptDocument.groupId)
          .filter((groupId): groupId is string => Boolean(groupId)),
      ),
    ).filter((groupId) => MongoObjectId.isValid(groupId)),
    expenseIds: Array.from(
      new Set(
        receiptDocuments
          .map((receiptDocument) => receiptDocument.expenseId)
          .filter((expenseId): expenseId is string => Boolean(expenseId)),
      ),
    ).filter((expenseId) => MongoObjectId.isValid(expenseId)),
  });

  return receiptDocuments.map((receiptDocument: ReceiptUploadDocument) => {
    const uploadedBy =
      referenceMaps.usersById.get(receiptDocument.uploadedByUserId) ?? {
        name: "Unknown user",
        email: "",
      };
    const expense = receiptDocument.expenseId
      ? referenceMaps.expensesById.get(receiptDocument.expenseId)
      : null;

    return {
      id: receiptDocument._id!.toString(),
      originalFileName: receiptDocument.originalFileName,
      storedFileName: receiptDocument.storedFileName,
      storagePath: receiptDocument.storagePath,
      mimeType: receiptDocument.mimeType,
      fileKind: receiptDocument.fileKind,
      sizeInBytes: receiptDocument.sizeInBytes,
      processingStatus: receiptDocument.processingStatus,
      reviewStatus: receiptDocument.reviewStatus,
      ocrStatus: receiptDocument.ocrStatus,
      uploadedByUserId: receiptDocument.uploadedByUserId,
      uploadedByName: uploadedBy.name,
      uploadedByEmail: uploadedBy.email,
      groupId: receiptDocument.groupId,
      groupName: receiptDocument.groupId
        ? referenceMaps.groupsById.get(receiptDocument.groupId) ?? null
        : null,
      expenseId: receiptDocument.expenseId,
      expenseTitle: expense?.title ?? null,
      createdAt: receiptDocument.createdAt.toISOString(),
      updatedAt: receiptDocument.updatedAt.toISOString(),
    };
  });
}

export async function getAdminRejectedRecords(): Promise<AdminRejectedRecord[]> {
  const expenses = await getExpensesCollection();
  const receipts = await getReceiptsCollection();
  const [rejectedExpenseDocuments, rejectedReceiptDocuments] = await Promise.all([
    expenses
      .find({
        reviewStatus: "rejected",
      })
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray(),
    receipts
      .find({
        $or: [{ reviewStatus: "rejected" }, { processingStatus: "failed" }],
      })
      .sort({ updatedAt: -1 })
      .limit(100)
      .toArray(),
  ]);

  const referenceMaps = await buildReferenceMaps({
    userIds: Array.from(
      new Set([
        ...rejectedExpenseDocuments.map((expenseDocument) => expenseDocument.createdBy),
        ...rejectedReceiptDocuments.map((receiptDocument) => receiptDocument.uploadedByUserId),
      ]),
    ).filter((userId) => MongoObjectId.isValid(userId)),
    groupIds: Array.from(
      new Set([
        ...rejectedExpenseDocuments.map((expenseDocument) => expenseDocument.groupId),
        ...rejectedReceiptDocuments
          .map((receiptDocument) => receiptDocument.groupId)
          .filter((groupId): groupId is string => Boolean(groupId)),
      ]),
    ).filter((groupId) => MongoObjectId.isValid(groupId)),
    expenseIds: [],
  });

  const rejectedExpenses = rejectedExpenseDocuments.map(
    (expenseDocument: ExpenseDocument): AdminRejectedRecord => ({
      id: `expense-${expenseDocument._id!.toString()}`,
      entityType: "expense",
      title: expenseDocument.title,
      groupName: referenceMaps.groupsById.get(expenseDocument.groupId) ?? null,
      actorName:
        referenceMaps.usersById.get(expenseDocument.createdBy)?.name ?? "Unknown user",
      status: expenseDocument.reviewStatus,
      reason: expenseDocument.rejectionReason ?? "Rejected by admin.",
      createdAt: expenseDocument.updatedAt.toISOString(),
    }),
  );

  const rejectedReceipts = rejectedReceiptDocuments.map(
    (receiptDocument: ReceiptUploadDocument): AdminRejectedRecord => ({
      id: `receipt-${receiptDocument._id!.toString()}`,
      entityType: "receipt",
      title: receiptDocument.originalFileName,
      groupName: receiptDocument.groupId
        ? referenceMaps.groupsById.get(receiptDocument.groupId) ?? null
        : null,
      actorName:
        referenceMaps.usersById.get(receiptDocument.uploadedByUserId)?.name ??
        "Unknown user",
      status:
        receiptDocument.processingStatus === "failed"
          ? "failed"
          : receiptDocument.reviewStatus,
      reason:
        receiptDocument.rejectionReason ??
        receiptDocument.errorMessage ??
        "Receipt processing failed.",
      createdAt: receiptDocument.updatedAt.toISOString(),
    }),
  );

  return [...rejectedReceipts, ...rejectedExpenses].sort(
    (leftRecord, rightRecord) =>
      new Date(rightRecord.createdAt).getTime() -
      new Date(leftRecord.createdAt).getTime(),
  );
}

export async function getAdminActivityLogs(): Promise<AdminActivityLog[]> {
  const users = await getUsersCollection();
  const groups = await getGroupsCollection();
  const expenses = await getExpensesCollection();
  const receipts = await getReceiptsCollection();
  const [recentUsers, recentGroups, recentExpenses, recentReceipts] = await Promise.all([
    users.find({}).sort({ createdAt: -1 }).limit(15).toArray(),
    groups.find({}).sort({ createdAt: -1 }).limit(15).toArray(),
    expenses.find({}).sort({ createdAt: -1 }).limit(15).toArray(),
    receipts.find({}).sort({ createdAt: -1 }).limit(15).toArray(),
  ]);

  const referenceMaps = await buildReferenceMaps({
    userIds: Array.from(
      new Set([
        ...recentGroups.map((groupDocument) => groupDocument.createdBy),
        ...recentExpenses.map((expenseDocument) => expenseDocument.createdBy),
        ...recentReceipts.map((receiptDocument) => receiptDocument.uploadedByUserId),
      ]),
    ).filter((userId) => MongoObjectId.isValid(userId)),
    groupIds: Array.from(
      new Set([
        ...recentExpenses.map((expenseDocument) => expenseDocument.groupId),
        ...recentReceipts
          .map((receiptDocument) => receiptDocument.groupId)
          .filter((groupId): groupId is string => Boolean(groupId)),
      ]),
    ).filter((groupId) => MongoObjectId.isValid(groupId)),
    expenseIds: [],
  });

  const activityLogs: AdminActivityLog[] = [
    ...recentUsers.map((userDocument: UserDocument) => ({
      id: `user-${userDocument._id!.toString()}`,
      eventType: "user_registered" as const,
      title: "New user registered",
      description: `${userDocument.firstName} ${userDocument.lastName}`.trim(),
      createdAt: userDocument.createdAt.toISOString(),
    })),
    ...recentGroups.map((groupDocument: GroupDocument) => ({
      id: `group-${groupDocument._id!.toString()}`,
      eventType: "group_created" as const,
      title: "Group created",
      description: `${groupDocument.name} by ${
        referenceMaps.usersById.get(groupDocument.createdBy)?.name ?? "Unknown user"
      }`,
      createdAt: groupDocument.createdAt.toISOString(),
    })),
    ...recentExpenses.map((expenseDocument: ExpenseDocument) => ({
      id: `expense-${expenseDocument._id!.toString()}`,
      eventType: "expense_created" as const,
      title: "Expense recorded",
      description: `${expenseDocument.title} in ${
        referenceMaps.groupsById.get(expenseDocument.groupId) ?? "Unknown group"
      }`,
      createdAt: expenseDocument.createdAt.toISOString(),
    })),
    ...recentReceipts.map((receiptDocument: ReceiptUploadDocument) => ({
      id: `receipt-${receiptDocument._id!.toString()}`,
      eventType: "receipt_uploaded" as const,
      title: "Receipt uploaded",
      description: `${receiptDocument.originalFileName} by ${
        referenceMaps.usersById.get(receiptDocument.uploadedByUserId)?.name ??
        "Unknown user"
      }`,
      createdAt: receiptDocument.createdAt.toISOString(),
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
