import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../../shared/providers/LanguageProvider";
import type { AppNotification } from "../../../domains/notifications";
import { DashboardPage } from "./DashboardPage";

const {
  mockDeleteNotification,
  mockGetExpenses,
  mockGetGroups,
  mockGetNotifications,
  mockGetUnreadNotificationCount,
  mockMarkAllNotificationsAsRead,
  mockMarkNotificationAsRead,
  mockNavigate,
  mockSyncNotifications,
} = vi.hoisted(() => ({
  mockDeleteNotification: vi.fn(),
  mockGetExpenses: vi.fn(),
  mockGetGroups: vi.fn(),
  mockGetNotifications: vi.fn(),
  mockGetUnreadNotificationCount: vi.fn(),
  mockMarkAllNotificationsAsRead: vi.fn(),
  mockMarkNotificationAsRead: vi.fn(),
  mockNavigate: vi.fn(),
  mockSyncNotifications: vi.fn(),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>(
    "react-router",
  );

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../domains/auth", () => ({
  getUserInitials: () => "TU",
  useStoredUser: () => ({
    id: "user-1",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    bio: "",
    avatarUrl: "",
    defaultCurrency: "VND",
    role: "user",
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  }),
}));

vi.mock("../../../domains/expenses", () => ({
  getExpenses: mockGetExpenses,
}));

vi.mock("../../../domains/groups", () => ({
  getGroups: mockGetGroups,
}));

vi.mock("../../../domains/notifications", async () => {
  const actual = await vi.importActual<
    typeof import("../../../domains/notifications")
  >("../../../domains/notifications");

  return {
    ...actual,
    deleteNotification: mockDeleteNotification,
    getNotifications: mockGetNotifications,
    getUnreadNotificationCount: mockGetUnreadNotificationCount,
    markAllNotificationsAsRead: mockMarkAllNotificationsAsRead,
    markNotificationAsRead: mockMarkNotificationAsRead,
    syncNotifications: mockSyncNotifications,
  };
});

const notifications: AppNotification[] = [
  {
    id: "notification-1",
    recipientUserId: "user-1",
    actorUserId: "user-2",
    type: "expense_added",
    title: "Expense added",
    message: "Alex added Dinner: 500,000 VND.",
    groupId: "group-1",
    expenseId: "expense-1",
    settlementId: null,
    isRead: false,
    readAt: null,
    deduplicationKey: "expense-added:expense-1:user-1",
    createdAt: "2026-07-30T08:00:00.000Z",
  },
  {
    id: "notification-2",
    recipientUserId: "user-1",
    actorUserId: null,
    type: "product_update",
    title: "Product update",
    message: "A new Splitly feature is available.",
    groupId: null,
    expenseId: null,
    settlementId: null,
    isRead: false,
    readAt: null,
    deduplicationKey: "product-update:1:user-1",
    createdAt: "2026-07-30T07:00:00.000Z",
  },
];

function renderPage() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <DashboardPage />
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe("Dashboard notification integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockGetGroups.mockResolvedValue({
      ok: true,
      message: "Groups fetched successfully.",
      groups: [],
    });
    mockGetExpenses.mockResolvedValue({
      ok: true,
      message: "Expenses fetched successfully.",
      expenses: [],
    });
    mockSyncNotifications.mockResolvedValue({
      ok: true,
      message: "Notification sync completed.",
      created: false,
      pendingSettlementCount: 0,
    });
    mockGetUnreadNotificationCount.mockResolvedValue({
      ok: true,
      message: "Unread notification count fetched successfully.",
      unreadCount: 2,
    });
    mockGetNotifications.mockResolvedValue({
      ok: true,
      message: "Notifications fetched successfully.",
      notifications,
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    });
    mockMarkNotificationAsRead.mockImplementation(
      async (notificationId: string) => ({
        ok: true,
        message: "Notification marked as read.",
        notification: {
          ...notifications.find((item) => item.id === notificationId)!,
          isRead: true,
          readAt: "2026-07-30T10:00:00.000Z",
        },
      }),
    );
    mockMarkAllNotificationsAsRead.mockResolvedValue({
      ok: true,
      message: "All notifications marked as read.",
      modifiedCount: 2,
    });
    mockDeleteNotification.mockResolvedValue({
      ok: true,
      message: "Notification deleted successfully.",
    });
  });

  it("syncs notifications and loads the unread badge on mount", async () => {
    renderPage();

    expect(
      await screen.findByRole("button", {
        name: "Notifications, 2 unread notifications",
      }),
    ).toBeInTheDocument();
    expect(mockSyncNotifications).toHaveBeenCalledOnce();
    expect(mockGetUnreadNotificationCount).toHaveBeenCalledOnce();
  });

  it("loads the list, marks one as read and deep-links to its expense", async () => {
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Notifications, 2 unread notifications",
      }),
    );

    fireEvent.click(
      await screen.findByRole("button", { name: /^Expense added/ }),
    );

    await waitFor(() => {
      expect(mockMarkNotificationAsRead).toHaveBeenCalledWith("notification-1");
      expect(mockNavigate).toHaveBeenCalledWith(
        "/expenses?expenseId=expense-1&groupId=group-1",
      );
    });
    expect(
      screen.getByRole("button", {
        name: "Notifications, 1 unread notification",
      }),
    ).toBeInTheDocument();
  });

  it("marks all loaded notifications as read", async () => {
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Notifications, 2 unread notifications",
      }),
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Mark all as read" }),
    );

    await waitFor(() => {
      expect(mockMarkAllNotificationsAsRead).toHaveBeenCalledOnce();
    });
    expect(
      screen.getByRole("button", { name: "Notifications" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Unread notification")).not.toBeInTheDocument();
  });

  it("deletes an unread notification and updates the badge", async () => {
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Notifications, 2 unread notifications",
      }),
    );

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Delete notification: Expense added",
      }),
    );

    await waitFor(() => {
      expect(mockDeleteNotification).toHaveBeenCalledWith("notification-1");
      expect(screen.queryByText("Expense added")).not.toBeInTheDocument();
    });
    expect(
      screen.getByRole("button", {
        name: "Notifications, 1 unread notification",
      }),
    ).toBeInTheDocument();
  });

  it("shows a retry action when the list request fails", async () => {
    mockGetNotifications.mockRejectedValueOnce(
      new Error("Unable to load notifications."),
    );
    renderPage();
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Notifications, 2 unread notifications",
      }),
    );

    expect(
      await screen.findByText("Unable to load notifications."),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Expense added")).toBeInTheDocument();
    expect(mockGetNotifications).toHaveBeenCalledTimes(2);
  });
});
