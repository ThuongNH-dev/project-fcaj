import type { Collection, IndexDescription, ObjectId } from "mongodb";
import { connectToMongo } from "../../db/mongo.js";
import type { SupportedCurrency } from "../auth/auth.types.js";
import type {
  PublicReceiptUpload,
  ReceiptFileKind,
  ReceiptOcrStatus,
  ReceiptProcessingStatus,
  ReceiptReviewStatus,
} from "./receipts.types.js";

export interface ReceiptUploadDocument {
  _id?: ObjectId;
  uploadedByUserId: string;
  groupId: string | null;
  expenseId: string | null;
  originalFileName: string;
  storedFileName: string;
  storagePath: string;
  mimeType: string;
  fileKind: ReceiptFileKind;
  sizeInBytes: number;
  processingStatus: ReceiptProcessingStatus;
  reviewStatus: ReceiptReviewStatus;
  ocrStatus: ReceiptOcrStatus;
  currency: SupportedCurrency | null;
  extractedMerchantName: string | null;
  extractedTotalAmount: number | null;
  extractedPurchaseDate: Date | null;
  ocrText: string;
  errorMessage: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MAX_RECEIPT_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_CURRENCIES = new Set<SupportedCurrency>(["USD", "VND"]);
const SUPPORTED_RECEIPT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);
const SUPPORTED_PROCESSING_STATUSES = new Set<ReceiptProcessingStatus>([
  "pending",
  "processed",
  "failed",
]);
const SUPPORTED_REVIEW_STATUSES = new Set<ReceiptReviewStatus>([
  "pending",
  "approved",
  "rejected",
]);
const SUPPORTED_OCR_STATUSES = new Set<ReceiptOcrStatus>([
  "pending",
  "completed",
  "failed",
]);

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
    { key: { expenseId: 1 }, name: "expense_idx", sparse: true },
    {
      key: { processingStatus: 1, updatedAt: -1 },
      name: "processing_updatedAt_idx",
    },
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

export function normalizeReceiptMimeType(mimeType: string) {
  const normalizedMimeType = mimeType.trim().toLowerCase();

  if (!SUPPORTED_RECEIPT_MIME_TYPES.has(normalizedMimeType)) {
    throw new Error("Receipt file type must be PNG, JPG, or PDF.");
  }

  return normalizedMimeType;
}

export function getReceiptFileKindFromMimeType(mimeType: string): ReceiptFileKind {
  return mimeType === "application/pdf" ? "pdf" : "image";
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

export function normalizeReceiptCurrency(currency?: string): SupportedCurrency | null {
  if (currency === undefined) {
    return null;
  }

  const normalizedCurrency = currency.trim().toUpperCase();

  if (!normalizedCurrency) {
    return null;
  }

  if (!SUPPORTED_CURRENCIES.has(normalizedCurrency as SupportedCurrency)) {
    throw new Error("Receipt currency must be either USD or VND.");
  }

  return normalizedCurrency as SupportedCurrency;
}

export function normalizeReceiptProcessingStatus(
  processingStatus?: string,
): ReceiptProcessingStatus {
  const normalizedProcessingStatus =
    processingStatus?.trim().toLowerCase() ?? "pending";

  if (
    !SUPPORTED_PROCESSING_STATUSES.has(
      normalizedProcessingStatus as ReceiptProcessingStatus,
    )
  ) {
    throw new Error("Receipt processing status is invalid.");
  }

  return normalizedProcessingStatus as ReceiptProcessingStatus;
}

export function normalizeReceiptReviewStatus(
  reviewStatus?: string,
): ReceiptReviewStatus {
  const normalizedReviewStatus = reviewStatus?.trim().toLowerCase() ?? "pending";

  if (!SUPPORTED_REVIEW_STATUSES.has(normalizedReviewStatus as ReceiptReviewStatus)) {
    throw new Error("Receipt review status is invalid.");
  }

  return normalizedReviewStatus as ReceiptReviewStatus;
}

export function normalizeReceiptOcrStatus(ocrStatus?: string): ReceiptOcrStatus {
  const normalizedOcrStatus = ocrStatus?.trim().toLowerCase() ?? "pending";

  if (!SUPPORTED_OCR_STATUSES.has(normalizedOcrStatus as ReceiptOcrStatus)) {
    throw new Error("Receipt OCR status is invalid.");
  }

  return normalizedOcrStatus as ReceiptOcrStatus;
}

export function normalizeReceiptOptionalText(value?: string | null) {
  const normalizedValue = value?.trim();
  return normalizedValue ? normalizedValue : null;
}

export function normalizeReceiptExtractedAmount(value?: number | null) {
  if (value === undefined || value === null) {
    return null;
  }

  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Receipt extracted total amount is invalid.");
  }

  return Number(value.toFixed(2));
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
    expenseId: receiptUpload.expenseId,
    originalFileName: receiptUpload.originalFileName,
    storedFileName: receiptUpload.storedFileName,
    storagePath: receiptUpload.storagePath,
    mimeType: receiptUpload.mimeType,
    fileKind: receiptUpload.fileKind,
    sizeInBytes: receiptUpload.sizeInBytes,
    processingStatus: receiptUpload.processingStatus,
    reviewStatus: receiptUpload.reviewStatus,
    ocrStatus: receiptUpload.ocrStatus,
    currency: receiptUpload.currency,
    extractedMerchantName: receiptUpload.extractedMerchantName,
    extractedTotalAmount: receiptUpload.extractedTotalAmount,
    extractedPurchaseDate:
      receiptUpload.extractedPurchaseDate?.toISOString() ?? null,
    ocrText: receiptUpload.ocrText,
    errorMessage: receiptUpload.errorMessage,
    rejectionReason: receiptUpload.rejectionReason,
    reviewedBy: receiptUpload.reviewedBy,
    reviewedAt: receiptUpload.reviewedAt?.toISOString() ?? null,
    createdAt: receiptUpload.createdAt.toISOString(),
    updatedAt: receiptUpload.updatedAt.toISOString(),
  };
}
