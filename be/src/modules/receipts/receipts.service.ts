import { ObjectId as MongoObjectId } from "mongodb";
import type { Collection, IndexDescription, ObjectId } from "mongodb";
import { connectToMongo } from "../../db/mongo.js";
import type {
  CreateReceiptUploadInput,
  PublicReceiptUpload,
} from "./receipts.types.js";

const MAX_RECEIPT_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_RECEIPT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);
const SUPPORTED_RECEIPT_PROCESSING_STATUSES = new Set([
  "pending",
  "processed",
  "failed",
] as const);
const SUPPORTED_RECEIPT_REVIEW_STATUSES = new Set([
  "pending",
  "approved",
  "rejected",
] as const);
const SUPPORTED_RECEIPT_OCR_STATUSES = new Set([
  "pending",
  "completed",
  "failed",
] as const);

export interface ReceiptUploadDocument {
  _id?: ObjectId;
  uploadedByUserId: string;
  groupId: string | null;
  originalFileName: string;
  storedFileName: string;
  storagePath: string;
  mimeType: string;
  fileKind: "image" | "pdf";
  sizeInBytes: number;
  processingStatus: "pending" | "processed" | "failed";
  reviewStatus: "pending" | "approved" | "rejected";
  ocrStatus: "pending" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
}

let indexesEnsured = false;

async function ensureReceiptIndexes(collection: Collection<ReceiptUploadDocument>) {
  if (indexesEnsured) {
    return;
  }

  const indexes: IndexDescription[] = [
    {
      key: { uploadedByUserId: 1, createdAt: -1 },
      name: "uploadedBy_createdAt_idx",
    },
    { key: { groupId: 1, createdAt: -1 }, name: "group_createdAt_idx" },
    { key: { processingStatus: 1, updatedAt: -1 }, name: "processing_updatedAt_idx" },
    { key: { reviewStatus: 1, updatedAt: -1 }, name: "review_updatedAt_idx" },
    { key: { ocrStatus: 1, updatedAt: -1 }, name: "ocr_updatedAt_idx" },
    { key: { createdAt: -1 }, name: "createdAt_desc_idx" },
  ];

  await collection.createIndexes(indexes);
  indexesEnsured = true;
}

export async function getReceiptsCollection(): Promise<
  Collection<ReceiptUploadDocument>
> {
  const db = await connectToMongo();
  const collection = db.collection<ReceiptUploadDocument>("receipts");

  await ensureReceiptIndexes(collection);

  return collection;
}

export function getMaxReceiptFileSizeBytes() {
  return MAX_RECEIPT_FILE_SIZE_BYTES;
}

export function getSupportedReceiptMimeTypes() {
  return Array.from(SUPPORTED_RECEIPT_MIME_TYPES);
}

export function normalizeReceiptOriginalFileName(originalFileName: string) {
  const normalizedOriginalFileName = originalFileName.trim();

  if (!normalizedOriginalFileName) {
    throw new Error("Receipt original file name is required.");
  }

  return normalizedOriginalFileName;
}

export function normalizeReceiptMimeType(mimeType: string) {
  const normalizedMimeType = mimeType.trim().toLowerCase();

  if (!SUPPORTED_RECEIPT_MIME_TYPES.has(normalizedMimeType)) {
    throw new Error("Receipt file type must be PNG, JPG, or PDF.");
  }

  return normalizedMimeType;
}

export function normalizeReceiptSizeInBytes(sizeInBytes: number) {
  if (!Number.isInteger(sizeInBytes) || sizeInBytes <= 0) {
    throw new Error("Receipt file size must be greater than zero.");
  }

  if (sizeInBytes > MAX_RECEIPT_FILE_SIZE_BYTES) {
    throw new Error("Receipt file size must not exceed 10MB.");
  }

  return sizeInBytes;
}

export function normalizeReceiptOptionalReferenceId(value?: string | null) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
}

export function normalizeReceiptStoredFileName(storedFileName: string) {
  const normalizedStoredFileName = storedFileName.trim();

  if (!normalizedStoredFileName) {
    throw new Error("Receipt stored file name is required.");
  }

  return normalizedStoredFileName;
}

export function normalizeReceiptStoragePath(storagePath: string) {
  const normalizedStoragePath = storagePath.trim();

  if (!normalizedStoragePath) {
    throw new Error("Receipt storage path is required.");
  }

  return normalizedStoragePath;
}

export function getReceiptFileKindFromMimeType(mimeType: string) {
  return mimeType === "application/pdf" ? "pdf" : "image";
}

export function normalizeReceiptProcessingStatus(processingStatus?: string) {
  const normalizedProcessingStatus =
    processingStatus?.trim().toLowerCase() ?? "pending";

  if (
    !SUPPORTED_RECEIPT_PROCESSING_STATUSES.has(
      normalizedProcessingStatus as "pending" | "processed" | "failed",
    )
  ) {
    throw new Error("Receipt processing status is invalid.");
  }

  return normalizedProcessingStatus as "pending" | "processed" | "failed";
}

export function normalizeReceiptReviewStatus(reviewStatus?: string) {
  const normalizedReviewStatus = reviewStatus?.trim().toLowerCase() ?? "pending";

  if (
    !SUPPORTED_RECEIPT_REVIEW_STATUSES.has(
      normalizedReviewStatus as "pending" | "approved" | "rejected",
    )
  ) {
    throw new Error("Receipt review status is invalid.");
  }

  return normalizedReviewStatus as "pending" | "approved" | "rejected";
}

export function normalizeReceiptOcrStatus(ocrStatus?: string) {
  const normalizedOcrStatus = ocrStatus?.trim().toLowerCase() ?? "pending";

  if (
    !SUPPORTED_RECEIPT_OCR_STATUSES.has(
      normalizedOcrStatus as "pending" | "completed" | "failed",
    )
  ) {
    throw new Error("Receipt OCR status is invalid.");
  }

  return normalizedOcrStatus as "pending" | "completed" | "failed";
}

export async function createReceiptUpload(
  input: CreateReceiptUploadInput,
): Promise<PublicReceiptUpload> {
  const receipts = await getReceiptsCollection();
  const normalizedOriginalFileName = normalizeReceiptOriginalFileName(
    input.originalFileName,
  );
  const normalizedStoredFileName = normalizeReceiptStoredFileName(
    input.storedFileName,
  );
  const normalizedStoragePath = normalizeReceiptStoragePath(input.storagePath);
  const normalizedMimeType = normalizeReceiptMimeType(input.mimeType);
  const normalizedSizeInBytes = normalizeReceiptSizeInBytes(input.sizeInBytes);
  const normalizedGroupId = normalizeReceiptOptionalReferenceId(input.groupId);
  const normalizedFileKind = getReceiptFileKindFromMimeType(normalizedMimeType);
  const processingStatus = normalizeReceiptProcessingStatus();
  const reviewStatus = normalizeReceiptReviewStatus();
  const ocrStatus = normalizeReceiptOcrStatus();
  const createdAt = new Date();
  const updatedAt = createdAt;
  const result = await receipts.insertOne({
    uploadedByUserId: input.uploadedByUserId,
    groupId: normalizedGroupId,
    originalFileName: normalizedOriginalFileName,
    storedFileName: normalizedStoredFileName,
    storagePath: normalizedStoragePath,
    mimeType: normalizedMimeType,
    fileKind: normalizedFileKind,
    sizeInBytes: normalizedSizeInBytes,
    processingStatus,
    reviewStatus,
    ocrStatus,
    createdAt,
    updatedAt,
  });

  return toPublicReceiptUpload({
    _id: result.insertedId,
    uploadedByUserId: input.uploadedByUserId,
    groupId: normalizedGroupId,
    originalFileName: normalizedOriginalFileName,
    storedFileName: normalizedStoredFileName,
    storagePath: normalizedStoragePath,
    mimeType: normalizedMimeType,
    fileKind: normalizedFileKind,
    sizeInBytes: normalizedSizeInBytes,
    processingStatus,
    reviewStatus,
    ocrStatus,
    createdAt,
    updatedAt,
  });
}

export async function getReceiptUploadsByUserId(
  userId: string,
): Promise<PublicReceiptUpload[]> {
  const receipts = await getReceiptsCollection();
  const receiptDocuments = await receipts
    .find({
      uploadedByUserId: userId,
    })
    .sort({ createdAt: -1 })
    .toArray();

  return receiptDocuments.map(toPublicReceiptUpload);
}

export async function getReceiptUploadByIdForUser(
  receiptId: string,
  userId: string,
): Promise<PublicReceiptUpload | null> {
  if (!MongoObjectId.isValid(receiptId)) {
    return null;
  }

  const receipts = await getReceiptsCollection();
  const receiptDocument = await receipts.findOne({
    _id: new MongoObjectId(receiptId),
    uploadedByUserId: userId,
  });

  return receiptDocument ? toPublicReceiptUpload(receiptDocument) : null;
}

export async function getReceiptUploadsByIdsForUser(
  receiptIds: string[],
  userId: string,
): Promise<Map<string, PublicReceiptUpload>> {
  const validReceiptIds = Array.from(
    new Set(
      receiptIds.filter((receiptId) => MongoObjectId.isValid(receiptId)),
    ),
  );

  if (validReceiptIds.length === 0) {
    return new Map();
  }

  const receipts = await getReceiptsCollection();
  const receiptDocuments = await receipts
    .find({
      _id: {
        $in: validReceiptIds.map((receiptId) => new MongoObjectId(receiptId)),
      },
      uploadedByUserId: userId,
    })
    .toArray();

  return new Map(
    receiptDocuments.map((receiptDocument) => [
      receiptDocument._id!.toString(),
      toPublicReceiptUpload(receiptDocument),
    ]),
  );
}

export function toPublicReceiptUpload(
  receiptUpload: ReceiptUploadDocument,
): PublicReceiptUpload {
  if (!receiptUpload._id) {
    throw new Error("Receipt upload document is missing an id.");
  }

  return {
    id: receiptUpload._id.toString(),
    uploadedByUserId: receiptUpload.uploadedByUserId,
    groupId: receiptUpload.groupId,
    originalFileName: receiptUpload.originalFileName,
    storedFileName: receiptUpload.storedFileName,
    storagePath: receiptUpload.storagePath,
    mimeType: receiptUpload.mimeType,
    fileKind: receiptUpload.fileKind,
    sizeInBytes: receiptUpload.sizeInBytes,
    processingStatus: receiptUpload.processingStatus,
    reviewStatus: receiptUpload.reviewStatus,
    ocrStatus: receiptUpload.ocrStatus,
    createdAt: receiptUpload.createdAt.toISOString(),
    updatedAt: receiptUpload.updatedAt.toISOString(),
  };
}
