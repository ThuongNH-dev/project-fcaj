import { randomUUID } from "crypto";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "../../config/env.js";

const DEFAULT_PRESIGN_EXPIRATION_SECONDS = 300;

export interface ReceiptUploadPresignResult {
  uploadUrl: string;
  objectKey: string;
  storedFileName: string;
  expiresIn: number;
  headers: {
    "Content-Type": string;
  };
}

export interface ReceiptFileAccessPresignResult {
  url: string;
  expiresIn: number;
}

let receiptsS3Client: S3Client | null = null;

function getRequiredS3Config() {
  if (!env.awsRegion) {
    throw new Error("AWS_REGION is required for S3 receipt uploads.");
  }

  if (!env.awsAccessKeyId) {
    throw new Error("AWS_ACCESS_KEY_ID is required for S3 receipt uploads.");
  }

  if (!env.awsSecretAccessKey) {
    throw new Error("AWS_SECRET_ACCESS_KEY is required for S3 receipt uploads.");
  }

  if (!env.s3ReceiptsBucket) {
    throw new Error("S3_RECEIPTS_BUCKET is required for S3 receipt uploads.");
  }

  const normalizedPrefix = env.s3ReceiptsPrefix.replace(/^\/+|\/+$/g, "");

  return {
    region: env.awsRegion,
    bucket: env.s3ReceiptsBucket,
    prefix: normalizedPrefix,
    expiresIn:
      env.s3PresignExpiresSeconds > 0
        ? env.s3PresignExpiresSeconds
        : DEFAULT_PRESIGN_EXPIRATION_SECONDS,
  };
}

export function getReceiptsS3Client() {
  if (receiptsS3Client) {
    return receiptsS3Client;
  }

  const config = getRequiredS3Config();

  receiptsS3Client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: env.awsAccessKeyId,
      secretAccessKey: env.awsSecretAccessKey,
    },
  });

  return receiptsS3Client;
}

function sanitizeReceiptFileName(fileName: string) {
  const trimmedFileName = fileName.trim();
  const fileExtensionIndex = trimmedFileName.lastIndexOf(".");
  const baseName =
    fileExtensionIndex > 0
      ? trimmedFileName.slice(0, fileExtensionIndex)
      : trimmedFileName;
  const extension =
    fileExtensionIndex > 0 ? trimmedFileName.slice(fileExtensionIndex).toLowerCase() : "";
  const safeBaseName = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${safeBaseName || "receipt"}${extension}`;
}

function buildContentDisposition(fileName: string, download: boolean) {
  const dispositionType = download ? "attachment" : "inline";
  const safeFileName = fileName.replace(/["\r\n]/g, "").trim() || "receipt";

  return `${dispositionType}; filename="${safeFileName}"`;
}

export function buildReceiptStoredFileName(originalFileName: string) {
  return `${Date.now()}-${randomUUID()}-${sanitizeReceiptFileName(originalFileName)}`;
}

export function buildReceiptObjectKey(params: {
  userId: string;
  originalFileName: string;
  createdAt?: Date;
}) {
  const config = getRequiredS3Config();
  const createdAt = params.createdAt ?? new Date();
  const year = createdAt.getUTCFullYear();
  const month = String(createdAt.getUTCMonth() + 1).padStart(2, "0");
  const storedFileName = buildReceiptStoredFileName(params.originalFileName);
  const keyParts = [
    config.prefix,
    params.userId.trim(),
    String(year),
    month,
    storedFileName,
  ].filter(Boolean);

  return {
    storedFileName,
    objectKey: keyParts.join("/"),
  };
}

export async function createReceiptUploadPresign(params: {
  userId: string;
  originalFileName: string;
  mimeType: string;
}): Promise<ReceiptUploadPresignResult> {
  const config = getRequiredS3Config();
  const client = getReceiptsS3Client();
  const { storedFileName, objectKey } = buildReceiptObjectKey({
    userId: params.userId,
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
    storedFileName,
    expiresIn: config.expiresIn,
    headers: {
      "Content-Type": params.mimeType,
    },
  };
}

export async function createReceiptFileAccessPresign(params: {
  objectKey: string;
  originalFileName: string;
  mimeType: string;
  download?: boolean;
}): Promise<ReceiptFileAccessPresignResult> {
  const config = getRequiredS3Config();
  const client = getReceiptsS3Client();
  const command = new GetObjectCommand({
    Bucket: config.bucket,
    Key: params.objectKey,
    ResponseContentType: params.mimeType,
    ResponseContentDisposition: buildContentDisposition(
      params.originalFileName,
      params.download ?? false,
    ),
  });
  const url = await getSignedUrl(client, command, {
    expiresIn: config.expiresIn,
  });

  return {
    url,
    expiresIn: config.expiresIn,
  };
}

export function getReceiptsBucketName() {
  return getRequiredS3Config().bucket;
}
