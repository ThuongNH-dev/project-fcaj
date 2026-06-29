import { getJson, patchJson } from "../../../shared/api/client";
import type {
  ChangeCurrentUserPasswordPayload,
  CurrentUserResponse,
  NotificationPreferencesResponse,
  UpdateNotificationPreferencesPayload,
  UpdateCurrentUserPayload,
} from "../models/users.types";

export function getCurrentUser() {
  return getJson<CurrentUserResponse>("/api/users/me");
}

export function updateCurrentUser(payload: UpdateCurrentUserPayload) {
  return patchJson<UpdateCurrentUserPayload, CurrentUserResponse>(
    "/api/users/me",
    payload,
  );
}

export function changeCurrentUserPassword(
  payload: ChangeCurrentUserPasswordPayload,
) {
  return patchJson<
    ChangeCurrentUserPasswordPayload,
    { ok: boolean; message: string }
  >("/api/users/me/password", payload);
}

export function getCurrentUserNotificationPreferences() {
  return getJson<NotificationPreferencesResponse>("/api/users/me/notifications");
}

export function updateCurrentUserNotificationPreferences(
  payload: UpdateNotificationPreferencesPayload,
) {
  return patchJson<
    UpdateNotificationPreferencesPayload,
    NotificationPreferencesResponse
  >("/api/users/me/notifications", payload);
}
