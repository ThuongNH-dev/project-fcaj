import type { ReceiptUpload } from "../receipts";

export interface ExpenseRecord {
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
  receipt: ReceiptUpload | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpensePayload {
  title: string;
  category: string;
  paidBy: string;
  amount: string;
  yourShare: string;
  date: string;
  status?: "Pending" | "Settled";
  groupId?: string;
  groupName?: string;
  receiptId?: string;
}

export interface ExpenseResponse {
  ok: boolean;
  message: string;
  expense?: ExpenseRecord;
}

export interface ExpensesResponse {
  ok: boolean;
  message: string;
  expenses?: ExpenseRecord[];
}
