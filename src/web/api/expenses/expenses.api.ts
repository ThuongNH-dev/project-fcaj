import { getJson, postJson } from "../client";
import type {
  CreateExpensePayload,
  ExpenseResponse,
  ExpensesResponse,
} from "./expenses.types";

export function getExpenses(groupId?: string) {
  const query = groupId ? `?groupId=${encodeURIComponent(groupId)}` : "";
  return getJson<ExpensesResponse>(`/api/expenses${query}`);
}

export function createExpense(payload: CreateExpensePayload) {
  return postJson<CreateExpensePayload, ExpenseResponse>("/api/expenses", payload);
}
