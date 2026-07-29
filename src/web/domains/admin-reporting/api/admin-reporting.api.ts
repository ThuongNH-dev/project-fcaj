import {
  deleteJson,
  downloadFile,
  getJson,
  patchJson,
} from "../../../shared/api/client";
import { getStoredToken } from "../../auth";
import type {
  AdminActivityResponse,
  AdminDashboardResponse,
  AdminDeleteUserResponse,
  AdminDeleteGroupResponse,
  AdminGroupResponse,
  AdminGroupsResponse,
  AdminRejectedResponse,
  AdminSessionResponse,
  AdminUserResponse,
  AdminUsersResponse,
  AdminSettlementsQuery,
  AdminSettlementsResponse,
  AdminSettlementResponse,
  AdminUploadsResponse,
  UpdateAdminBanStatusPayload,
  UpdateAdminBanStatusResponse,
  UpdateAdminUserRolePayload,
  UpdateAdminUserRoleResponse,
} from "../models/admin-reporting.types";

export function getAdminDashboard() {
  return getJson<AdminDashboardResponse>("/api/admin/dashboard");
}

export function getAdminUsers() {
  return getJson<AdminUsersResponse>("/api/admin/users");
}

export function getAdminUser(userId: string) {
  return getJson<AdminUserResponse>(`/api/admin/users/${userId}`);
}

export function updateAdminUserRole(
  userId: string,
  payload: UpdateAdminUserRolePayload,
) {
  return patchJson<UpdateAdminUserRolePayload, UpdateAdminUserRoleResponse>(
    `/api/admin/users/${userId}`,
    payload,
  );
}

export function deleteAdminUser(userId: string) {
  return deleteJson<AdminDeleteUserResponse>(`/api/admin/users/${userId}`);
}

export function downloadAdminUsersExport() {
  return downloadFile("/api/admin/users/export");
}

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:5000";

export async function fetchAdminUsersExportText() {
  const token = getStoredToken();
  const response = await fetch(`${API_BASE_URL}/api/admin/users/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (!response.ok) {
    throw new Error("Unable to export users.");
  }

  return response.text();
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

export function updateAdminUserBan(
  userId: string,
  payload: UpdateAdminBanStatusPayload,
) {
  return patchJson<UpdateAdminBanStatusPayload, UpdateAdminBanStatusResponse>(
    `/api/admin/users/${userId}/ban`,
    payload,
  );
}

export function updateAdminGroupBan(
  groupId: string,
  payload: UpdateAdminBanStatusPayload,
) {
  return patchJson<UpdateAdminBanStatusPayload, UpdateAdminBanStatusResponse>(
    `/api/admin/groups/${groupId}/ban`,
    payload,
  );
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