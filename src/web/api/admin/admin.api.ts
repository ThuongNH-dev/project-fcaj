import { deleteJson, getJson } from "../client";
import type {
  AdminActivityResponse,
  AdminDashboardResponse,
  AdminDeleteGroupResponse,
  AdminGroupResponse,
  AdminSettlementResponse,
  AdminGroupsResponse,
  AdminRejectedResponse,
  AdminSessionResponse,
  AdminSettlementsQuery,
  AdminSettlementsResponse,
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

export function getAdminSettlements(query: AdminSettlementsQuery = {}) {
  const searchParams = new URLSearchParams();

  if (query.status) {
    searchParams.set("status", query.status);
  }

  if (query.search) {
    searchParams.set("search", query.search);
  }

  if (query.groupId) {
    searchParams.set("groupId", query.groupId);
  }

  if (query.paidByUserId) {
    searchParams.set("paidByUserId", query.paidByUserId);
  }

  const queryString = searchParams.toString();

  return getJson<AdminSettlementsResponse>(
    `/api/admin/settlements${queryString ? `?${queryString}` : ""}`,
  );
}

export function getAdminSettlement(expenseId: string) {
  return getJson<AdminSettlementResponse>(`/api/admin/settlements/${expenseId}`);
}

export function getAdminActivityLogs() {
  return getJson<AdminActivityResponse>("/api/admin/activity");
}

export function getAdminSession() {
  return getJson<AdminSessionResponse>("/api/admin/session");
}
