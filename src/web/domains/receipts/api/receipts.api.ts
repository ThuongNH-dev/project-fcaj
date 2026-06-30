import { getJson, postJson } from "../../../shared/api/client";
import type {
  CreateReceiptPayload,
  CreateReceiptPresignPayload,
  CreateReceiptPresignResponse,
  CreateReceiptResponse,
  ReceiptFileAccessResponse,
  ReceiptResponse,
  ReceiptsResponse,
  UploadReceiptPayload,
} from "../models/receipts.types";

export function getReceipts() {
  return getJson<ReceiptsResponse>("/api/receipts");
}

export function getReceipt(receiptId: string) {
  return getJson<ReceiptResponse>(`/api/receipts/${receiptId}`);
}

export function getReceiptViewUrl(receiptId: string, download?: boolean) {
  const query = download ? "?download=true" : "";

  return getJson<ReceiptFileAccessResponse>(
    `/api/receipts/${encodeURIComponent(receiptId)}/view-url${query}`,
  );
}

export function createReceiptPresign(payload: CreateReceiptPresignPayload) {
  return postJson<CreateReceiptPresignPayload, CreateReceiptPresignResponse>(
    "/api/receipts/presign",
    payload,
  );
}

export function createReceipt(payload: CreateReceiptPayload) {
  return postJson<CreateReceiptPayload, CreateReceiptResponse>(
    "/api/receipts",
    payload,
  );
}

export function uploadReceipt(payload: UploadReceiptPayload) {
  return postJson<UploadReceiptPayload, ReceiptResponse>(
    "/api/receipts/upload",
    payload,
  );
}
