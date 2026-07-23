import { ObjectId as MongoObjectId } from "mongodb";
import type { Collection, IndexDescription, ObjectId } from "mongodb";
import { connectToMongo, getMongoClient } from "../../db/mongo.js";
import { SettlementConflictError } from "../../errors/settlement-conflict.error.js";
import {
  canSettleExpense,
  isUserInGroup,
  areUsersInGroup,
} from "../../policies/group.policy.js";
import type { SupportedCurrency } from "../auth/auth.types.js";
import { getGroupByIdForUser, getGroupIdsByUserId } from "../groups/groups.service.js";
import { getReceiptUploadByIdForUser } from "../receipts/receipts.service.js";
import {
  createSettlementsForExpense,
  reconcileSettlements,
  deleteSettlementsByExpenseId,
  hasAnySentSettlement,
  cascadeSettleByExpenseId,
} from "../settlements/settlements.service.js";
import type {
  CreateExpenseInput,
  ExpenseCategory,
  ExpenseParticipantShare,
  ExpenseReviewStatus,
  ExpenseSettlementStatus,
  ExpenseSplitMode,
  PublicExpense,
  UpdateExpenseInput,
  SettleExpenseInput,
} from "./expenses.types.js";

export interface ExpenseDocument {
  _id?: ObjectId;
  groupId: string;
  createdBy: string;
  paidByUserId: string;
  title: string;
  description: string;
  expenseDate: Date;
  category: ExpenseCategory;
  currency: SupportedCurrency;
  amount: number;
  splitMode: ExpenseSplitMode;
  participants: ExpenseParticipantShare[];
  receiptId: string | null;
  settlementStatus: ExpenseSettlementStatus;
  settledAt: Date | null;
  settledBy: string | null;
  settlementNote: string | null;
  reviewStatus: ExpenseReviewStatus;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const SUPPORTED_CURRENCIES = new Set<SupportedCurrency>(["USD", "VND"]);
const SUPPORTED_EXPENSE_CATEGORIES = new Set<ExpenseCategory>([
  "food",
  "travel",
  "accommodation",
  "entertainment",
  "shopping",
  "utilities",
  "other",
]);
const SUPPORTED_SPLIT_MODES = new Set<ExpenseSplitMode>(["equal", "custom"]);
const SUPPORTED_SETTLEMENT_STATUSES = new Set<ExpenseSettlementStatus>([
  "pending",
  "settled",
]);
const SUPPORTED_REVIEW_STATUSES = new Set<ExpenseReviewStatus>([
  "pending",
  "approved",
  "rejected",
]);

let indexesEnsured = false;

async function ensureExpenseIndexes(collection: Collection<ExpenseDocument>) {
  if (indexesEnsured) {
    return;
  }

  const indexes: IndexDescription[] = [
    { key: { groupId: 1, updatedAt: -1 }, name: "group_updatedAt_idx" },
    { key: { createdBy: 1, createdAt: -1 }, name: "createdBy_createdAt_idx" },
    { key: { paidByUserId: 1, createdAt: -1 }, name: "paidBy_createdAt_idx" },
    { key: { reviewStatus: 1, updatedAt: -1 }, name: "review_updatedAt_idx" },
    {
      key: { settlementStatus: 1, updatedAt: -1 },
      name: "settlement_updatedAt_idx",
    },
    { key: { "participants.userId": 1 }, name: "participant_user_idx" },
    { key: { receiptId: 1 }, name: "receipt_idx", sparse: true },
  ];

  await collection.createIndexes(indexes);
  indexesEnsured = true;
}

export async function getExpensesCollection(): Promise<Collection<ExpenseDocument>> {
  const db = await connectToMongo();
  const collection = db.collection<ExpenseDocument>("expenses");

  await ensureExpenseIndexes(collection);

  return collection;
}

export function normalizeExpenseTitle(title: string) {
  const normalizedTitle = title.trim();

  if (!normalizedTitle) {
    throw new Error("Expense title is required.");
  }

  return normalizedTitle;
}

export function normalizeExpenseDescription(description?: string) {
  return description?.trim() ?? "";
}

export function normalizeExpenseDate(expenseDate?: string) {
  if (!expenseDate?.trim()) {
    return new Date();
  }

  const normalizedExpenseDate = new Date(expenseDate);

  if (Number.isNaN(normalizedExpenseDate.getTime())) {
    throw new Error("Expense date is invalid.");
  }

  return normalizedExpenseDate;
}

export function normalizeExpenseCurrency(currency?: string): SupportedCurrency {
  const normalizedCurrency = currency?.trim().toUpperCase();

  if (!normalizedCurrency) {
    return "USD";
  }

  if (!SUPPORTED_CURRENCIES.has(normalizedCurrency as SupportedCurrency)) {
    throw new Error("Expense currency must be either USD or VND.");
  }

  return normalizedCurrency as SupportedCurrency;
}

export function normalizeExpenseCategory(category: string): ExpenseCategory {
  const normalizedCategory = category.trim().toLowerCase();

  if (!SUPPORTED_EXPENSE_CATEGORIES.has(normalizedCategory as ExpenseCategory)) {
    throw new Error("Expense category is invalid.");
  }

  return normalizedCategory as ExpenseCategory;
}

export function normalizeExpenseAmount(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Expense amount must be greater than zero.");
  }

  return Number(amount.toFixed(2));
}

export function normalizeExpenseSplitMode(splitMode?: string): ExpenseSplitMode {
  const normalizedSplitMode = splitMode?.trim().toLowerCase() ?? "equal";

  if (!SUPPORTED_SPLIT_MODES.has(normalizedSplitMode as ExpenseSplitMode)) {
    throw new Error("Expense split mode is invalid.");
  }

  return normalizedSplitMode as ExpenseSplitMode;
}

export function normalizeExpenseSettlementStatus(
  settlementStatus?: string,
): ExpenseSettlementStatus {
  const normalizedSettlementStatus =
    settlementStatus?.trim().toLowerCase() ?? "pending";

  if (
    !SUPPORTED_SETTLEMENT_STATUSES.has(
      normalizedSettlementStatus as ExpenseSettlementStatus,
    )
  ) {
    throw new Error("Expense settlement status is invalid.");
  }

  return normalizedSettlementStatus as ExpenseSettlementStatus;
}

export function normalizeExpenseReviewStatus(
  reviewStatus?: string,
): ExpenseReviewStatus {
  const normalizedReviewStatus = reviewStatus?.trim().toLowerCase() ?? "pending";

  if (!SUPPORTED_REVIEW_STATUSES.has(normalizedReviewStatus as ExpenseReviewStatus)) {
    throw new Error("Expense review status is invalid.");
  }

  return normalizedReviewStatus as ExpenseReviewStatus;
}

export function normalizeExpenseParticipants(
  participants: ExpenseParticipantShare[],
): ExpenseParticipantShare[] {
  if (!participants.length) {
    throw new Error("Expense participants are required.");
  }

  const participantSharesByUserId = new Map<string, number>();

  for (const participant of participants) {
    const normalizedUserId = participant.userId.trim();

    if (!normalizedUserId) {
      throw new Error("Expense participant user id is required.");
    }

    if (!Number.isFinite(participant.shareAmount) || participant.shareAmount <= 0) {
      throw new Error("Expense participant share amount must be greater than zero.");
    }

    const normalizedShareAmount = Number(participant.shareAmount.toFixed(2));
    const currentShareAmount = participantSharesByUserId.get(normalizedUserId) ?? 0;

    participantSharesByUserId.set(
      normalizedUserId,
      Number((currentShareAmount + normalizedShareAmount).toFixed(2)),
    );
  }

  return Array.from(participantSharesByUserId, ([userId, shareAmount]) => ({
    userId,
    shareAmount,
  }));
}

export function normalizeExpenseOptionalReferenceId(value?: string | null) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
}

export function normalizeExpenseSettlementNote(value?: string | null) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
}

function getParticipantTotalAmount(participants: ExpenseParticipantShare[]) {
  return Number(
    participants
      .reduce((totalAmount, participant) => totalAmount + participant.shareAmount, 0)
      .toFixed(2),
  );
}

export async function createExpense(
  input: CreateExpenseInput,
): Promise<PublicExpense> {
  const expenses = await getExpensesCollection();
  const normalizedTitle = normalizeExpenseTitle(input.title);
  const normalizedDescription = normalizeExpenseDescription(input.description);
  const normalizedExpenseDate = normalizeExpenseDate(input.expenseDate);
  const normalizedCategory = normalizeExpenseCategory(input.category);
  const normalizedCurrency = normalizeExpenseCurrency(input.currency);
  const normalizedAmount = normalizeExpenseAmount(input.amount);
  const normalizedSplitMode = normalizeExpenseSplitMode(input.splitMode);
  const normalizedParticipants = normalizeExpenseParticipants(input.participants);
  const normalizedReceiptId = normalizeExpenseOptionalReferenceId(input.receiptId);
  const participantTotalAmount = getParticipantTotalAmount(normalizedParticipants);

  if (participantTotalAmount !== normalizedAmount) {
    throw new Error("Expense participant share amounts must equal the total amount.");
  }

  const createdAt = new Date();
  const updatedAt = createdAt;

  const client = getMongoClient();
  const session = client.startSession();

  try {
    let insertedId: ObjectId;

    await session.withTransaction(async () => {
      const result = await expenses.insertOne(
        {
          groupId: input.groupId,
          createdBy: input.createdBy,
          paidByUserId: input.paidByUserId,
          title: normalizedTitle,
          description: normalizedDescription,
          expenseDate: normalizedExpenseDate,
          category: normalizedCategory,
          currency: normalizedCurrency,
          amount: normalizedAmount,
          splitMode: normalizedSplitMode,
          participants: normalizedParticipants,
          receiptId: normalizedReceiptId,
          settlementStatus: "pending",
          settledAt: null,
          settledBy: null,
          settlementNote: null,
          reviewStatus: "pending",
          rejectionReason: null,
          reviewedBy: null,
          reviewedAt: null,
          createdAt,
          updatedAt,
        },
        { session },
      );

      insertedId = result.insertedId;

      await createSettlementsForExpense(
        insertedId.toString(),
        input.groupId,
        input.paidByUserId,
        normalizedParticipants,
        normalizedCurrency,
        session,
      );
    });

    return toPublicExpense({
      _id: insertedId!,
      groupId: input.groupId,
      createdBy: input.createdBy,
      paidByUserId: input.paidByUserId,
      title: normalizedTitle,
      description: normalizedDescription,
      expenseDate: normalizedExpenseDate,
      category: normalizedCategory,
      currency: normalizedCurrency,
      amount: normalizedAmount,
      splitMode: normalizedSplitMode,
      participants: normalizedParticipants,
      receiptId: normalizedReceiptId,
      settlementStatus: "pending",
      settledAt: null,
      settledBy: null,
      settlementNote: null,
      reviewStatus: "pending",
      rejectionReason: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt,
      updatedAt,
    });
  } finally {
    await session.endSession();
  }
}

export async function updateExpense(
  input: UpdateExpenseInput,
): Promise<PublicExpense | null> {
  if (!MongoObjectId.isValid(input.expenseId)) {
    return null;
  }

  const expenses = await getExpensesCollection();
  const existingExpense = await expenses.findOne({
    _id: new MongoObjectId(input.expenseId),
  });

  if (!existingExpense?._id) {
    return null;
  }

  if (existingExpense.createdBy !== input.userId) {
    throw new Error("You are not allowed to update this expense.");
  }

  // 1. Chặn update expense đã settled
  if (existingExpense.settlementStatus === "settled") {
    throw new SettlementConflictError(
      "Cannot update this expense because it has already been settled.",
    );
  }

  // 2. Validate group membership
  const group = await getGroupByIdForUser(existingExpense.groupId, input.userId);
  if (!group) {
    return null;
  }

  if (!isUserInGroup(group.members, input.paidByUserId)) {
    throw new Error("Paid by user must be a member of the selected group.");
  }

  if (
    !areUsersInGroup(
      group.members,
      input.participants.map((p) => p.userId),
    )
  ) {
    throw new Error("All expense participants must belong to the selected group.");
  }

  if (input.receiptId) {
    const receipt = await getReceiptUploadByIdForUser(input.receiptId, input.userId);
    if (!receipt || receipt.groupId !== existingExpense.groupId) {
      throw new Error("Receipt not found or does not belong to the selected group.");
    }
  }

  const normalizedTitle = normalizeExpenseTitle(input.title);
  const normalizedDescription = normalizeExpenseDescription(input.description);
  const normalizedExpenseDate = normalizeExpenseDate(input.expenseDate);
  const normalizedCategory = normalizeExpenseCategory(input.category);
  const normalizedCurrency = normalizeExpenseCurrency(existingExpense.currency);
  const normalizedAmount = normalizeExpenseAmount(input.amount);
  const normalizedSplitMode = normalizeExpenseSplitMode(input.splitMode);
  const normalizedParticipants = normalizeExpenseParticipants(input.participants);
  const normalizedReceiptId = normalizeExpenseOptionalReferenceId(input.receiptId);
  const participantTotalAmount = getParticipantTotalAmount(normalizedParticipants);

  if (participantTotalAmount !== normalizedAmount) {
    throw new Error("Expense participant share amounts must equal the total amount.");
  }

  const updatedAt = new Date();
  const client = getMongoClient();
  const session = client.startSession();

  try {
    let result: ExpenseDocument | null = null;

    await session.withTransaction(async () => {
      // Reconcile settlements FIRST — may throw SettlementConflictError
      await reconcileSettlements(
        input.expenseId,
        existingExpense.groupId,
        input.paidByUserId,
        normalizedParticipants,
        normalizedCurrency,
        session,
      );

      // Then update the expense
      result = await expenses.findOneAndUpdate(
        {
          _id: new MongoObjectId(input.expenseId),
          createdBy: input.userId,
          settlementStatus: "pending",
        },
        {
          $set: {
            paidByUserId: input.paidByUserId,
            title: normalizedTitle,
            description: normalizedDescription,
            expenseDate: normalizedExpenseDate,
            category: normalizedCategory,
            currency: normalizedCurrency,
            amount: normalizedAmount,
            splitMode: normalizedSplitMode,
            participants: normalizedParticipants,
            receiptId: normalizedReceiptId,
            updatedAt,
          },
        },
        {
          returnDocument: "after",
          session,
        },
      );

      if (!result) {
        throw new SettlementConflictError(
          "Cannot update this expense because it has already been settled.",
        );
      }
    });

    return result ? toPublicExpense(result) : null;
  } finally {
    await session.endSession();
  }
}

export async function deleteExpense(
  expenseId: string,
  userId: string,
): Promise<boolean> {
  if (!MongoObjectId.isValid(expenseId)) {
    return false;
  }

  const expenses = await getExpensesCollection();
  const expenseDocument = await expenses.findOne({
    _id: new MongoObjectId(expenseId),
  });

  if (!expenseDocument?._id) {
    return false;
  }

  if (expenseDocument.createdBy !== userId) {
    throw new Error("You are not allowed to delete this expense.");
  }

  const client = getMongoClient();
  const session = client.startSession();

  try {
    let deleted = false;

    await session.withTransaction(async () => {
      // Đọc lại expense bằng cùng session
      const currentExpense = await expenses.findOne(
        { _id: new MongoObjectId(expenseId) },
        { session }
      );

      if (!currentExpense || currentExpense.createdBy !== userId) {
        throw new Error("You are not allowed to delete this expense.");
      }

      if (currentExpense.settlementStatus === "settled") {
        throw new SettlementConflictError(
          "Cannot delete this expense because it has already been settled.",
        );
      }

      const hasSent = await hasAnySentSettlement(expenseId, session);
      if (hasSent) {
        throw new SettlementConflictError(
          "Cannot delete this expense because one or more payments have already been marked as sent.",
        );
      }

      // Delete all pending settlements first
      await deleteSettlementsByExpenseId(expenseId, session);

      // Then delete the expense
      const result = await expenses.deleteOne(
        {
          _id: new MongoObjectId(expenseId),
          createdBy: userId,
        },
        { session },
      );

      if (result.deletedCount === 0) {
        throw new Error("Failed to delete expense.");
      }

      deleted = result.deletedCount > 0;
    });

    return deleted;
  } finally {
    await session.endSession();
  }
}

export async function getExpensesByUserId(userId: string): Promise<PublicExpense[]> {
  const groupIds = await getGroupIdsByUserId(userId);

  if (groupIds.length === 0) {
    return [];
  }

  const expenses = await getExpensesCollection();
  const expenseDocuments = await expenses
    .find({
      groupId: {
        $in: groupIds,
      },
    })
    .sort({ updatedAt: -1 })
    .toArray();

  return expenseDocuments.map(toPublicExpense);
}

export async function getExpenseByIdForUser(
  expenseId: string,
  userId: string,
): Promise<PublicExpense | null> {
  if (!MongoObjectId.isValid(expenseId)) {
    return null;
  }

  const groupIds = await getGroupIdsByUserId(userId);

  if (groupIds.length === 0) {
    return null;
  }

  const expenses = await getExpensesCollection();
  const expenseDocument = await expenses.findOne({
    _id: new MongoObjectId(expenseId),
    groupId: {
      $in: groupIds,
    },
  });

  return expenseDocument ? toPublicExpense(expenseDocument) : null;
}

export async function markExpenseAsSettled(
  input: SettleExpenseInput,
): Promise<PublicExpense | null> {
  if (!MongoObjectId.isValid(input.expenseId)) {
    return null;
  }

  const expenses = await getExpensesCollection();
  const expenseDocument = await expenses.findOne({
    _id: new MongoObjectId(input.expenseId),
  });

  if (!expenseDocument?._id) {
    return null;
  }

  const group = await getGroupByIdForUser(expenseDocument.groupId, input.userId);

  if (!group) {
    return null;
  }

  if (
    !canSettleExpense({
      currentUserId: input.userId,
      paidByUserId: expenseDocument.paidByUserId,
    })
  ) {
    throw new Error("You are not allowed to settle this expense.");
  }

  if (expenseDocument.settlementStatus === "settled") {
    throw new Error("Expense is already settled.");
  }

  const updatedAt = new Date();
  const client = getMongoClient();
  const session = client.startSession();

  try {
    let result: ExpenseDocument | null = null;

    await session.withTransaction(async () => {
      // Cascade: mark all pending settlements as sent
      await cascadeSettleByExpenseId(input.expenseId, session);

      // Then update expense status
      result = await expenses.findOneAndUpdate(
        {
          _id: new MongoObjectId(input.expenseId),
          paidByUserId: input.userId,
          settlementStatus: "pending",
        },
        {
          $set: {
            settlementStatus: "settled",
            settledAt: updatedAt,
            settledBy: input.userId,
            settlementNote: normalizeExpenseSettlementNote(input.settlementNote),
            updatedAt,
          },
        },
        {
          returnDocument: "after",
          session,
        },
      );

      if (!result) {
        throw new Error("Failed to update expense status.");
      }
    });

    if (!result) {
      throw new Error("Expense settlement could not be updated.");
    }

    return toPublicExpense(result);
  } finally {
    await session.endSession();
  }
}

export function toPublicExpense(expense: ExpenseDocument): PublicExpense {
  if (!expense._id) {
    throw new Error("Expense document is missing an id.");
  }

  return {
    id: expense._id.toString(),
    groupId: expense.groupId,
    createdBy: expense.createdBy,
    paidByUserId: expense.paidByUserId,
    title: expense.title,
    description: expense.description,
    expenseDate: expense.expenseDate.toISOString(),
    category: expense.category,
    currency: expense.currency,
    amount: expense.amount,
    splitMode: expense.splitMode,
    participants: expense.participants.map((participant) => ({
      userId: participant.userId,
      shareAmount: participant.shareAmount,
    })),
    receiptId: expense.receiptId,
    settlementStatus: expense.settlementStatus,
    settledAt: expense.settledAt?.toISOString() ?? null,
    settledBy: expense.settledBy ?? null,
    settlementNote: expense.settlementNote ?? null,
    reviewStatus: expense.reviewStatus,
    rejectionReason: expense.rejectionReason,
    reviewedBy: expense.reviewedBy,
    reviewedAt: expense.reviewedAt?.toISOString() ?? null,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}
