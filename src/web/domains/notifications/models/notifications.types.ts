export type NotificationType =
  | "expense_added"
  | "payment_received"
  | "settlement_reminder"
  | "group_invite"
  | "product_update";

export interface AppNotification {
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

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
}

export interface NotificationsResponse {
  ok: boolean;
  message: string;
  notifications: AppNotification[];
  pagination: NotificationPagination;
}

export interface UnreadNotificationCountResponse {
  ok: boolean;
  message: string;
  unreadCount: number;
}

export interface MarkNotificationAsReadResponse {
  ok: boolean;
  message: string;
  notification: AppNotification;
}

export interface MarkAllNotificationsAsReadResponse {
  ok: boolean;
  message: string;
  modifiedCount: number;
}

export interface DeleteNotificationResponse {
  ok: boolean;
  message: string;
}

export interface SyncNotificationsResponse {
  ok: boolean;
  message: string;
  created: boolean;
  pendingSettlementCount: number;
}
