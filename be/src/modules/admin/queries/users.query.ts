import { ObjectId as MongoObjectId } from "mongodb";
import {
  getUserById,
  getUsersCollection,
  toPublicUser,
  type UserDocument,
} from "../../auth/auth.service.js";
import { getExpensesCollection } from "../../expenses/expenses.service.js";
import { getReceiptsCollection } from "../../receipts/receipts.service.js";
import type {
  AdminUserDetail,
  AdminUserGroupMembership,
  AdminUserRecord,
} from "../admin.types.js";
import { getGroupsCollection, type GroupDocument } from "./admin.shared.js";

function getUserFullName(user: UserDocument) {
  return `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email;
}

function buildUserGroups(
  groupDocuments: GroupDocument[],
  userId: string,
): AdminUserGroupMembership[] {
  return groupDocuments
    .filter((group) => group._id && group.members.some((member) => member.userId === userId))
    .map((group) => ({
      id: group._id!.toString(),
      name: group.name,
      role:
        group.members.find((member) => member.userId === userId)?.role ?? "member",
      updatedAt: group.updatedAt.toISOString(),
    }))
    .sort(
      (leftGroup, rightGroup) =>
        new Date(rightGroup.updatedAt).getTime() -
        new Date(leftGroup.updatedAt).getTime(),
    );
}

function buildUserExpenseSummary(expenseDocuments: Array<{
  amount: number;
  createdBy: string;
  paidByUserId: string;
  participants: Array<{ userId: string }>;
  settlementStatus: "pending" | "settled";
}>, userId: string) {
  let expenseCount = 0;
  let pendingSettlementCount = 0;
  let settledExpenseCount = 0;
  let totalPaidAmount = 0;

  expenseDocuments.forEach((expense) => {
    const isInvolved =
      expense.createdBy === userId ||
      expense.paidByUserId === userId ||
      expense.participants.some((participant) => participant.userId === userId);

    if (!isInvolved) {
      return;
    }

    expenseCount += 1;

    if (expense.settlementStatus === "pending") {
      pendingSettlementCount += 1;
    } else {
      settledExpenseCount += 1;
    }

    if (expense.paidByUserId === userId) {
      totalPaidAmount += expense.amount;
    }
  });

  return {
    expenseCount,
    pendingSettlementCount,
    settledExpenseCount,
    totalPaidAmount: Number(totalPaidAmount.toFixed(2)),
  };
}

function toAdminUserRecord(params: {
  expenseDocuments: Array<{
    amount: number;
    createdBy: string;
    paidByUserId: string;
    participants: Array<{ userId: string }>;
    settlementStatus: "pending" | "settled";
  }>;
  groupDocuments: GroupDocument[];
  receiptDocuments: Array<{ uploadedByUserId: string }>;
  user: UserDocument;
}): AdminUserRecord {
  const { expenseDocuments, groupDocuments, receiptDocuments, user } = params;
  const publicUser = toPublicUser(user);
  const groupCount = groupDocuments.filter((group) =>
    group.members.some((member) => member.userId === publicUser.id),
  ).length;
  const ownedGroupCount = groupDocuments.filter(
    (group) => group.createdBy === publicUser.id,
  ).length;
  const receiptUploadCount = receiptDocuments.filter(
    (receipt) => receipt.uploadedByUserId === publicUser.id,
  ).length;
  const expenseSummary = buildUserExpenseSummary(expenseDocuments, publicUser.id);

  return {
    ...publicUser,
    expenseCount: expenseSummary.expenseCount,
    fullName: getUserFullName(user),
    groupCount,
    ownedGroupCount,
    pendingSettlementCount: expenseSummary.pendingSettlementCount,
    receiptUploadCount,
    settledExpenseCount: expenseSummary.settledExpenseCount,
    totalPaidAmount: expenseSummary.totalPaidAmount,
  };
}

function escapeCsvValue(value: string | number) {
  const normalizedValue = String(value ?? "");

  if (/[",\n]/.test(normalizedValue)) {
    return `"${normalizedValue.replace(/"/g, "\"\"")}"`;
  }

  return normalizedValue;
}

export function serializeAdminUsersCsv(users: AdminUserRecord[]) {
  const headers = [
    "id",
    "fullName",
    "email",
    "role",
    "defaultCurrency",
    "groupCount",
    "ownedGroupCount",
    "expenseCount",
    "pendingSettlementCount",
    "settledExpenseCount",
    "receiptUploadCount",
    "totalPaidAmount",
    "createdAt",
    "updatedAt",
  ];

  const rows = users.map((user) =>
    [
      user.id,
      user.fullName,
      user.email,
      user.role,
      user.defaultCurrency,
      user.groupCount,
      user.ownedGroupCount,
      user.expenseCount,
      user.pendingSettlementCount,
      user.settledExpenseCount,
      user.receiptUploadCount,
      user.totalPaidAmount,
      user.createdAt,
      user.updatedAt,
    ]
      .map((value) => escapeCsvValue(value))
      .join(","),
  );

  return [headers.join(","), ...rows].join("\n");
}

export async function getAdminUsers(): Promise<AdminUserRecord[]> {
  const users = await getUsersCollection();
  const groups = await getGroupsCollection();
  const expenses = await getExpensesCollection();
  const receipts = await getReceiptsCollection();

  const [userDocuments, groupDocuments, expenseDocuments, receiptDocuments] =
    await Promise.all([
      users.find({}).sort({ createdAt: -1 }).toArray(),
      groups.find({}).toArray(),
      expenses
        .find(
          {},
          {
            projection: {
              amount: 1,
              createdBy: 1,
              paidByUserId: 1,
              participants: 1,
              settlementStatus: 1,
            },
          },
        )
        .toArray(),
      receipts
        .find(
          {},
          {
            projection: {
              uploadedByUserId: 1,
            },
          },
        )
        .toArray(),
    ]);

  return userDocuments.map((user) =>
    toAdminUserRecord({
      expenseDocuments,
      groupDocuments,
      receiptDocuments,
      user,
    }),
  );
}

export async function getAdminUserById(
  userId: string,
): Promise<AdminUserDetail | null> {
  if (!MongoObjectId.isValid(userId)) {
    return null;
  }

  const [publicUser, groupDocuments, expenseDocuments, receiptDocuments] =
    await Promise.all([
      getUserById(userId),
      getGroupsCollection().then((groups) => groups.find({}).toArray()),
      getExpensesCollection().then((expenses) =>
        expenses
          .find(
            {},
            {
              projection: {
                amount: 1,
                createdBy: 1,
                paidByUserId: 1,
                participants: 1,
                settlementStatus: 1,
              },
            },
          )
          .toArray(),
      ),
      getReceiptsCollection().then((receipts) =>
        receipts
          .find(
            {},
            {
              projection: {
                uploadedByUserId: 1,
              },
            },
          )
          .toArray(),
      ),
    ]);

  if (!publicUser) {
    return null;
  }

  const users = await getUsersCollection();
  const userDocument = await users.findOne({ _id: new MongoObjectId(userId) });

  if (!userDocument) {
    return null;
  }

  const record = toAdminUserRecord({
    expenseDocuments,
    groupDocuments,
    receiptDocuments,
    user: userDocument,
  });

  return {
    ...record,
    groups: buildUserGroups(groupDocuments, userId),
  };
}

export async function getAdminUserDependencySummary(userId: string) {
  if (!MongoObjectId.isValid(userId)) {
    return null;
  }

  const groups = await getGroupsCollection();
  const expenses = await getExpensesCollection();
  const receipts = await getReceiptsCollection();

  const [ownedGroupCount, groupCount, expenseCount, receiptUploadCount] =
    await Promise.all([
      groups.countDocuments({ createdBy: userId }),
      groups.countDocuments({ "members.userId": userId }),
      expenses.countDocuments({
        $or: [
          { createdBy: userId },
          { paidByUserId: userId },
          { "participants.userId": userId },
        ],
      }),
      receipts.countDocuments({ uploadedByUserId: userId }),
    ]);

  return {
    expenseCount,
    groupCount,
    ownedGroupCount,
    receiptUploadCount,
  };
}
