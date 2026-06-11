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
