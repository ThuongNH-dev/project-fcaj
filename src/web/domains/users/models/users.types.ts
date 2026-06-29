import type { AuthUser } from "../../auth";

export interface CurrentUserResponse {
  ok: boolean;
  message: string;
  user?: AuthUser;
}

export interface NotificationPreferences {
  expenseAdded: boolean;
  paymentReceived: boolean;
  settlementReminder: boolean;
  weeklyDigest: boolean;
  groupInvites: boolean;
  marketingEmails: boolean;
}

export interface NotificationPreferencesResponse {
  ok: boolean;
  message: string;
  notificationPreferences?: NotificationPreferences;
}

export interface UpdateCurrentUserPayload {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
  defaultCurrency?: "USD" | "VND";
}

export interface ChangeCurrentUserPasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateNotificationPreferencesPayload {
  notificationPreferences: Partial<NotificationPreferences>;
}
