import type { SupportedCurrency } from "../auth/auth.types.js";

export type ExpenseCategory =
  | "food"
  | "travel"
  | "accommodation"
  | "entertainment"
  | "shopping"
  | "utilities"
  | "other";

export type ExpenseSplitMode = "equal" | "custom";
export type ExpenseSettlementStatus = "pending" | "settled";
export type ExpenseReviewStatus = "pending" | "approved" | "rejected";

export interface ExpenseParticipantShare {
  userId: string;
  shareAmount: number;
}

export interface CreateExpenseInput {
  groupId: string;
  createdBy: string;
  paidByUserId: string;
  title: string;
  description?: string;
  category: ExpenseCategory;
  currency?: SupportedCurrency;
  amount: number;
  splitMode?: ExpenseSplitMode;
  participants: ExpenseParticipantShare[];
  receiptId?: string | null;
}

export interface PublicExpense {
  id: string;
  groupId: string;
  createdBy: string;
  paidByUserId: string;
  title: string;
  description: string;
  category: ExpenseCategory;
  currency: SupportedCurrency;
  amount: number;
  splitMode: ExpenseSplitMode;
  participants: ExpenseParticipantShare[];
  receiptId: string | null;
  settlementStatus: ExpenseSettlementStatus;
  reviewStatus: ExpenseReviewStatus;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
