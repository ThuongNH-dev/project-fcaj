import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../../shared/providers/LanguageProvider";
import type { AppNotification } from "../models/notifications.types";
import { NotificationsPopover } from "./NotificationsPopover";

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
    isRead: true,
    readAt: "2026-07-30T09:00:00.000Z",
    deduplicationKey: "product-update:1:user-1",
    createdAt: "2026-07-30T07:00:00.000Z",
  },
];

function renderPopover(
  props: Partial<ComponentProps<typeof NotificationsPopover>> = {},
) {
  const anchorRef = { current: document.createElement("button") };
  const defaultProps: ComponentProps<typeof NotificationsPopover> = {
    anchorRef,
    notifications: [],
    onClose: vi.fn(),
  };

  return render(
    <LanguageProvider>
      <NotificationsPopover {...defaultProps} {...props} />
    </LanguageProvider>,
  );
}

describe("NotificationsPopover", () => {
  it("shows the empty state and closes from the close button", () => {
    const onClose = vi.fn();
    renderPopover({ onClose });

    expect(screen.getByText("No notifications yet")).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Close notifications" }),
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("renders notifications and exposes list actions", () => {
    const onDelete = vi.fn();
    const onMarkAllAsRead = vi.fn();
    const onNotificationClick = vi.fn();
    renderPopover({
      notifications,
      onDelete,
      onMarkAllAsRead,
      onNotificationClick,
    });

    expect(screen.getByText("Expense added")).toBeInTheDocument();
    expect(screen.getByText("Product update")).toBeInTheDocument();
    expect(screen.getByLabelText("Unread notification")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Mark all as read" }));
    fireEvent.click(screen.getByRole("button", { name: /^Expense added/ }));
    fireEvent.click(
      screen.getByRole("button", {
        name: "Delete notification: Expense added",
      }),
    );

    expect(onMarkAllAsRead).toHaveBeenCalledOnce();
    expect(onNotificationClick).toHaveBeenCalledWith(notifications[0]);
    expect(onDelete).toHaveBeenCalledWith(notifications[0]);
  });

  it("shows loading and retryable error states", () => {
    const onRetry = vi.fn();
    const view = renderPopover({ isLoading: true });

    expect(screen.getByText("Loading notifications...")).toBeInTheDocument();

    view.rerender(
      <LanguageProvider>
        <NotificationsPopover
          anchorRef={{ current: document.createElement("button") }}
          notifications={[]}
          errorMessage="Unable to load notifications."
          onClose={vi.fn()}
          onRetry={onRetry}
        />
      </LanguageProvider>,
    );

    expect(screen.getByText("Unable to load notifications.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("closes with Escape and restores focus to the bell", () => {
    const onClose = vi.fn();
    const anchor = document.createElement("button");
    document.body.appendChild(anchor);

    renderPopover({ anchorRef: { current: anchor }, onClose });
    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledOnce();
    expect(anchor).toHaveFocus();
    anchor.remove();
  });
});
