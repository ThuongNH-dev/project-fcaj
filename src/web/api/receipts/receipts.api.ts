import { getJson, postJson } from "../client";
import type {
  ReceiptResponse,
  ReceiptsResponse,
  UploadReceiptPayload,
} from "./receipts.types";

export function getReceipts() {
  return getJson<ReceiptsResponse>("/api/receipts");
}

export function getReceipt(receiptId: string) {
  return getJson<ReceiptResponse>(`/api/receipts/${receiptId}`);
}

export function uploadReceipt(payload: UploadReceiptPayload) {
  return postJson<UploadReceiptPayload, ReceiptResponse>(
    "/api/receipts/upload",
    payload,
  );
}
