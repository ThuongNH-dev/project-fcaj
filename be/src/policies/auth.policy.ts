import type { UserRole } from "../modules/auth/auth.types.js";

export function isAdminUserRole(role: UserRole | null | undefined) {
  return role === "admin";
}
