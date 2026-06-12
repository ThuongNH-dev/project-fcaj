import type { AuthUser } from "../auth";

export interface CurrentUserResponse {
  ok: boolean;
  message: string;
  user?: AuthUser;
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
