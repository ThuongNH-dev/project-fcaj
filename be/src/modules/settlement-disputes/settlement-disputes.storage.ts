import { randomUUID } from "crypto";
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../config/env.js";
import type { DisputeEvidenceMimeType } from "./settlement-disputes.types.js";

const MAX_EVIDENCE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

let disputesS3Client: S3Client | null = null;

function getRequiredS3Config() {
  if (!env.awsRegion) {
    throw new Error("AWS_REGION is required for S3 dispute evidence uploads.");
  }

  if (!env.awsAccessKeyId) {
    throw new Error(
      "AWS_ACCESS_KEY_ID is required for S3 dispute evidence uploads.",
    );
  }

  if (!env.awsSecretAccessKey) {
    throw new Error(
      "AWS_SECRET_ACCESS_KEY is required for S3 dispute evidence uploads.",
    );
  }

  if (!env.s3ReceiptsBucket) {
    throw new Error(
      "S3_RECEIPTS_BUCKET is required for S3 dispute evidence uploads.",
    );
  }

  const normalizedPrefix = env.s3DisputesPrefix.replace(/^\/+|\/+$/g, "");

  return {
    region: env.awsRegion,
    bucket: env.s3ReceiptsBucket,
    prefix: normalizedPrefix,
    expiresIn:
      env.s3PresignExpiresSeconds > 0
        ? env.s3PresignExpiresSeconds
        : 300,
  };
}

function getDisputesS3Client() {
  if (disputesS3Client) {
    return disputesS3Client;
  }

  const config = getRequiredS3Config();

  disputesS3Client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: env.awsAccessKeyId,
      secretAccessKey: env.awsSecretAccessKey,
    },
  });

  return disputesS3Client;
}

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim();
  const dotIndex = trimmed.lastIndexOf(".");
  const baseName = dotIndex > 0 ? trimmed.slice(0, dotIndex) : trimmed;
  const extension =
    dotIndex > 0 ? trimmed.slice(dotIndex).toLowerCase() : "";
  const safeBase = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${safeBase || "evidence"}${extension}`;
}

export function buildDisputeEvidenceObjectKey(params: {
  userId: string;
  settlementId: string;
  originalFileName: string;
}) {
  const config = getRequiredS3Config();
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const uuid = randomUUID();
  const safeFileName = sanitizeFileName(params.originalFileName);

  const keyParts = [
    config.prefix,
    params.userId.trim(),
    params.settlementId.trim(),
    String(year),
    month,
    `${uuid}-${safeFileName}`,
  ].filter(Boolean);

  return keyParts.join("/");
}

export async function createDisputeEvidenceUploadPresign(params: {
  userId: string;
  settlementId: string;
  originalFileName: string;
  mimeType: DisputeEvidenceMimeType;
}): Promise<{
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
  headers: { "Content-Type": string };
}> {
  const config = getRequiredS3Config();
  const client = getDisputesS3Client();
  const objectKey = buildDisputeEvidenceObjectKey({
    userId: params.userId,
    settlementId: params.settlementId,
    originalFileName: params.originalFileName,
  });

  const command = new PutObjectCommand({
    Bucket: config.bucket,
    Key: objectKey,
    ContentType: params.mimeType,
  });

  const uploadUrl = await getSignedUrl(client, command, {
    expiresIn: config.expiresIn,
  });

  return {
    uploadUrl,
    objectKey,
    expiresIn: config.expiresIn,
    headers: {
      "Content-Type": params.mimeType,
    },
  };
}

export async function createDisputeEvidenceViewUrl(params: {
  objectKey: string;
}): Promise<{ url: string; expiresIn: number }> {
  const config = getRequiredS3Config();
  const client = getDisputesS3Client();

  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: params.objectKey,
  });

  const url = await getSignedUrl(client, command, {
    expiresIn: config.expiresIn,
  });

  return {
    url,
    expiresIn: config.expiresIn,
  };
}

export async function verifyDisputeEvidence(params: {
  objectKey: string;
  expectedMimeType: DisputeEvidenceMimeType;
  expectedSizeInBytes: number;
  userId: string;
  settlementId: string;
}): Promise<{ valid: boolean; reason?: string }> {
  const config = getRequiredS3Config();
  const client = getDisputesS3Client();

  // Verify that the object key belongs to the correct user and settlement
  const normalizedPrefix = config.prefix;
  const expectedKeyPrefix = [
    normalizedPrefix,
    params.userId.trim(),
    params.settlementId.trim(),
  ]
    .filter(Boolean)
    .join("/");

  if (!params.objectKey.startsWith(expectedKeyPrefix + "/")) {
    return {
      valid: false,
      reason: "Evidence object key does not belong to this user or settlement.",
    };
  }

  try {
    const headResult = await client.send(
      new HeadObjectCommand({
        Bucket: config.bucket,
        Key: params.objectKey,
      }),
    );

    if (!headResult.ContentType) {
      return { valid: false, reason: "Evidence content type is missing." };
    }

    if (headResult.ContentType !== params.expectedMimeType) {
      return {
        valid: false,
        reason: `Evidence content type mismatch: expected ${params.expectedMimeType}, got ${headResult.ContentType}.`,
      };
    }

    if (headResult.ContentLength === undefined) {
      return { valid: false, reason: "Evidence content length is missing." };
    }

    if (headResult.ContentLength > MAX_EVIDENCE_SIZE_BYTES) {
      return { valid: false, reason: "Evidence file exceeds the 5 MB limit." };
    }

    if (headResult.ContentLength !== params.expectedSizeInBytes) {
      return {
        valid: false,
        reason: "Evidence file size does not match the declared size.",
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      reason: "Evidence object does not exist or cannot be accessed on S3.",
    };
  }
}
