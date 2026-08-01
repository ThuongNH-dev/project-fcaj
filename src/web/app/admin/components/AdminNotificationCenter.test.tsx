import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppNotification } from "../../../domains/notifications";
import { LanguageProvider } from "../../../shared/providers/LanguageProvider";
import { AdminNotificationCenter } from "./AdminNotificationCenter";

const {
  mockGetNotifications,
  mockGetUnreadNotificationCount,
  mockMarkNotificationAsRead,
  mockNavigate,
} = vi.hoisted(() => ({
  mockGetNotifications: vi.fn(),
  mockGetUnreadNotificationCount: vi.fn(),
  mockMarkNotificationAsRead: vi.fn(),
  mockNavigate: vi.fn(),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../../domains/notifications", async () => {
  const actual = await vi.importActual<typeof import("../../../domains/notifications")>(
    "../../../domains/notifications",
  );

  return {
    ...actual,
    getNotifications: mockGetNotifications,
    getUnreadNotificationCount: mockGetUnreadNotificationCount,
    markNotificationAsRead: mockMarkNotificationAsRead,
  };
});

const disputeNotification: AppNotification = {
  id: "notification-1",
  recipientUserId: "admin-1",
  actorUserId: "user-1",
  type: "settlement_dispute_created",
  title: "Settlement dispute reported",
  message: "A user disputed a settlement.",
  groupId: "group-1",
  expenseId: null,
  settlementId: "settlement-1",
  disputeId: "dispute/id",
  isRead: false,
  readAt: null,
  deduplicationKey: "settlement-dispute:dispute/id:admin-1",
  createdAt: "2026-08-01T03:00:00.000Z",
};

function renderCenter() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <AdminNotificationCenter />
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe("AdminNotificationCenter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUnreadNotificationCount.mockResolvedValue({
      ok: true,
      message: "Unread notification count fetched successfully.",
      unreadCount: 1,
    });
    mockGetNotifications.mockResolvedValue({
      ok: true,
      message: "Notifications fetched successfully.",
      notifications: [disputeNotification],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    mockMarkNotificationAsRead.mockResolvedValue({
      ok: true,
      message: "Notification marked as read.",
      notification: {
        ...disputeNotification,
        isRead: true,
        readAt: "2026-08-01T03:05:00.000Z",
      },
    });
  });

  it("marks an unread dispute notification as read before opening its admin detail", async () => {
    renderCenter();

    fireEvent.click(
      await screen.findByRole("button", {
        name: "Notifications, 1 unread notification",
      }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: /^Settlement dispute reported/ }),
    );

    await waitFor(() => {
      expect(mockMarkNotificationAsRead).toHaveBeenCalledWith("notification-1");
      expect(mockNavigate).toHaveBeenCalledWith(
        "/admin/settlement-disputes/dispute%2Fid",
      );
    });
  });
});
