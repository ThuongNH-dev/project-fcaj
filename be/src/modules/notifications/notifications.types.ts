export type NotificationType =
  | "expense_added"
  | "payment_received"
  | "settlement_reminder"
  | "group_invite"
  | "product_update";

export interface NotificationPreferences {
  expenseAdded: boolean;
  paymentReceived: boolean;
  settlementReminders: boolean;
  groupInvites: boolean;
  productUpdatesAndTips: boolean;
}

export type NotificationPreferenceKey = keyof NotificationPreferences;

export interface UpdateNotificationPreferencesInput {
  expenseAdded?: boolean;
  paymentReceived?: boolean;
  settlementReminders?: boolean;
  groupInvites?: boolean;
  productUpdatesAndTips?: boolean;
}

export interface PublicNotification {
  id: string;
  recipientUserId: string;
  actorUserId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  groupId: string | null;
  expenseId: string | null;
  settlementId: string | null;
  isRead: boolean;
  readAt: string | null;
  deduplicationKey: string | null;
  createdAt: string;
}
