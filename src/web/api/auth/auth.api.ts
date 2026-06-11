import { postJson } from "../client";
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
} from "./auth.types";

export function loginUser(payload: LoginPayload) {
  return postJson<LoginPayload, AuthResponse>("/api/auth/login", payload);
}

export function registerUser(payload: RegisterPayload) {
  return postJson<RegisterPayload, AuthResponse>("/api/auth/register", payload);
}
