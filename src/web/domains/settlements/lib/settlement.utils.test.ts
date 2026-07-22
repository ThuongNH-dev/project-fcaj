import { describe, expect, it } from "vitest";
import type { Expense } from "../../expenses";
import {
  formatCurrencyBreakdown,
  getCurrentUserShare,
  getNetPositionByCurrency,
  getOthersShare,
  getPendingExpenses,
  getRelevantExpenses,
  getSettledExpenses,
  getSettledThisMonthByCurrency,
  getYouAreOwedByCurrency,
  getYouOweByCurrency,
  upsertCurrencyTotal,
} from "./settlement.utils";

function createExpense(overrides: Partial<Expense>): Expense {
  return {
    id: "expense-default",
    groupId: "group-1",
    createdBy: "user-1",
    paidByUserId: "user-1",
    title: "Expense",
    description: "",
    expenseDate: "2026-06-01T00:00:00.000Z",
    category: "food",
    currency: "USD",
    amount: 0,
    splitMode: "equal",
    participants: [],
    receiptId: null,
    settlementStatus: "pending",
    settledAt: null,
    settledBy: null,
    settlementNote: null,
    reviewStatus: "approved",
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("settlement.utils", () => {
  it("returns only expenses relevant to the current user", () => {
    const expenses = [
      createExpense({
        id: "paid-by-user",
        paidByUserId: "user-1",
        participants: [
          { userId: "user-1", shareAmount: 20 },
          { userId: "user-2", shareAmount: 20 },
        ],
      }),
      createExpense({
        id: "participating-user",
        paidByUserId: "user-2",
        participants: [
          { userId: "user-1", shareAmount: 15 },
          { userId: "user-2", shareAmount: 15 },
        ],
      }),
      createExpense({
        id: "unrelated",
        paidByUserId: "user-3",
        participants: [
          { userId: "user-2", shareAmount: 10 },
          { userId: "user-3", shareAmount: 10 },
        ],
      }),
    ];

    expect(getRelevantExpenses(expenses, "user-1").map((expense) => expense.id)).toEqual([
      "paid-by-user",
      "participating-user",
    ]);
    expect(getRelevantExpenses(expenses, undefined)).toEqual([]);
  });

  it("sorts pending and settled expenses by the newest activity first", () => {
    const expenses = [
      createExpense({
        id: "pending-old",
        updatedAt: "2026-06-10T00:00:00.000Z",
        settlementStatus: "pending",
      }),
      createExpense({
        id: "pending-new",
        updatedAt: "2026-06-12T00:00:00.000Z",
        settlementStatus: "pending",
      }),
      createExpense({
        id: "settled-updated",
        settlementStatus: "settled",
        settledAt: null,
        updatedAt: "2026-06-14T00:00:00.000Z",
      }),
      createExpense({
        id: "settled-latest",
        settlementStatus: "settled",
        settledAt: "2026-06-15T00:00:00.000Z",
        updatedAt: "2026-06-13T00:00:00.000Z",
      }),
    ];

    expect(getPendingExpenses(expenses).map((expense) => expense.id)).toEqual([
      "pending-new",
      "pending-old",
    ]);
    expect(getSettledExpenses(expenses).map((expense) => expense.id)).toEqual([
      "settled-latest",
      "settled-updated",
    ]);
  });

  it("calculates owed, owe, settled-this-month, and net totals across currencies", () => {
    const pendingExpenses = [
      createExpense({
        id: "owed-usd",
        currency: "USD",
        paidByUserId: "user-1",
        participants: [
          { userId: "user-1", shareAmount: 20 },
          { userId: "user-2", shareAmount: 20 },
          { userId: "user-3", shareAmount: 20 },
        ],
        settlementStatus: "pending",
        updatedAt: "2026-06-12T00:00:00.000Z",
      }),
      createExpense({
        id: "owe-usd",
        currency: "USD",
        paidByUserId: "user-2",
        participants: [
          { userId: "user-1", shareAmount: 15 },
          { userId: "user-2", shareAmount: 15 },
        ],
        settlementStatus: "pending",
        updatedAt: "2026-06-11T00:00:00.000Z",
      }),
      createExpense({
        id: "owe-eur",
        currency: "EUR",
        paidByUserId: "user-3",
        participants: [
          { userId: "user-1", shareAmount: 10 },
          { userId: "user-3", shareAmount: 10 },
        ],
        settlementStatus: "pending",
        updatedAt: "2026-06-09T00:00:00.000Z",
      }),
    ];
    const settledExpenses = [
      createExpense({
        id: "settled-this-month",
        currency: "USD",
        paidByUserId: "user-2",
        participants: [
          { userId: "user-1", shareAmount: 12.5 },
          { userId: "user-2", shareAmount: 12.5 },
        ],
        settlementStatus: "settled",
        settledAt: "2026-06-18T00:00:00.000Z",
        updatedAt: "2026-06-18T00:00:00.000Z",
      }),
      createExpense({
        id: "settled-last-month",
        currency: "USD",
        paidByUserId: "user-1",
        participants: [
          { userId: "user-1", shareAmount: 30 },
          { userId: "user-4", shareAmount: 30 },
        ],
        settlementStatus: "settled",
        settledAt: "2026-05-20T00:00:00.000Z",
        updatedAt: "2026-05-20T00:00:00.000Z",
      }),
    ];

    const youAreOwedByCurrency = getYouAreOwedByCurrency(
      pendingExpenses,
      "user-1",
    );
    const youOweByCurrency = getYouOweByCurrency(pendingExpenses, "user-1");
    const netPositionByCurrency = getNetPositionByCurrency(
      youAreOwedByCurrency,
      youOweByCurrency,
    );
    const settledThisMonthByCurrency = getSettledThisMonthByCurrency(
      settledExpenses,
      "user-1",
      new Date("2026-06-27T00:00:00.000Z"),
    );

    expect(Array.from(youAreOwedByCurrency.entries())).toEqual([["USD", 40]]);
    expect(Array.from(youOweByCurrency.entries())).toEqual([
      ["USD", 15],
      ["EUR", 10],
    ]);
    expect(Array.from(netPositionByCurrency.entries())).toEqual([
      ["USD", 25],
      ["EUR", -10],
    ]);
    expect(Array.from(settledThisMonthByCurrency.entries())).toEqual([
      ["USD", 12.5],
    ]);
  });

  it("formats breakdowns and share helpers consistently", () => {
    const totals = new Map<string, number>();

    upsertCurrencyTotal(totals, "USD", 0.1);
    upsertCurrencyTotal(totals, "USD", 0.2);
    upsertCurrencyTotal(totals, "VND", -5000);

    const expense = createExpense({
      participants: [
        { userId: "user-1", shareAmount: 12.34 },
        { userId: "user-2", shareAmount: 7.66 },
      ],
    });

    expect(totals.get("USD")).toBe(0.3);
    expect(getCurrentUserShare(expense, "user-1")).toBe(12.34);
    expect(getCurrentUserShare(expense, "missing-user")).toBe(0);
    expect(getOthersShare(expense, "user-1")).toBe(7.66);
    expect(
      formatCurrencyBreakdown(new Map<string, number>(), {
        emptyCurrency: "USD",
      }),
    ).toBe("$0.00");
    expect(
      formatCurrencyBreakdown(
        new Map([
          ["USD", 25],
          ["VND", -10000],
        ]),
        { signed: true },
      ),
    ).toBe(`+$25.00\n-10.000 ₫`);
  });
});
