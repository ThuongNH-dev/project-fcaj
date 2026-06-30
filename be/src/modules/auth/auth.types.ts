export type UserRole = "admin" | "user";
export type SupportedCurrency = "USD" | "VND";
export type BillingPlan = "free" | "pro";

export interface UserBillingProfile {
  plan: BillingPlan;
  status: "active";
  updatedAt: string;
}

export interface UserBillingUsageSummary {
  groupCount: number;
  groupLimit: number | null;
  expenseCount: number;
  expenseLimit: number | null;
  receiptScanIncluded: boolean;
}

export interface CurrentUserBillingSummary {
  profile: UserBillingProfile;
  usage: UserBillingUsageSummary;
}

export interface NotificationPreferences {
  expenseAdded: boolean;
  paymentReceived: boolean;
  settlementReminder: boolean;
  weeklyDigest: boolean;
  groupInvites: boolean;
  marketingEmails: boolean;
}

export interface RegisterUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  bio?: string;
  avatarUrl?: string;
  defaultCurrency?: string;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token?: string;
  email?: string;
  otp?: string;
  newPassword: string;
}

export interface VerifyResetOtpInput {
  email: string;
  otp: string;
}

export interface PublicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  avatarUrl: string;
  defaultCurrency: SupportedCurrency;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  ok: boolean;
  message: string;
  user?: PublicUser;
  token?: string;
}

export interface UpdateCurrentUserInput {
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
  defaultCurrency?: SupportedCurrency;
}

export interface ChangeCurrentUserPasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateNotificationPreferencesInput {
  expenseAdded?: boolean;
  paymentReceived?: boolean;
  settlementReminder?: boolean;
  weeklyDigest?: boolean;
  groupInvites?: boolean;
  marketingEmails?: boolean;
}

export interface UpdateCurrentUserBillingInput {
  plan: BillingPlan;
}
