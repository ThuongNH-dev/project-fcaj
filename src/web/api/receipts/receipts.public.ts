import type { ReceiptUpload } from "./receipts.types";

const RECEIPTS_PUBLIC_BASE_URL =
  import.meta.env.VITE_RECEIPTS_PUBLIC_BASE_URL?.replace(/\/$/, "") || "";

export function getReceiptPublicUrl(receipt?: ReceiptUpload | null) {
  if (!receipt?.storagePath || !RECEIPTS_PUBLIC_BASE_URL) {
    return null;
  }

  const normalizedStoragePath = receipt.storagePath.replace(/^\/+/, "");

  return `${RECEIPTS_PUBLIC_BASE_URL}/${normalizedStoragePath}`;
}

export function hasReceiptPublicBaseUrl() {
  return Boolean(RECEIPTS_PUBLIC_BASE_URL);
}
