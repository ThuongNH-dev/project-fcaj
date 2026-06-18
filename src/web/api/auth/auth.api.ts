import { postJson } from "../client";
import type {
  AuthResponse,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  ResetPasswordResponse,
} from "./auth.types";

export function loginUser(payload: LoginPayload) {
  return postJson<LoginPayload, AuthResponse>("/api/auth/login", payload);
}

export function registerUser(payload: RegisterPayload) {
  return postJson<RegisterPayload, AuthResponse>("/api/auth/register", payload);
}

export function forgotPassword(payload: ForgotPasswordPayload) {
  return postJson<ForgotPasswordPayload, ForgotPasswordResponse>(
    "/api/auth/forgot-password",
    payload,
  );
}

export function resetPassword(payload: ResetPasswordPayload) {
  return postJson<ResetPasswordPayload, ResetPasswordResponse>(
    "/api/auth/reset-password",
    payload,
  );
}
