export type ReceiptProcessingStatus = "pending" | "processed" | "failed";
export type ReceiptReviewStatus = "pending" | "approved" | "rejected";
export type ReceiptOcrStatus = "pending" | "completed" | "failed";

export interface ReceiptUpload {
  id: string;
  uploadedByUserId: string;
  groupId: string | null;
  expenseId: string | null;
  originalFileName: string;
  storedFileName: string;
  storagePath: string;
  mimeType: string;
  fileKind: "image" | "pdf";
  sizeInBytes: number;
  processingStatus: ReceiptProcessingStatus;
  reviewStatus: ReceiptReviewStatus;
  ocrStatus: ReceiptOcrStatus;
  currency: string | null;
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

export interface UploadReceiptPayload {
  groupId?: string;
  expenseId?: string;
  originalFileName: string;
  storedFileName: string;
  storagePath: string;
  mimeType: string;
  sizeInBytes: number;
  currency?: string;
}

export type CreateReceiptPayload = UploadReceiptPayload;

export interface CreateReceiptPresignPayload {
  groupId?: string;
  originalFileName: string;
  mimeType: string;
  sizeInBytes: number;
}

export interface CreateReceiptPresignResponse {
  ok: boolean;
  message: string;
  uploadUrl?: string;
  objectKey?: string;
  storedFileName?: string;
  expiresIn?: number;
  headers?: {
    "Content-Type": string;
  };
}

export interface ReceiptsResponse {
  ok: boolean;
  message: string;
  receipts?: ReceiptUpload[];
}

export interface ReceiptResponse {
  ok: boolean;
  message: string;
  receipt?: ReceiptUpload;
}

export type CreateReceiptResponse = ReceiptResponse;

export interface ReceiptFileAccessResponse {
  ok: boolean;
  message: string;
  url?: string;
  expiresIn?: number;
}
