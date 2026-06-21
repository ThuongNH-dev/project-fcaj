import { deleteJson, getJson } from "../client";
import type {
  AdminActivityResponse,
  AdminDashboardResponse,
  AdminDeleteGroupResponse,
  AdminGroupResponse,
  AdminGroupsResponse,
  AdminRejectedResponse,
  AdminSessionResponse,
  AdminUploadsResponse,
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

export function deleteAdminGroup(groupId: string) {
  return deleteJson<AdminDeleteGroupResponse>(`/api/admin/groups/${groupId}`);
}

export function getAdminUploads() {
  return getJson<AdminUploadsResponse>("/api/admin/uploads");
}

export function getAdminRejected() {
  return getJson<AdminRejectedResponse>("/api/admin/rejected");
}

export function getAdminActivityLogs() {
  return getJson<AdminActivityResponse>("/api/admin/activity");
}

export function getAdminSession() {
  return getJson<AdminSessionResponse>("/api/admin/session");
}
