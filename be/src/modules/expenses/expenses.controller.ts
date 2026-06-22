import type { Request, Response } from "express";
import { getUserById } from "../auth/auth.service.js";
import { getGroupByIdForUser } from "../groups/groups.service.js";
import { getReceiptUploadByIdForUser } from "../receipts/receipts.service.js";
import {
  createExpense,
  getExpensesByUserId,
  normalizeExpenseOptionalText,
  normalizeExpenseReceiptId,
  normalizeExpenseRequiredText,
  normalizeExpenseStatus,
} from "./expenses.service.js";

export async function getExpensesHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;
  const groupId =
    typeof req.query.groupId === "string" ? req.query.groupId : undefined;

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

    const normalizedGroupId = normalizeExpenseOptionalText(groupId);

    if (normalizedGroupId) {
      const group = await getGroupByIdForUser(normalizedGroupId, currentUser.id);

      if (!group) {
        return res.status(404).json({
          ok: false,
          message: "Group not found.",
        });
      }
    }

    const expenses = await getExpensesByUserId(currentUser.id, normalizedGroupId);

    return res.status(200).json({
      ok: true,
      message: normalizedGroupId
        ? "Group expenses fetched successfully."
        : "Expenses fetched successfully.",
      expenses,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch expenses.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function createExpenseHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;
  const {
    title,
    category,
    paidBy,
    amount,
    yourShare,
    date,
    status,
    groupId,
    groupName,
    receiptId,
  } = req.body as {
    title?: string;
    category?: string;
    paidBy?: string;
    amount?: string;
    yourShare?: string;
    date?: string;
    status?: string;
    groupId?: string;
    groupName?: string;
    receiptId?: string;
  };

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

    const normalizedTitle = normalizeExpenseRequiredText(title ?? "", "Expense title");
    const normalizedCategory = normalizeExpenseRequiredText(
      category ?? "",
      "Expense category",
    );
    const normalizedPaidBy = normalizeExpenseRequiredText(
      paidBy ?? "",
      "Expense paid by",
    );
    const normalizedAmount = normalizeExpenseRequiredText(amount ?? "", "Expense amount");
    const normalizedYourShare = normalizeExpenseRequiredText(
      yourShare ?? "",
      "Expense share",
    );
    const normalizedDate = normalizeExpenseRequiredText(date ?? "", "Expense date");
    const normalizedStatus = normalizeExpenseStatus(status);
    const normalizedGroupId = normalizeExpenseOptionalText(groupId);
    const normalizedGroupName = normalizeExpenseOptionalText(groupName);
    const normalizedReceiptId = normalizeExpenseReceiptId(receiptId);

    if (normalizedGroupId) {
      const group = await getGroupByIdForUser(normalizedGroupId, currentUser.id);

      if (!group) {
        return res.status(404).json({
          ok: false,
          message: "Group not found.",
        });
      }
    }

    const receipt = normalizedReceiptId
      ? await getReceiptUploadByIdForUser(normalizedReceiptId, currentUser.id)
      : null;

    if (normalizedReceiptId && !receipt) {
      return res.status(404).json({
        ok: false,
        message: "Receipt not found.",
      });
    }

    if (normalizedGroupId && receipt?.groupId && receipt.groupId !== normalizedGroupId) {
      return res.status(400).json({
        ok: false,
        message: "Receipt does not belong to this group.",
      });
    }

    const expense = await createExpense(
      {
        uploadedByUserId: currentUser.id,
        title: normalizedTitle,
        category: normalizedCategory,
        paidBy: normalizedPaidBy,
        amount: normalizedAmount,
        yourShare: normalizedYourShare,
        date: normalizedDate,
        status: normalizedStatus,
        groupId: normalizedGroupId,
        groupName: normalizedGroupName,
        receiptId: normalizedReceiptId,
      },
      receipt,
    );

    return res.status(201).json({
      ok: true,
      message: "Expense created successfully.",
      expense,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create expense.";

    const statusCode =
      message === "Expense title is required." ||
      message === "Expense category is required." ||
      message === "Expense paid by is required." ||
      message === "Expense amount is required." ||
      message === "Expense share is required." ||
      message === "Expense date is required." ||
      message === "Expense status is invalid." ||
      message === "Expense receipt id is invalid."
        ? 400
        : 503;

    return res.status(statusCode).json({
      ok: false,
      message,
    });
  }
}
