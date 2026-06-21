import type { Request, Response } from "express";
import { getUserById } from "../auth/auth.service.js";
import { getExpenseByIdForUser } from "../expenses/expenses.service.js";
import { getGroupByIdForUser } from "../groups/groups.service.js";
import {
  createReceiptUpload,
  getReceiptUploadByIdForUser,
  getReceiptUploadsByUserId,
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

export async function uploadReceiptHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;
  const {
    groupId,
    expenseId,
    originalFileName,
    storedFileName,
    storagePath,
    mimeType,
    sizeInBytes,
    currency,
  } = req.body as {
    groupId?: string;
    expenseId?: string;
    originalFileName?: string;
    storedFileName?: string;
    storagePath?: string;
    mimeType?: string;
    sizeInBytes?: number | string;
    currency?: string;
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

    let resolvedGroupId = groupId?.trim() || null;
    let resolvedExpenseId = expenseId?.trim() || null;

    if (resolvedGroupId) {
      const group = await getGroupByIdForUser(resolvedGroupId, currentUser.id);

      if (!group) {
        return res.status(404).json({
          ok: false,
          message: "Group not found.",
        });
      }

      resolvedGroupId = group.id;
    }

    if (resolvedExpenseId) {
      const expense = await getExpenseByIdForUser(resolvedExpenseId, currentUser.id);

      if (!expense) {
        return res.status(404).json({
          ok: false,
          message: "Expense not found.",
        });
      }

      resolvedExpenseId = expense.id;

      if (resolvedGroupId && expense.groupId !== resolvedGroupId) {
        return res.status(400).json({
          ok: false,
          message: "Receipt expense does not belong to the selected group.",
        });
      }

      resolvedGroupId = expense.groupId;
    }

    const receipt = await createReceiptUpload({
      uploadedByUserId: currentUser.id,
      groupId: resolvedGroupId,
      expenseId: resolvedExpenseId,
      originalFileName,
      storedFileName,
      storagePath,
      mimeType,
      sizeInBytes: numericSizeInBytes,
      currency,
    });

    return res.status(201).json({
      ok: true,
      message: "Receipt uploaded successfully.",
      receipt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to upload receipt.";

    const statusCode =
      message === "Receipt file type must be PNG, JPG, or PDF." ||
      message === "Receipt file size must be greater than zero." ||
      message === "Receipt file size must not exceed 10MB." ||
      message === "Receipt currency must be either USD or VND."
        ? 400
        : 503;

    return res.status(statusCode).json({
      ok: false,
      message,
    });
  }
}
