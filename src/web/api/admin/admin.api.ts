import { getJson } from "../client";
import type { AdminSessionResponse } from "./admin.types";

export function getAdminSession() {
  return getJson<AdminSessionResponse>("/api/admin/session");
}
