import { getJson } from "../client";
import type {
  AdminDashboardResponse,
  AdminGroupsResponse,
  AdminSessionResponse,
} from "./admin.types";

export function getAdminDashboard() {
  return getJson<AdminDashboardResponse>("/api/admin/dashboard");
}

export function getAdminGroups() {
  return getJson<AdminGroupsResponse>("/api/admin/groups");
}

export function getAdminSession() {
  return getJson<AdminSessionResponse>("/api/admin/session");
}
