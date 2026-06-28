export interface ExpenseParticipantShare {
  userId: string;
  shareAmount: number;
}

export type ExpenseSettlementStatus = "pending" | "settled";
export type ExpenseReviewStatus = "pending" | "approved" | "rejected";

export interface Expense {
  id: string;
  groupId: string;
  createdBy: string;
  paidByUserId: string;
  title: string;
  description: string;
  expenseDate: string;
  category: string;
  currency: string;
  amount: number;
  splitMode: string;
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

export interface CreateExpensePayload {
  groupId: string;
  paidByUserId: string;
  title: string;
  description?: string;
  expenseDate?: string;
  category: string;
  currency?: string;
  amount: number;
  splitMode?: string;
  participants: ExpenseParticipantShare[];
  receiptId?: string;
}

export interface SettleExpensePayload {
  settlementNote?: string | null;
}

export interface ExpensesResponse {
  ok: boolean;
  message: string;
  expenses?: Expense[];
}

export interface ExpenseResponse {
  ok: boolean;
  message: string;
  expense?: Expense;
}
