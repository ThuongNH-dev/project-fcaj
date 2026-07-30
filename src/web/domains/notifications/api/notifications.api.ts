import { deleteJson, getJson, patchJson, postJson } from "../../../shared/api/client";
import type {
  DeleteNotificationResponse,
  GetNotificationsParams,
  MarkAllNotificationsAsReadResponse,
  MarkNotificationAsReadResponse,
  NotificationsResponse,
  SyncNotificationsResponse,
  UnreadNotificationCountResponse,
} from "../models/notifications.types";

type EmptyPayload = Record<string, never>;

const EMPTY_PAYLOAD: EmptyPayload = {};
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

export function getNotifications(params: GetNotificationsParams = {}) {
  const query = new URLSearchParams({
    page: String(params.page ?? DEFAULT_PAGE),
    limit: String(params.limit ?? DEFAULT_LIMIT),
  });

  return getJson<NotificationsResponse>(`/api/notifications?${query.toString()}`);
}

export function getUnreadNotificationCount() {
  return getJson<UnreadNotificationCountResponse>(
    "/api/notifications/unread-count",
  );
}

export function markNotificationAsRead(notificationId: string) {
  return patchJson<EmptyPayload, MarkNotificationAsReadResponse>(
    `/api/notifications/${encodeURIComponent(notificationId)}/read`,
    EMPTY_PAYLOAD,
  );
}

export function markAllNotificationsAsRead() {
  return patchJson<EmptyPayload, MarkAllNotificationsAsReadResponse>(
    "/api/notifications/read-all",
    EMPTY_PAYLOAD,
  );
}

export function deleteNotification(notificationId: string) {
  return deleteJson<DeleteNotificationResponse>(
    `/api/notifications/${encodeURIComponent(notificationId)}`,
  );
}

export function syncNotifications() {
  return postJson<EmptyPayload, SyncNotificationsResponse>(
    "/api/notifications/sync",
    EMPTY_PAYLOAD,
  );
}
