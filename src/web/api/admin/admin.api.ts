import { getJson } from "../client";
import type {
  AdminDashboardResponse,
  AdminGroupResponse,
  AdminGroupsResponse,
  AdminSessionResponse,
} from "./admin.types";

export function getAdminDashboard() {
  return getJson<AdminDashboardResponse>("/api/admin/dashboard");
}

export function getAdminGroups() {
  return getJson<AdminGroupsResponse>("/api/admin/groups");
}

export function getAdminGroup(groupId: string) {
  return getJson<AdminGroupResponse>(`/api/admin/groups/${groupId}`);
}

export function getAdminSession() {
  return getJson<AdminSessionResponse>("/api/admin/session");
}
