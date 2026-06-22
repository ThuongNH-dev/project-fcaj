export interface CreateReceiptPresignInput {
  userId: string;
  originalFileName: string;
  mimeType: string;
  sizeInBytes: number;
  groupId?: string | null;
}

export interface CreateReceiptUploadInput {
  uploadedByUserId: string;
  groupId?: string | null;
  originalFileName: string;
  storedFileName: string;
  storagePath: string;
  mimeType: string;
  sizeInBytes: number;
}

export interface PublicReceiptUpload {
  id: string;
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
  createdAt: string;
  updatedAt: string;
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

export interface CreateReceiptResponse {
  ok: boolean;
  message: string;
  receipt?: PublicReceiptUpload;
}

export interface ReceiptsResponse {
  ok: boolean;
  message: string;
  receipts?: PublicReceiptUpload[];
}

export interface ReceiptResponse {
  ok: boolean;
  message: string;
  receipt?: PublicReceiptUpload;
}

export interface ReceiptFileAccessResponse {
  ok: boolean;
  message: string;
  url?: string;
  expiresIn?: number;
}
