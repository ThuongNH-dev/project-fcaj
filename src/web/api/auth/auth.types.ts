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
