import type { AppNotification } from "../models/notifications.types";

function appendContextQuery(
  path: string,
  notification: AppNotification,
  fields: Array<"settlementId" | "expenseId" | "groupId">,
) {
  const query = new URLSearchParams();

  fields.forEach((field) => {
    const value = notification[field];
    if (value) {
      query.set(field, value);
    }
  });

  const queryString = query.toString();
  return `${path}${queryString ? `?${queryString}` : ""}`;
}

export function getNotificationDestination(notification: AppNotification) {
  if (notification.type === "payment_received") {
    return appendContextQuery("/settlement", notification, [
      "settlementId",
      "expenseId",
      "groupId",
    ]);
  }

  if (notification.type === "settlement_reminder") {
    return "/settlement";
  }

  if (notification.type === "expense_added") {
    if (notification.expenseId) {
      return appendContextQuery("/expenses", notification, [
        "expenseId",
        "groupId",
      ]);
    }

    if (notification.groupId) {
      return `/groups/${encodeURIComponent(notification.groupId)}`;
    }

    return "/expenses";
  }

  if (notification.type === "group_invite") {
    return notification.groupId
      ? `/groups/${encodeURIComponent(notification.groupId)}`
      : "/groups";
  }

  return null;
}
