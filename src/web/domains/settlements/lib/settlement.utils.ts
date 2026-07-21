import type { Expense } from "../../expenses";
import {
  formatCurrency,
  formatDateTime,
  formatShortDate,
} from "../../../shared/lib/formatters";

export { formatCurrency, formatDateTime };
export const formatDate = formatShortDate;

export function upsertCurrencyTotal(
  totals: Map<string, number>,
  currency: string,
  amount: number,
) {
  totals.set(currency, Number(((totals.get(currency) ?? 0) + amount).toFixed(2)));
}

export function formatCurrencyBreakdown(
  totals: Map<string, number>,
  options?: {
    signed?: boolean;
    emptyCurrency?: string;
  },
) {
  const entries = Array.from(totals.entries()).filter(([, amount]) => amount !== 0);

  if (entries.length === 0) {
    return formatCurrency(0, options?.emptyCurrency ?? "USD");
  }

  return entries
    .map(([currency, amount]) => {
      const formattedAmount = formatCurrency(Math.abs(amount), currency);

      if (!options?.signed) {
        return formattedAmount;
      }

      if (amount > 0) {
        return `+${formattedAmount}`;
      }

      if (amount < 0) {
        return `-${formattedAmount}`;
      }

      return formattedAmount;
    })
    .join("\n");
}

export function getCurrentUserShare(
  expense: Expense,
  currentUserId: string | undefined,
) {
  return (
    expense.participants.find((participant) => participant.userId === currentUserId)
      ?.shareAmount ?? 0
  );
}

export function getOthersShare(expense: Expense, currentUserId: string | undefined) {
  return expense.participants
    .filter((participant) => participant.userId !== currentUserId)
    .reduce((sum, participant) => sum + participant.shareAmount, 0);
}

export function getRelevantExpenses(
  expenses: Expense[],
  currentUserId: string | undefined,
) {
  if (!currentUserId) {
    return [];
  }

  return expenses.filter(
    (expense) =>
      expense.paidByUserId === currentUserId ||
      expense.participants.some(
        (participant) => participant.userId === currentUserId,
      ),
  );
}

export function getPendingExpenses(expenses: Expense[]) {
  return expenses
    .filter((expense) => expense.settlementStatus === "pending")
    .sort(
      (leftExpense, rightExpense) =>
        new Date(rightExpense.updatedAt).getTime() -
        new Date(leftExpense.updatedAt).getTime(),
    );
}

export function getSettledExpenses(expenses: Expense[]) {
  return expenses
    .filter((expense) => expense.settlementStatus === "settled")
    .sort((leftExpense, rightExpense) => {
      const leftTimestamp = new Date(
        leftExpense.settledAt ?? leftExpense.updatedAt,
      ).getTime();
      const rightTimestamp = new Date(
        rightExpense.settledAt ?? rightExpense.updatedAt,
      ).getTime();

      return rightTimestamp - leftTimestamp;
    });
}

export function getYouAreOwedByCurrency(
  pendingExpenses: Expense[],
  currentUserId: string | undefined,
) {
  const totals = new Map<string, number>();

  pendingExpenses.forEach((expense) => {
    if (expense.paidByUserId !== currentUserId) {
      return;
    }

    upsertCurrencyTotal(
      totals,
      expense.currency,
      getOthersShare(expense, currentUserId),
    );
  });

  return totals;
}

export function getYouOweByCurrency(
  pendingExpenses: Expense[],
  currentUserId: string | undefined,
) {
  const totals = new Map<string, number>();

  pendingExpenses.forEach((expense) => {
    if (expense.paidByUserId === currentUserId) {
      return;
    }

    upsertCurrencyTotal(
      totals,
      expense.currency,
      getCurrentUserShare(expense, currentUserId),
    );
  });

  return totals;
}

export function getSettledThisMonthByCurrency(
  settledExpenses: Expense[],
  currentUserId: string | undefined,
  today = new Date(),
) {
  const totals = new Map<string, number>();

  settledExpenses.forEach((expense) => {
    const activityDate = new Date(expense.settledAt ?? expense.updatedAt);

    if (
      activityDate.getFullYear() !== today.getFullYear() ||
      activityDate.getMonth() !== today.getMonth()
    ) {
      return;
    }

    upsertCurrencyTotal(
      totals,
      expense.currency,
      expense.paidByUserId === currentUserId
        ? getOthersShare(expense, currentUserId)
        : getCurrentUserShare(expense, currentUserId),
    );
  });

  return totals;
}

export function getNetPositionByCurrency(
  youAreOwedByCurrency: Map<string, number>,
  youOweByCurrency: Map<string, number>,
) {
  const totals = new Map<string, number>();

  youAreOwedByCurrency.forEach((amount, currency) => {
    upsertCurrencyTotal(totals, currency, amount);
  });

  youOweByCurrency.forEach((amount, currency) => {
    upsertCurrencyTotal(totals, currency, -amount);
  });

  return totals;
}
