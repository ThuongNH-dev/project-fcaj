import type { PublicReceiptUpload } from "../receipts/receipts.types.js";

export interface CreateExpenseInput {
  uploadedByUserId: string;
  title: string;
  category: string;
  paidBy: string;
  amount: string;
  yourShare: string;
  date: string;
  status?: string;
  groupId?: string | null;
  groupName?: string | null;
  receiptId?: string | null;
}

export interface PublicExpense {
  id: string;
  uploadedByUserId: string;
  title: string;
  category: string;
  paidBy: string;
  amount: string;
  yourShare: string;
  date: string;
  status: "Pending" | "Settled";
  groupId: string | null;
  groupName: string | null;
  receiptId: string | null;
  receipt: PublicReceiptUpload | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseResponse {
  ok: boolean;
  message: string;
  expense?: PublicExpense;
}

export interface ExpensesResponse {
  ok: boolean;
  message: string;
  expenses?: PublicExpense[];
}
