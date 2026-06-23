import type { Request, Response } from "express";
import { getUserById } from "../auth/auth.service.js";
import { getGroupByIdForUser } from "../groups/groups.service.js";
import { getReceiptUploadByIdForUser } from "../receipts/receipts.service.js";
import {
  createExpense,
  getExpenseByIdForUser,
  getExpensesByUserId,
  markExpenseAsSettled,
} from "./expenses.service.js";
import type { ExpenseParticipantShare } from "./expenses.types.js";

function isParticipantPayload(value: unknown): value is ExpenseParticipantShare {
  if (!value || typeof value !== "object") {
    return false;
  }

  const participant = value as {
    userId?: unknown;
    shareAmount?: unknown;
  };

  return (
    typeof participant.userId === "string" &&
    (typeof participant.shareAmount === "number" ||
      typeof participant.shareAmount === "string")
  );
}

export async function getExpensesHandler(req: Request, res: Response) {
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

    const expenses = await getExpensesByUserId(currentUser.id);

    return res.status(200).json({
      ok: true,
      message: "Expenses fetched successfully.",
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

export async function getExpenseByIdHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;
  const expenseId =
    typeof req.params.expenseId === "string" ? req.params.expenseId : "";

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

    const expense = await getExpenseByIdForUser(expenseId, currentUser.id);

    if (!expense) {
      return res.status(404).json({
        ok: false,
        message: "Expense not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Expense fetched successfully.",
      expense,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch expense.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function createExpenseHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;
  const {
    groupId,
    paidByUserId,
    title,
    description,
    expenseDate,
    category,
    currency,
    amount,
    splitMode,
    receiptId,
  } = req.body as {
    groupId?: string;
    paidByUserId?: string;
    title?: string;
    description?: string;
    expenseDate?: string;
    category?: string;
    currency?: string;
    amount?: number | string;
    splitMode?: string;
    receiptId?: string;
  };

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  if (!groupId?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Group id is required.",
    });
  }

  if (!paidByUserId?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Paid by user id is required.",
    });
  }

  if (!title?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Expense title is required.",
    });
  }

  if (!category?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Expense category is required.",
    });
  }

  if (!Array.isArray(req.body.participants) || req.body.participants.length === 0) {
    return res.status(400).json({
      ok: false,
      message: "Expense participants are required.",
    });
  }

  if (!req.body.participants.every(isParticipantPayload)) {
    return res.status(400).json({
      ok: false,
      message: "Expense participants must include userId and shareAmount.",
    });
  }

  const numericAmount = typeof amount === "string" ? Number(amount) : amount;

  if (typeof numericAmount !== "number" || !Number.isFinite(numericAmount)) {
    return res.status(400).json({
      ok: false,
      message: "Expense amount is required.",
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

    const group = await getGroupByIdForUser(groupId, currentUser.id);

    if (!group) {
      return res.status(404).json({
        ok: false,
        message: "Group not found.",
      });
    }

    const groupMemberIds = new Set(group.members.map((member) => member.id));

    if (!groupMemberIds.has(paidByUserId)) {
      return res.status(400).json({
        ok: false,
        message: "Paid by user must be a member of the selected group.",
      });
    }

    const participants = req.body.participants.map(
      (participant: ExpenseParticipantShare) => ({
        userId: participant.userId,
        shareAmount:
          typeof participant.shareAmount === "string"
            ? Number(participant.shareAmount)
            : participant.shareAmount,
      }),
    );

    if (
      !participants.every((participant: ExpenseParticipantShare) =>
        groupMemberIds.has(participant.userId),
      )
    ) {
      return res.status(400).json({
        ok: false,
        message: "All expense participants must belong to the selected group.",
      });
    }

    if (receiptId?.trim()) {
      const receipt = await getReceiptUploadByIdForUser(receiptId, currentUser.id);

      if (!receipt) {
        return res.status(404).json({
          ok: false,
          message: "Receipt not found.",
        });
      }

      if (receipt.groupId && receipt.groupId !== group.id) {
        return res.status(400).json({
          ok: false,
          message: "Receipt does not belong to the selected group.",
        });
      }
    }

    const expense = await createExpense({
      groupId: group.id,
      createdBy: currentUser.id,
      paidByUserId,
      title,
      description,
      expenseDate,
      category,
      currency,
      amount: numericAmount,
      splitMode,
      participants,
      receiptId,
    });

    return res.status(201).json({
      ok: true,
      message: "Expense created successfully.",
      expense,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create expense.";

    const statusCode =
      message === "Expense currency must be either USD or VND." ||
      message === "Expense date is invalid." ||
      message === "Expense category is invalid." ||
      message === "Expense amount must be greater than zero." ||
      message === "Expense split mode is invalid." ||
      message === "Expense participant user id is required." ||
      message === "Expense participant share amount must be greater than zero." ||
      message === "Expense participant share amounts must equal the total amount."
        ? 400
        : 503;

    return res.status(statusCode).json({
      ok: false,
      message,
    });
  }
}

export async function settleExpenseHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;
  const expenseId =
    typeof req.params.expenseId === "string" ? req.params.expenseId : "";
  const { settlementNote } = req.body as {
    settlementNote?: string | null;
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

    const expense = await markExpenseAsSettled({
      expenseId,
      userId: currentUser.id,
      userRole: currentUser.role,
      settlementNote,
    });

    if (!expense) {
      return res.status(404).json({
        ok: false,
        message: "Expense not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Expense marked as settled successfully.",
      expense,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to settle expense.";

    const statusCode =
      message === "Expense is already settled."
        ? 409
        : message === "You are not allowed to settle this expense."
          ? 403
        : message === "Expense settlement could not be updated."
          ? 409
          : 503;

    return res.status(statusCode).json({
      ok: false,
      message,
    });
  }
}
