import { putFile } from "../../../shared/api/client";
import { createDisputeEvidencePresign } from "./settlement-disputes.api";
import type {
  DisputeEvidenceInput,
  DisputeEvidenceMimeType,
} from "../models/settlement-disputes.types";

const MAX_EVIDENCE_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const SUPPORTED_EVIDENCE_MIME_TYPES = new Set<DisputeEvidenceMimeType>([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function normalizeEvidenceMimeType(file: File): DisputeEvidenceMimeType {
  if (
    file.type &&
    SUPPORTED_EVIDENCE_MIME_TYPES.has(file.type as DisputeEvidenceMimeType)
  ) {
    return file.type as DisputeEvidenceMimeType;
  }

  const normalizedFileName = file.name.toLowerCase();

  if (normalizedFileName.endsWith(".png")) {
    return "image/png";
  }

  if (normalizedFileName.endsWith(".webp")) {
    return "image/webp";
  }

  if (
    normalizedFileName.endsWith(".jpg") ||
    normalizedFileName.endsWith(".jpeg")
  ) {
    return "image/jpeg";
  }

  throw new Error("Evidence file type must be JPG, PNG, or WEBP.");
}

function validateEvidenceFile(file: File) {
  if (file.size <= 0) {
    throw new Error("Evidence file size must be greater than zero.");
  }

  if (file.size > MAX_EVIDENCE_FILE_SIZE_BYTES) {
    throw new Error("Evidence file size must not exceed 5MB.");
  }

  return normalizeEvidenceMimeType(file);
}

export async function uploadDisputeEvidence(params: {
  file: File;
  settlementId: string;
}): Promise<DisputeEvidenceInput> {
  const mimeType = validateEvidenceFile(params.file);
  const presignResponse = await createDisputeEvidencePresign({
    settlementId: params.settlementId,
    originalFileName: params.file.name,
    mimeType,
    sizeInBytes: params.file.size,
  });

  if (!presignResponse.uploadUrl || !presignResponse.objectKey) {
    throw new Error("Evidence upload URL is incomplete.");
  }

  await putFile(presignResponse.uploadUrl, params.file, presignResponse.headers);

  return {
    objectKey: presignResponse.objectKey,
    originalFileName: params.file.name,
    mimeType,
    sizeInBytes: params.file.size,
  };
}