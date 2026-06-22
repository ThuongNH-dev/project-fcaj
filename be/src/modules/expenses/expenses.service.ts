import { ObjectId as MongoObjectId } from "mongodb";
import type { Collection, IndexDescription, ObjectId } from "mongodb";
import { connectToMongo } from "../../db/mongo.js";
import { getReceiptUploadsByIdsForUser } from "../receipts/receipts.service.js";
import type { PublicReceiptUpload } from "../receipts/receipts.types.js";
import type {
  CreateExpenseInput,
  PublicExpense,
} from "./expenses.types.js";

interface ExpenseDocument {
  _id?: ObjectId;
  uploadedByUserId: string;
  title: string;
  category: string;
  paidBy: string;
  amount: string;
  yourShare: string;
  date: string;
  status: "Pending" | "Settled";
  groupId: string | null;
  groupName: string | null;
  receiptId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SUPPORTED_EXPENSE_STATUSES = new Set(["Pending", "Settled"] as const);

let indexesEnsured = false;

async function ensureExpenseIndexes(collection: Collection<ExpenseDocument>) {
  if (indexesEnsured) {
    return;
  }

  const indexes: IndexDescription[] = [
    {
      key: { uploadedByUserId: 1, createdAt: -1 },
      name: "uploadedBy_createdAt_idx",
    },
    {
      key: { uploadedByUserId: 1, groupId: 1, createdAt: -1 },
      name: "uploadedBy_group_createdAt_idx",
    },
    {
      key: { receiptId: 1 },
      name: "receipt_idx",
    },
  ];

  await collection.createIndexes(indexes);
  indexesEnsured = true;
}

async function getExpensesCollection(): Promise<Collection<ExpenseDocument>> {
  const db = await connectToMongo();
  const collection = db.collection<ExpenseDocument>("expenses");

  await ensureExpenseIndexes(collection);

  return collection;
}

export function normalizeExpenseRequiredText(value: string, fieldName: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalizedValue;
}

export function normalizeExpenseOptionalText(value?: string | null) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
}

export function normalizeExpenseStatus(status?: string) {
  const normalizedStatus = status?.trim() || "Pending";

  if (
    !SUPPORTED_EXPENSE_STATUSES.has(
      normalizedStatus as "Pending" | "Settled",
    )
  ) {
    throw new Error("Expense status is invalid.");
  }

  return normalizedStatus as "Pending" | "Settled";
}

export function normalizeExpenseReceiptId(receiptId?: string | null) {
  const normalizedReceiptId = normalizeExpenseOptionalText(receiptId);

  if (!normalizedReceiptId) {
    return null;
  }

  if (!MongoObjectId.isValid(normalizedReceiptId)) {
    throw new Error("Expense receipt id is invalid.");
  }

  return normalizedReceiptId;
}

export async function createExpense(
  input: CreateExpenseInput,
  receipt?: PublicReceiptUpload | null,
): Promise<PublicExpense> {
  const expenses = await getExpensesCollection();
  const title = normalizeExpenseRequiredText(input.title, "Expense title");
  const category = normalizeExpenseRequiredText(input.category, "Expense category");
  const paidBy = normalizeExpenseRequiredText(input.paidBy, "Expense paid by");
  const amount = normalizeExpenseRequiredText(input.amount, "Expense amount");
  const yourShare = normalizeExpenseRequiredText(input.yourShare, "Expense share");
  const date = normalizeExpenseRequiredText(input.date, "Expense date");
  const status = normalizeExpenseStatus(input.status);
  const groupId = normalizeExpenseOptionalText(input.groupId);
  const groupName = normalizeExpenseOptionalText(input.groupName);
  const receiptId = normalizeExpenseReceiptId(input.receiptId);
  const createdAt = new Date();
  const updatedAt = createdAt;
  const result = await expenses.insertOne({
    uploadedByUserId: input.uploadedByUserId,
    title,
    category,
    paidBy,
    amount,
    yourShare,
    date,
    status,
    groupId,
    groupName,
    receiptId,
    createdAt,
    updatedAt,
  });

  return toPublicExpense(
    {
      _id: result.insertedId,
      uploadedByUserId: input.uploadedByUserId,
      title,
      category,
      paidBy,
      amount,
      yourShare,
      date,
      status,
      groupId,
      groupName,
      receiptId,
      createdAt,
      updatedAt,
    },
    receipt ?? null,
  );
}

export async function getExpensesByUserId(
  userId: string,
  groupId?: string | null,
): Promise<PublicExpense[]> {
  const expenses = await getExpensesCollection();
  const normalizedGroupId = normalizeExpenseOptionalText(groupId);
  const expenseDocuments = await expenses
    .find({
      uploadedByUserId: userId,
      ...(normalizedGroupId ? { groupId: normalizedGroupId } : {}),
    })
    .sort({ createdAt: -1 })
    .toArray();

  const receiptIds = expenseDocuments
    .map((expenseDocument) => expenseDocument.receiptId)
    .filter((receiptId): receiptId is string => Boolean(receiptId));
  const receiptsById = await getReceiptUploadsByIdsForUser(receiptIds, userId);

  return expenseDocuments.map((expenseDocument) =>
    toPublicExpense(
      expenseDocument,
      expenseDocument.receiptId
        ? receiptsById.get(expenseDocument.receiptId) ?? null
        : null,
    ),
  );
}

export function toPublicExpense(
  expense: ExpenseDocument,
  receipt: PublicReceiptUpload | null,
): PublicExpense {
  if (!expense._id) {
    throw new Error("Expense document is missing an id.");
  }

  return {
    id: expense._id.toString(),
    uploadedByUserId: expense.uploadedByUserId,
    title: expense.title,
    category: expense.category,
    paidBy: expense.paidBy,
    amount: expense.amount,
    yourShare: expense.yourShare,
    date: expense.date,
    status: expense.status,
    groupId: expense.groupId,
    groupName: expense.groupName,
    receiptId: expense.receiptId,
    receipt,
    createdAt: expense.createdAt.toISOString(),
    updatedAt: expense.updatedAt.toISOString(),
  };
}
