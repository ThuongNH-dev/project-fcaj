import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../../shared/providers/LanguageProvider";
import type { Expense } from "../models/expenses.types";
import { ExpensesPage } from "./ExpensesPage";

const {
  mockGetCurrentUserBilling,
  mockGetExpenses,
  mockGetGroups,
} = vi.hoisted(() => ({
  mockGetCurrentUserBilling: vi.fn(),
  mockGetExpenses: vi.fn(),
  mockGetGroups: vi.fn(),
}));

vi.mock("../../auth", () => ({
  useStoredUser: () => ({ id: "user-1", defaultCurrency: "USD" }),
}));

vi.mock("../../groups", () => ({
  getGroups: mockGetGroups,
}));

vi.mock("../../users", () => ({
  getCurrentUserBilling: mockGetCurrentUserBilling,
}));

vi.mock("../../receipts", () => ({
  uploadReceiptFile: vi.fn(),
}));

vi.mock("../../../shared/providers/FeedbackProvider", () => ({
  useFeedback: () => ({
    confirm: vi.fn(),
    showToast: vi.fn(),
  }),
}));

vi.mock("..", () => ({
  createExpense: vi.fn(),
  deleteExpense: vi.fn(),
  getExpenses: mockGetExpenses,
  updateExpense: vi.fn(),
}));

function createExpense(
  index: number,
  overrides: Partial<Expense> = {},
): Expense {
  return {
    id: `expense-${index}`,
    groupId: "group-1",
    createdBy: "user-1",
    paidByUserId: "user-1",
    title: index === 6 ? "Focused expense" : `Expense ${index}`,
    description: "",
    expenseDate: "2026-07-20T10:00:00.000Z",
    category: "food",
    currency: "USD",
    amount: index * 10,
    splitMode: "equal",
    participants: [{ userId: "user-1", shareAmount: index * 10 }],
    receiptId: null,
    settlementStatus: "pending",
    settledAt: null,
    settledBy: null,
    settlementNote: null,
    reviewStatus: "approved",
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-20T10:00:00.000Z",
    ...overrides,
  };
}

describe("ExpensesPage notification deep-link", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetExpenses.mockResolvedValue({
      ok: true,
      message: "Expenses fetched.",
      expenses: Array.from({ length: 6 }, (_, index) =>
        createExpense(index + 1),
      ),
    });
    mockGetGroups.mockResolvedValue({
      ok: true,
      message: "Groups fetched.",
      groups: [
        {
          id: "group-1",
          name: "Trip",
          members: [{ id: "user-1", name: "Test User" }],
        },
      ],
    });
    mockGetCurrentUserBilling.mockResolvedValue({
      ok: true,
      message: "Billing fetched.",
    });
  });

  it("maps refreshed review statuses, shows rejection reasons, and locks unapproved actions", async () => {
    mockGetExpenses.mockResolvedValue({
      ok: true,
      message: "Expenses fetched after receipt review.",
      expenses: [
        createExpense(1, { reviewStatus: "pending" }),
        createExpense(2, { reviewStatus: "approved" }),
        createExpense(3, {
          reviewStatus: "rejected",
          rejectionReason: "Receipt image is unreadable.",
        }),
      ],
    });

    render(
      <MemoryRouter initialEntries={["/expenses"]}>
        <LanguageProvider>
          <ExpensesPage />
        </LanguageProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Receive Pending")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Rejected")).toBeInTheDocument();
    expect(screen.getByText("Reason: Receipt image is unreadable.")).toBeInTheDocument();

    const editButtons = screen.getAllByRole("button", { name: "Edit" });
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });

    expect(editButtons[0]).toBeDisabled();
    expect(editButtons[1]).toBeEnabled();
    expect(editButtons[2]).toBeDisabled();
    expect(deleteButtons[0]).toBeDisabled();
    expect(deleteButtons[1]).toBeEnabled();
    expect(deleteButtons[2]).toBeDisabled();
  });

  it("opens the page containing the targeted expense and highlights it", async () => {
    render(
      <MemoryRouter
        initialEntries={["/expenses?expenseId=expense-6&groupId=group-1"]}
      >
        <LanguageProvider>
          <ExpensesPage />
        </LanguageProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Focused expense")).toBeInTheDocument();

    await waitFor(() => {
      expect(
        document.querySelector('[data-expense-id="expense-6"]'),
      ).toHaveClass("ring-[#16A34A]");
    });
    expect(screen.getByRole("button", { name: "Previous page" })).toBeEnabled();
  });
});
