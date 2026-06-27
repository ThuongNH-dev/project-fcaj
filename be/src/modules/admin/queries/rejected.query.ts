import { ObjectId as MongoObjectId } from "mongodb";
import {
  getExpensesCollection,
  type ExpenseDocument,
} from "../../expenses/expenses.service.js";
import {
  getReceiptsCollection,
  type ReceiptUploadDocument,
} from "../../receipts/receipts.service.js";
import type { AdminRejectedRecord } from "../admin.types.js";
import { buildReferenceMaps } from "./admin.shared.js";

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
    expenseIds: [],
    groupIds: Array.from(
      new Set([
        ...rejectedExpenseDocuments.map((expenseDocument) => expenseDocument.groupId),
        ...rejectedReceiptDocuments
          .map((receiptDocument) => receiptDocument.groupId)
          .filter((groupId): groupId is string => Boolean(groupId)),
      ]),
    ).filter((groupId) => MongoObjectId.isValid(groupId)),
    userIds: Array.from(
      new Set([
        ...rejectedExpenseDocuments.map((expenseDocument) => expenseDocument.createdBy),
        ...rejectedReceiptDocuments.map((receiptDocument) => receiptDocument.uploadedByUserId),
      ]),
    ).filter((userId) => MongoObjectId.isValid(userId)),
  });

  const rejectedExpenses = rejectedExpenseDocuments.map(
    (expenseDocument: ExpenseDocument): AdminRejectedRecord => ({
      actorName:
        referenceMaps.usersById.get(expenseDocument.createdBy)?.name ?? "Unknown user",
      createdAt: expenseDocument.updatedAt.toISOString(),
      entityType: "expense",
      groupName: referenceMaps.groupsById.get(expenseDocument.groupId) ?? null,
      id: `expense-${expenseDocument._id!.toString()}`,
      reason: expenseDocument.rejectionReason ?? "Rejected by admin.",
      status: expenseDocument.reviewStatus,
      title: expenseDocument.title,
    }),
  );

  const rejectedReceipts = rejectedReceiptDocuments.map(
    (receiptDocument: ReceiptUploadDocument): AdminRejectedRecord => ({
      actorName:
        referenceMaps.usersById.get(receiptDocument.uploadedByUserId)?.name ??
        "Unknown user",
      createdAt: receiptDocument.updatedAt.toISOString(),
      entityType: "receipt",
      groupName: receiptDocument.groupId
        ? referenceMaps.groupsById.get(receiptDocument.groupId) ?? null
        : null,
      id: `receipt-${receiptDocument._id!.toString()}`,
      reason:
        receiptDocument.rejectionReason ??
        receiptDocument.errorMessage ??
        "Receipt processing failed.",
      status:
        receiptDocument.processingStatus === "failed"
          ? "failed"
          : receiptDocument.reviewStatus,
      title: receiptDocument.originalFileName,
    }),
  );

  return [...rejectedReceipts, ...rejectedExpenses].sort(
    (leftRecord, rightRecord) =>
      new Date(rightRecord.createdAt).getTime() -
      new Date(leftRecord.createdAt).getTime(),
  );
}
