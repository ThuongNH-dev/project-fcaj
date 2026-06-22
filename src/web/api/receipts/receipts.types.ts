export interface ReceiptUpload {
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

export interface CreateReceiptPresignPayload {
  originalFileName: string;
  mimeType: string;
  sizeInBytes: number;
  groupId?: string;
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

export interface CreateReceiptPayload {
  originalFileName: string;
  storedFileName: string;
  storagePath: string;
  mimeType: string;
  sizeInBytes: number;
  groupId?: string;
}

export interface CreateReceiptResponse {
  ok: boolean;
  message: string;
  receipt?: ReceiptUpload;
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

export interface ReceiptFileAccessResponse {
  ok: boolean;
  message: string;
  url?: string;
  expiresIn?: number;
}
