import type { SupportedCurrency, UserRole } from "../auth/auth.types.js";

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
  expenseDate?: string;
  category: string;
  currency?: string;
  amount: number;
  splitMode?: string;
  participants: ExpenseParticipantShare[];
  receiptId?: string | null;
}

export interface UpdateExpenseInput {
  expenseId: string;
  userId: string;
  paidByUserId: string;
  title: string;
  description?: string;
  expenseDate?: string;
  category: string;
  amount: number;
  splitMode?: string;
  participants: ExpenseParticipantShare[];
  receiptId?: string | null;
}

export interface SettleExpenseInput {
  expenseId: string;
  userId: string;
  userRole: UserRole;
  settlementNote?: string | null;
}

export interface PublicExpense {
  id: string;
  groupId: string;
  createdBy: string;
  paidByUserId: string;
  title: string;
  description: string;
  expenseDate: string;
  category: ExpenseCategory;
  currency: SupportedCurrency;
  amount: number;
  splitMode: ExpenseSplitMode;
  participants: ExpenseParticipantShare[];
  receiptId: string | null;
  settlementStatus: ExpenseSettlementStatus;
  settledAt: string | null;
  settledBy: string | null;
  settlementNote: string | null;
  reviewStatus: ExpenseReviewStatus;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
