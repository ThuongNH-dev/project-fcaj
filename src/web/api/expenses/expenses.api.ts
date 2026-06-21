import { getJson, postJson } from "../client";
import type {
  CreateExpensePayload,
  ExpenseResponse,
  ExpensesResponse,
} from "./expenses.types";

export function getExpenses() {
  return getJson<ExpensesResponse>("/api/expenses");
}

export function getExpense(expenseId: string) {
  return getJson<ExpenseResponse>(`/api/expenses/${expenseId}`);
}

export function createExpense(payload: CreateExpensePayload) {
  return postJson<CreateExpensePayload, ExpenseResponse>("/api/expenses", payload);
}
