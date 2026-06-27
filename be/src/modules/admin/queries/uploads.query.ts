import { ObjectId as MongoObjectId } from "mongodb";
import { getReceiptsCollection, type ReceiptUploadDocument } from "../../receipts/receipts.service.js";
import type { AdminUploadRecord } from "../admin.types.js";
import { buildReferenceMaps } from "./admin.shared.js";

export async function getAdminUploadRecords(): Promise<AdminUploadRecord[]> {
  const receipts = await getReceiptsCollection();
  const receiptDocuments = await receipts
    .find({})
    .sort({ createdAt: -1 })
    .limit(100)
    .toArray();

  const referenceMaps = await buildReferenceMaps({
    expenseIds: Array.from(
      new Set(
        receiptDocuments
          .map((receiptDocument) => receiptDocument.expenseId)
          .filter((expenseId): expenseId is string => Boolean(expenseId)),
      ),
    ).filter((expenseId) => MongoObjectId.isValid(expenseId)),
    groupIds: Array.from(
      new Set(
        receiptDocuments
          .map((receiptDocument) => receiptDocument.groupId)
          .filter((groupId): groupId is string => Boolean(groupId)),
      ),
    ).filter((groupId) => MongoObjectId.isValid(groupId)),
    userIds: Array.from(
      new Set(receiptDocuments.map((receiptDocument) => receiptDocument.uploadedByUserId)),
    ).filter((userId) => MongoObjectId.isValid(userId)),
  });

  return receiptDocuments.map((receiptDocument: ReceiptUploadDocument) => {
    const uploadedBy =
      referenceMaps.usersById.get(receiptDocument.uploadedByUserId) ?? {
        email: "",
        name: "Unknown user",
      };
    const expense = receiptDocument.expenseId
      ? referenceMaps.expensesById.get(receiptDocument.expenseId)
      : null;

    return {
      createdAt: receiptDocument.createdAt.toISOString(),
      expenseId: receiptDocument.expenseId,
      expenseTitle: expense?.title ?? null,
      fileKind: receiptDocument.fileKind,
      groupId: receiptDocument.groupId,
      groupName: receiptDocument.groupId
        ? referenceMaps.groupsById.get(receiptDocument.groupId) ?? null
        : null,
      id: receiptDocument._id!.toString(),
      mimeType: receiptDocument.mimeType,
      ocrStatus: receiptDocument.ocrStatus,
      originalFileName: receiptDocument.originalFileName,
      processingStatus: receiptDocument.processingStatus,
      reviewStatus: receiptDocument.reviewStatus,
      sizeInBytes: receiptDocument.sizeInBytes,
      storagePath: receiptDocument.storagePath,
      storedFileName: receiptDocument.storedFileName,
      updatedAt: receiptDocument.updatedAt.toISOString(),
      uploadedByEmail: uploadedBy.email,
      uploadedByName: uploadedBy.name,
      uploadedByUserId: receiptDocument.uploadedByUserId,
    };
  });
}
