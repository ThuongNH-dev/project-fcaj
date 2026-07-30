import type { AuthUser } from "../../auth";

export interface CurrentUserResponse {
  ok: boolean;
  message: string;
  user?: AuthUser;
}

export interface NotificationPreferences {
  expenseAdded: boolean;
  paymentReceived: boolean;
  settlementReminders: boolean;
  groupInvites: boolean;
  productUpdatesAndTips: boolean;
}

export type BillingPlan = "free" | "pro";

export interface CurrentUserBillingSummary {
  profile: {
    plan: BillingPlan;
    status: "active" | "expired";
    autoRenew: boolean;
    expiresAt: string | null;
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

export interface BillingHistoryRecord {
  id: string;
  txnRef: string;
  amount: number;
  currency: "VND";
  status: "pending" | "success" | "failed";
  plan: "pro";
  paidAt: string | null;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingHistoryResponse {
  ok: boolean;
  message: string;
  history?: BillingHistoryRecord[];
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

export interface UpdateCurrentUserBillingAutoRenewPayload {
  autoRenew: boolean;
}
