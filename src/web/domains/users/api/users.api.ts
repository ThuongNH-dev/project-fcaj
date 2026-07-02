import { deleteJson, getJson, patchJson } from "../../../shared/api/client";
import type {
  CurrentUserBillingResponse,
  CurrentUserPaymentMethodResponse,
  ChangeCurrentUserPasswordPayload,
  CurrentUserResponse,
  DeleteCurrentUserResponse,
  NotificationPreferencesResponse,
  UpdateCurrentUserBillingPayload,
  UpdateCurrentUserPaymentMethodPayload,
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

export function getCurrentUserBilling() {
  return getJson<CurrentUserBillingResponse>("/api/users/me/billing");
}

export function updateCurrentUserBilling(
  payload: UpdateCurrentUserBillingPayload,
) {
  return patchJson<UpdateCurrentUserBillingPayload, CurrentUserBillingResponse>(
    "/api/users/me/billing",
    payload,
  );
}

export function getCurrentUserPaymentMethod() {
  return getJson<CurrentUserPaymentMethodResponse>("/api/users/me/payment-method");
}

export function updateCurrentUserPaymentMethod(
  payload: UpdateCurrentUserPaymentMethodPayload,
) {
  return patchJson<
    UpdateCurrentUserPaymentMethodPayload,
    CurrentUserPaymentMethodResponse
  >("/api/users/me/payment-method", payload);
}

export function deleteCurrentUserPaymentMethod() {
  return deleteJson<CurrentUserPaymentMethodResponse>("/api/users/me/payment-method");
}

export function deleteCurrentUser() {
  return deleteJson<DeleteCurrentUserResponse>("/api/users/me");
}
