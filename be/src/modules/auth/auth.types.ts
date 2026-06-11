export type UserRole = "admin" | "user";

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

export interface PublicUser {
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
  user?: PublicUser;
}
