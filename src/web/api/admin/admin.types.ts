import type { AuthUser } from "../auth";
import type { Group } from "../groups";

export interface AdminSessionResponse {
  ok: boolean;
  message: string;
  user?: AuthUser;
}

export interface AdminDashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalGroups: number;
  totalExpenses: number;
  totalReceiptUploads: number;
  newUsersLast7Days: number;
  recentUsers: AuthUser[];
}

export interface AdminDashboardResponse {
  ok: boolean;
  message: string;
  stats?: AdminDashboardStats;
}

export interface AdminGroupsResponse {
  ok: boolean;
  message: string;
  groups?: Group[];
}

export interface AdminGroupResponse {
  ok: boolean;
  message: string;
  group?: Group;
}

export interface AdminDeleteGroupResponse {
  ok: boolean;
  message: string;
}

export interface AdminUploadRecord {
  id: string;
  originalFileName: string;
  storedFileName: string;
  storagePath: string;
  mimeType: string;
  fileKind: "image" | "pdf";
  sizeInBytes: number;
  processingStatus: "pending" | "processed" | "failed";
  reviewStatus: "pending" | "approved" | "rejected";
  ocrStatus: "pending" | "completed" | "failed";
  uploadedByUserId: string;
  uploadedByName: string;
  uploadedByEmail: string;
  groupId: string | null;
  groupName: string | null;
  expenseId: string | null;
  expenseTitle: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUploadsResponse {
  ok: boolean;
  message: string;
  uploads?: AdminUploadRecord[];
}

export interface AdminRejectedRecord {
  id: string;
  entityType: "receipt" | "expense";
  title: string;
  groupName: string | null;
  actorName: string;
  status: string;
  reason: string;
  createdAt: string;
}

export interface AdminRejectedResponse {
  ok: boolean;
  message: string;
  rejectedItems?: AdminRejectedRecord[];
}

export interface AdminActivityLog {
  id: string;
  eventType:
    | "user_registered"
    | "group_created"
    | "expense_created"
    | "receipt_uploaded";
  title: string;
  description: string;
  createdAt: string;
}

export interface AdminActivityResponse {
  ok: boolean;
  message: string;
  activityLogs?: AdminActivityLog[];
}
