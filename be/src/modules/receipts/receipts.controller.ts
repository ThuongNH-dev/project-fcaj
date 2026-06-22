import type { Request, Response } from "express";
import { getUserById } from "../auth/auth.service.js";
import { getGroupByIdForUser } from "../groups/groups.service.js";
import {
  createReceiptFileAccessPresign,
  getReceiptsBucketName,
  createReceiptUploadPresign,
} from "./receipts.storage.js";
import {
  createReceiptUpload,
  getReceiptUploadByIdForUser,
  getReceiptUploadsByUserId,
  normalizeReceiptMimeType,
  normalizeReceiptOptionalReferenceId,
  normalizeReceiptOriginalFileName,
  normalizeReceiptSizeInBytes,
  normalizeReceiptStoragePath,
  normalizeReceiptStoredFileName,
} from "./receipts.service.js";

export async function getReceiptsHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  try {
    const currentUser = await getUserById(userId);

    if (!currentUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    const receipts = await getReceiptUploadsByUserId(currentUser.id);

    return res.status(200).json({
      ok: true,
      message: "Receipts fetched successfully.",
      receipts,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch receipts.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function getReceiptByIdHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;
  const receiptId =
    typeof req.params.receiptId === "string" ? req.params.receiptId : "";

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  try {
    const currentUser = await getUserById(userId);

    if (!currentUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    const receipt = await getReceiptUploadByIdForUser(receiptId, currentUser.id);

    if (!receipt) {
      return res.status(404).json({
        ok: false,
        message: "Receipt not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Receipt fetched successfully.",
      receipt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch receipt.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function getReceiptViewUrlHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;
  const receiptId =
    typeof req.params.receiptId === "string" ? req.params.receiptId : "";
  const shouldDownload =
    typeof req.query.download === "string" && req.query.download === "true";

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  try {
    const currentUser = await getUserById(userId);

    if (!currentUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    const receipt = await getReceiptUploadByIdForUser(receiptId, currentUser.id);

    if (!receipt) {
      return res.status(404).json({
        ok: false,
        message: "Receipt not found.",
      });
    }

    const presignResult = await createReceiptFileAccessPresign({
      objectKey: receipt.storagePath,
      originalFileName: receipt.originalFileName,
      mimeType: receipt.mimeType,
      download: shouldDownload,
    });

    return res.status(200).json({
      ok: true,
      message: shouldDownload
        ? "Receipt download URL created successfully."
        : "Receipt view URL created successfully.",
      url: presignResult.url,
      expiresIn: presignResult.expiresIn,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create receipt access URL.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function createReceiptPresignHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;
  const {
    originalFileName,
    mimeType,
    sizeInBytes,
    groupId,
  } = req.body as {
    originalFileName?: string;
    mimeType?: string;
    sizeInBytes?: number | string;
    groupId?: string;
  };

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  if (!originalFileName?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Receipt original file name is required.",
    });
  }

  if (!mimeType?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Receipt file type is required.",
    });
  }

  const numericSizeInBytes =
    typeof sizeInBytes === "string" ? Number(sizeInBytes) : sizeInBytes;

  if (
    typeof numericSizeInBytes !== "number" ||
    !Number.isFinite(numericSizeInBytes)
  ) {
    return res.status(400).json({
      ok: false,
      message: "Receipt file size is required.",
    });
  }

  try {
    const currentUser = await getUserById(userId);

    if (!currentUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    const normalizedOriginalFileName =
      normalizeReceiptOriginalFileName(originalFileName);
    const normalizedMimeType = normalizeReceiptMimeType(mimeType);
    normalizeReceiptSizeInBytes(numericSizeInBytes);
    const normalizedGroupId = normalizeReceiptOptionalReferenceId(groupId);

    if (normalizedGroupId) {
      const group = await getGroupByIdForUser(normalizedGroupId, currentUser.id);

      if (!group) {
        return res.status(404).json({
          ok: false,
          message: "Group not found.",
        });
      }
    }

    const presignResult = await createReceiptUploadPresign({
      userId: currentUser.id,
      originalFileName: normalizedOriginalFileName,
      mimeType: normalizedMimeType,
    });

    return res.status(200).json({
      ok: true,
      message: "Receipt upload URL created successfully.",
      uploadUrl: presignResult.uploadUrl,
      objectKey: presignResult.objectKey,
      storedFileName: presignResult.storedFileName,
      expiresIn: presignResult.expiresIn,
      headers: presignResult.headers,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create receipt upload URL.";

    const statusCode =
      message === "Receipt file type must be PNG, JPG, or PDF." ||
      message === "Receipt file size must be greater than zero." ||
      message === "Receipt file size must not exceed 10MB."
        ? 400
        : 503;

    return res.status(statusCode).json({
      ok: false,
      message,
    });
  }
}

export async function createReceiptHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;
  const {
    originalFileName,
    storedFileName,
    storagePath,
    mimeType,
    sizeInBytes,
    groupId,
  } = req.body as {
    originalFileName?: string;
    storedFileName?: string;
    storagePath?: string;
    mimeType?: string;
    sizeInBytes?: number | string;
    groupId?: string;
  };

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  if (!originalFileName?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Receipt original file name is required.",
    });
  }

  if (!storedFileName?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Receipt stored file name is required.",
    });
  }

  if (!storagePath?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Receipt storage path is required.",
    });
  }

  if (!mimeType?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Receipt file type is required.",
    });
  }

  const numericSizeInBytes =
    typeof sizeInBytes === "string" ? Number(sizeInBytes) : sizeInBytes;

  if (
    typeof numericSizeInBytes !== "number" ||
    !Number.isFinite(numericSizeInBytes)
  ) {
    return res.status(400).json({
      ok: false,
      message: "Receipt file size is required.",
    });
  }

  try {
    const currentUser = await getUserById(userId);

    if (!currentUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    const normalizedOriginalFileName =
      normalizeReceiptOriginalFileName(originalFileName);
    const normalizedStoredFileName =
      normalizeReceiptStoredFileName(storedFileName);
    const normalizedStoragePath = normalizeReceiptStoragePath(storagePath);
    const normalizedMimeType = normalizeReceiptMimeType(mimeType);
    normalizeReceiptSizeInBytes(numericSizeInBytes);
    const normalizedGroupId = normalizeReceiptOptionalReferenceId(groupId);

    if (normalizedGroupId) {
      const group = await getGroupByIdForUser(normalizedGroupId, currentUser.id);

      if (!group) {
        return res.status(404).json({
          ok: false,
          message: "Group not found.",
        });
      }
    }

    const bucketName = getReceiptsBucketName();
    const expectedKeyPrefix = normalizedGroupId
      ? undefined
      : `receipts/${currentUser.id}/`;

    if (
      !normalizedStoragePath.includes(normalizedStoredFileName) ||
      (expectedKeyPrefix && !normalizedStoragePath.startsWith(expectedKeyPrefix))
    ) {
      return res.status(400).json({
        ok: false,
        message: "Receipt storage path is invalid.",
      });
    }

    const receipt = await createReceiptUpload({
      uploadedByUserId: currentUser.id,
      groupId: normalizedGroupId,
      originalFileName: normalizedOriginalFileName,
      storedFileName: normalizedStoredFileName,
      storagePath: normalizedStoragePath,
      mimeType: normalizedMimeType,
      sizeInBytes: numericSizeInBytes,
    });

    return res.status(201).json({
      ok: true,
      message: `Receipt created successfully in ${bucketName}.`,
      receipt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create receipt.";

    const statusCode =
      message === "Receipt file type must be PNG, JPG, or PDF." ||
      message === "Receipt file size must be greater than zero." ||
      message === "Receipt file size must not exceed 10MB." ||
      message === "Receipt original file name is required." ||
      message === "Receipt stored file name is required." ||
      message === "Receipt storage path is required."
        ? 400
        : 503;

    return res.status(statusCode).json({
      ok: false,
      message,
    });
  }
}
