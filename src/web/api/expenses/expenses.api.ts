import { getJson, patchJson, postJson } from "../client";
import type {
  CreateExpensePayload,
  ExpenseResponse,
  ExpensesResponse,
  SettleExpensePayload,
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

export function settleExpense(
  expenseId: string,
  payload: SettleExpensePayload = {},
) {
  return patchJson<SettleExpensePayload, ExpenseResponse>(
    `/api/expenses/${expenseId}/settlement`,
    payload,
  );
}
