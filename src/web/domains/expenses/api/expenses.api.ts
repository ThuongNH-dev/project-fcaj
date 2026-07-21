import { deleteJson, getJson, patchJson, postJson } from "../../../shared/api/client";
import type {
  CreateExpensePayload,
  DeleteExpenseResponse,
  ExpenseResponse,
  ExpensesResponse,
  SettleExpensePayload,
  UpdateExpensePayload,
} from "../models/expenses.types";

export function getExpenses() {
  return getJson<ExpensesResponse>("/api/expenses");
}

export function getExpense(expenseId: string) {
  return getJson<ExpenseResponse>(`/api/expenses/${expenseId}`);
}

export function createExpense(payload: CreateExpensePayload) {
  return postJson<CreateExpensePayload, ExpenseResponse>("/api/expenses", payload);
}

export function updateExpense(expenseId: string, payload: UpdateExpensePayload) {
  return patchJson<UpdateExpensePayload, ExpenseResponse>(
    `/api/expenses/${expenseId}`,
    payload,
  );
}

export function deleteExpense(expenseId: string) {
  return deleteJson<DeleteExpenseResponse>(`/api/expenses/${expenseId}`);
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
