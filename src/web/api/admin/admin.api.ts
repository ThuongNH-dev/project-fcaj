import { getJson } from "../client";
import type {
  AdminDashboardResponse,
  AdminSessionResponse,
} from "./admin.types";

export function getAdminDashboard() {
  return getJson<AdminDashboardResponse>("/api/admin/dashboard");
}

export function getAdminSession() {
  return getJson<AdminSessionResponse>("/api/admin/session");
}
