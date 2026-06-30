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

export type BillingPlan = "free" | "pro";

export interface CurrentUserBillingSummary {
  profile: {
    plan: BillingPlan;
    status: "active";
    updatedAt: string;
  };
  usage: {
    groupCount: number;
    groupLimit: number | null;
    expenseCount: number;
    expenseLimit: number | null;
    receiptScanIncluded: boolean;
  };
}

export interface NotificationPreferencesResponse {
  ok: boolean;
  message: string;
  notificationPreferences?: NotificationPreferences;
}

export interface CurrentUserBillingResponse {
  ok: boolean;
  message: string;
  billing?: CurrentUserBillingSummary;
}

export interface DeleteCurrentUserResponse {
  ok: boolean;
  message: string;
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

export interface UpdateCurrentUserBillingPayload {
  plan: BillingPlan;
}
