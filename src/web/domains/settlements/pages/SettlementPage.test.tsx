import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Settlement } from "../models/settlements.types";
import { SettlementPage } from "./SettlementPage";

const {
  mockConfirm,
  mockGetExpenses,
  mockGetGroups,
  mockGetMySettlements,
  mockMarkSettlementAsSent,
  mockShowToast,
} = vi.hoisted(() => ({
  mockConfirm: vi.fn(),
  mockGetExpenses: vi.fn(),
  mockGetGroups: vi.fn(),
  mockGetMySettlements: vi.fn(),
  mockMarkSettlementAsSent: vi.fn(),
  mockShowToast: vi.fn(),
}));

const translations = new Proxy<Record<string, string>>(
  {},
  { get: (_target, key) => String(key) },
);

vi.mock("../../auth", () => ({
  useStoredUser: () => ({
    id: "user-debtor",
    defaultCurrency: "USD",
  }),
}));

vi.mock("../../expenses", () => ({
  getExpenses: mockGetExpenses,
}));

vi.mock("../../groups", () => ({
  getGroups: mockGetGroups,
}));

vi.mock("../../../shared/providers/FeedbackProvider", () => ({
  useFeedback: () => ({ confirm: mockConfirm, showToast: mockShowToast }),
}));

vi.mock("../../../shared/providers/LanguageProvider", () => ({
  useLanguage: () => ({ lang: "en", t: translations }),
}));

vi.mock("../api/settlements.api", () => ({
  getMySettlements: mockGetMySettlements,
  markSettlementAsSent: mockMarkSettlementAsSent,
}));

function createSettlement(
  overrides: Partial<Settlement> & Pick<Settlement, "id">,
): Settlement {
  return {
    id: overrides.id,
    expenseId: "expense-1",
    groupId: "group-1",
    debtorUserId: "user-debtor",
    creditorUserId: "user-creditor",
    amount: 25,
    currency: "USD",
    status: "pending",
    sentAt: null,
    sentSource: null,
    paymentNotificationStatus: "not_required",
    paymentNotificationSentAt: null,
    createdAt: "2026-07-20T10:00:00.000Z",
    updatedAt: "2026-07-20T10:00:00.000Z",
    ...overrides,
  };
}

function createResponse(
  settlements: Settlement[],
  page = 1,
  totalPages = settlements.length > 0 ? 1 : 0,
  total = settlements.length,
) {
  return {
    ok: true,
    message: "Settlements fetched successfully.",
    settlements,
    pagination: {
      page,
      limit: 10,
      total,
      totalPages,
    },
  };
}

const debtorSettlement = createSettlement({ id: "settlement-debtor" });
const creditorSettlement = createSettlement({
  id: "settlement-creditor",
  expenseId: "expense-2",
  debtorUserId: "another-debtor",
  creditorUserId: "user-debtor",
  amount: 40,
});

function renderPage(initialEntry = "/settlement") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <SettlementPage />
    </MemoryRouter>,
  );
}

describe("SettlementPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockResolvedValue(true);
    mockGetExpenses.mockResolvedValue({
      ok: true,
      message: "Expenses fetched.",
      expenses: [
        {
          id: "expense-1",
          groupId: "group-1",
          title: "Team lunch",
          expenseDate: "2026-07-20T10:00:00.000Z",
        },
        {
          id: "expense-2",
          groupId: "group-1",
          title: "Taxi",
          expenseDate: "2026-07-21T10:00:00.000Z",
        },
      ],
    });
    mockGetGroups.mockResolvedValue({
      ok: true,
      message: "Groups fetched.",
      groups: [
        {
          id: "group-1",
          name: "Trip",
          members: [
            { id: "user-debtor", name: "Debtor" },
            { id: "user-creditor", name: "Creditor" },
            { id: "another-debtor", name: "Another debtor" },
          ],
        },
      ],
    });
    mockMarkSettlementAsSent.mockResolvedValue({
      ok: true,
      message: "Settlement marked as sent successfully.",
      settlement: { ...debtorSettlement, status: "sent" },
    });
    mockGetMySettlements.mockImplementation(
      async (params: {
        page?: number;
        limit?: number;
        role?: "debtor" | "creditor";
        status?: "pending" | "sent";
      }) => {
        if (params.status === "sent") {
          return createResponse([]);
        }
        if (params.role === "creditor") {
          return createResponse([creditorSettlement]);
        }
        return createResponse([debtorSettlement]);
      },
    );
  });

  it("loads pending settlements separately for debtor and creditor roles", async () => {
    renderPage();

    expect(await screen.findByText("Team lunch")).toBeInTheDocument();
    expect(await screen.findByText("Taxi")).toBeInTheDocument();

    expect(mockGetMySettlements).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      role: "debtor",
      status: "pending",
    });
    expect(mockGetMySettlements).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      role: "creditor",
      status: "pending",
    });

    const debtorSection = screen.getByRole("region", { name: "youOweLabel" });
    const creditorSection = screen.getByRole("region", {
      name: "youAreOwedLabel",
    });

    expect(within(debtorSection).queryByRole("button", { name: "markAsPaid" })).toBeNull();
    expect(within(creditorSection).getByRole("button", { name: "markAsPaid" })).toBeInTheDocument();
  });

  it("marks a creditor settlement as paid and refreshes settlement data", async () => {
    let wasMarkedAsSent = false;
    mockMarkSettlementAsSent.mockImplementation(async () => {
      wasMarkedAsSent = true;
      return {
        ok: true,
        message: "Settlement marked as sent successfully.",
        settlement: { ...debtorSettlement, status: "sent" as const },
      };
    });
    mockGetMySettlements.mockImplementation(
      async (params: {
        page?: number;
        limit?: number;
        role?: "debtor" | "creditor";
        status?: "pending" | "sent";
      }) => {
        if (params.status === "sent") {
          return createResponse(wasMarkedAsSent ? [{ ...debtorSettlement, status: "sent" }] : []);
        }
        if (params.role === "creditor") {
          return createResponse([creditorSettlement]);
        }
        return createResponse(wasMarkedAsSent ? [] : [debtorSettlement]);
      },
    );

    renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: "markAsPaid" }),
    );

    await waitFor(() => {
      expect(mockMarkSettlementAsSent).toHaveBeenCalledWith("settlement-creditor");
    });
    expect(mockConfirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        variant: "success",
        message: "Settlement marked as sent successfully.",
      });
    });
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "markAsPaid" })).toBeNull();
    });
  });

  it("requests the next debtor page from the backend", async () => {
    const secondPageSettlement = createSettlement({
      id: "settlement-page-2",
      expenseId: "expense-page-2",
    });
    mockGetMySettlements.mockImplementation(
      async (params: {
        page?: number;
        limit?: number;
        role?: "debtor" | "creditor";
        status?: "pending" | "sent";
      }) => {
        if (params.status === "sent" || params.role === "creditor") {
          return createResponse([]);
        }
        if (params.limit === 100) {
          return createResponse([debtorSettlement], 1, 1, 11);
        }
        if (params.page === 2) {
          return createResponse([secondPageSettlement], 2, 2, 11);
        }
        return createResponse([debtorSettlement], 1, 2, 11);
      },
    );

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Next page" }));

    await waitFor(() => {
      expect(mockGetMySettlements).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        role: "debtor",
        status: "pending",
      });
    });
    expect(await screen.findByText("settlementsTitle #page-2")).toBeInTheDocument();
  });

  it("loads and highlights a settlement targeted by notification context", async () => {
    const focusedSettlement = createSettlement({
      id: "settlement-focus",
      expenseId: "expense-focus",
    });
    mockGetMySettlements.mockImplementation(
      async (params: {
        page?: number;
        limit?: number;
        expenseId?: string;
        role?: "debtor" | "creditor";
        status?: "pending" | "sent";
      }) => {
        if (params.expenseId === "expense-focus") {
          return createResponse([focusedSettlement]);
        }
        if (params.status === "sent") {
          return createResponse([]);
        }
        if (params.role === "creditor") {
          return createResponse([creditorSettlement]);
        }
        return createResponse([debtorSettlement]);
      },
    );

    renderPage(
      "/settlement?settlementId=settlement-focus&expenseId=expense-focus&groupId=group-1",
    );

    const selectedSection = await screen.findByRole("region", {
      name: "selectedSettlement",
    });
    expect(mockGetMySettlements).toHaveBeenCalledWith({
      page: 1,
      limit: 100,
      expenseId: "expense-focus",
    });
    expect(
      within(selectedSection).getByText("settlementsTitle #-focus"),
    ).toBeInTheDocument();
    expect(
      selectedSection.querySelector('[data-settlement-id="settlement-focus"]'),
    ).toHaveClass("ring-[#16A34A]");
  });
});
