import { putFile } from "../client";
import { createReceipt, createReceiptPresign } from "./receipts.api";
import type { ReceiptUpload } from "./receipts.types";

const MAX_RECEIPT_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const SUPPORTED_RECEIPT_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

function normalizeReceiptMimeType(file: File) {
  if (file.type && SUPPORTED_RECEIPT_MIME_TYPES.has(file.type)) {
    return file.type;
  }

  const normalizedFileName = file.name.toLowerCase();

  if (normalizedFileName.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (normalizedFileName.endsWith(".png")) {
    return "image/png";
  }

  if (normalizedFileName.endsWith(".jpg") || normalizedFileName.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  throw new Error("Receipt file type must be PNG, JPG, or PDF.");
}

function validateReceiptFile(file: File) {
  if (file.size <= 0) {
    throw new Error("Receipt file size must be greater than zero.");
  }

  if (file.size > MAX_RECEIPT_FILE_SIZE_BYTES) {
    throw new Error("Receipt file size must not exceed 10MB.");
  }

  return normalizeReceiptMimeType(file);
}

export async function uploadReceiptFile(params: {
  file: File;
  groupId?: string | null;
}): Promise<ReceiptUpload> {
  const mimeType = validateReceiptFile(params.file);
  const presignResponse = await createReceiptPresign({
    originalFileName: params.file.name,
    mimeType,
    sizeInBytes: params.file.size,
    groupId: params.groupId ?? undefined,
  });

  if (
    !presignResponse.uploadUrl ||
    !presignResponse.objectKey ||
    !presignResponse.storedFileName
  ) {
    throw new Error("Receipt upload URL is incomplete.");
  }

  await putFile(
    presignResponse.uploadUrl,
    params.file,
    presignResponse.headers,
  );

  const createReceiptResponse = await createReceipt({
    originalFileName: params.file.name,
    storedFileName: presignResponse.storedFileName,
    storagePath: presignResponse.objectKey,
    mimeType,
    sizeInBytes: params.file.size,
    groupId: params.groupId ?? undefined,
  });

  if (!createReceiptResponse.receipt) {
    throw new Error("Receipt record was not returned.");
  }

  return createReceiptResponse.receipt;
}
