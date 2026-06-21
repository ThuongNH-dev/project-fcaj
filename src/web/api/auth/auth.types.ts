export type UserRole = "admin" | "user";

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  bio: string;
  avatarUrl: string;
  defaultCurrency: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  ok: boolean;
  message: string;
  user?: AuthUser;
  token?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  bio?: string;
  avatarUrl?: string;
  defaultCurrency?: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ForgotPasswordResponse {
  ok: boolean;
  message: string;
  resetUrl?: string;
  otpCode?: string;
  expiresAt?: string;
}

export interface VerifyResetOtpPayload {
  email: string;
  otp: string;
}

export interface VerifyResetOtpResponse {
  ok: boolean;
  message: string;
}

export interface ResetPasswordPayload {
  token?: string;
  email?: string;
  otp?: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  ok: boolean;
  message: string;
}
