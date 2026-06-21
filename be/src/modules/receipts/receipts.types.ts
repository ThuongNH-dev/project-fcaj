import type { SupportedCurrency } from "../auth/auth.types.js";

export type ReceiptFileKind = "image" | "pdf";
export type ReceiptProcessingStatus = "pending" | "processed" | "failed";
export type ReceiptReviewStatus = "pending" | "approved" | "rejected";
export type ReceiptOcrStatus = "pending" | "completed" | "failed";

export interface CreateReceiptUploadInput {
  uploadedByUserId: string;
  groupId?: string | null;
  expenseId?: string | null;
  originalFileName: string;
  storedFileName: string;
  storagePath: string;
  mimeType: string;
  sizeInBytes: number;
  currency?: SupportedCurrency;
}

export interface PublicReceiptUpload {
  id: string;
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
  extractedPurchaseDate: string | null;
  ocrText: string;
  errorMessage: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
