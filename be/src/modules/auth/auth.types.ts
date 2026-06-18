export type UserRole = "admin" | "user";
export type SupportedCurrency = "USD" | "VND";

export interface RegisterUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  bio?: string;
  avatarUrl?: string;
  defaultCurrency?: string;
  role?: UserRole;
}

export interface LoginUserInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
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
