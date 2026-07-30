import { describe, expect, it } from "vitest";
import type { AppNotification, NotificationType } from "../models/notifications.types";
import { getNotificationDestination } from "./notification-navigation";

function createNotification(
  type: NotificationType,
  overrides: Partial<AppNotification> = {},
): AppNotification {
  return {
    id: "notification-1",
    recipientUserId: "user-1",
    actorUserId: "user-2",
    type,
    title: "Notification",
    message: "Notification message",
    groupId: null,
    expenseId: null,
    settlementId: null,
    isRead: false,
    readAt: null,
    deduplicationKey: null,
    createdAt: "2026-07-30T08:00:00.000Z",
    ...overrides,
  };
}

describe("notification navigation", () => {
  it("deep-links payment notifications with every settlement context id", () => {
    expect(
      getNotificationDestination(
        createNotification("payment_received", {
          settlementId: "settlement/id",
          expenseId: "expense?id",
          groupId: "group id",
        }),
      ),
    ).toBe(
      "/settlement?settlementId=settlement%2Fid&expenseId=expense%3Fid&groupId=group+id",
    );
  });

  it("opens the generic settlement page for reminders without a target id", () => {
    expect(
      getNotificationDestination(createNotification("settlement_reminder")),
    ).toBe("/settlement");
  });

  it("deep-links expense notifications by expense and group", () => {
    expect(
      getNotificationDestination(
        createNotification("expense_added", {
          expenseId: "expense-1",
          groupId: "group-1",
        }),
      ),
    ).toBe("/expenses?expenseId=expense-1&groupId=group-1");
  });

  it("falls back to the group when an expense id is unavailable", () => {
    expect(
      getNotificationDestination(
        createNotification("expense_added", { groupId: "group/id" }),
      ),
    ).toBe("/groups/group%2Fid");
  });

  it("opens an invited group and ignores product updates without a destination", () => {
    expect(
      getNotificationDestination(
        createNotification("group_invite", { groupId: "group-1" }),
      ),
    ).toBe("/groups/group-1");
    expect(getNotificationDestination(createNotification("product_update"))).toBeNull();
  });
});
