import type { AuthUser } from "../../auth";
import type { Group } from "../../groups";

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

export interface AdminUserRecord extends AuthUser {
  fullName: string;
  groupCount: number;
  ownedGroupCount: number;
  expenseCount: number;
  receiptUploadCount: number;
  pendingSettlementCount: number;
  settledExpenseCount: number;
  totalPaidAmount: number;
}

export interface AdminUserGroupMembership {
  id: string;
  name: string;
  role: "owner" | "member";
  updatedAt: string;
}

export interface AdminUserDetail extends AdminUserRecord {
  groups: AdminUserGroupMembership[];
}

export interface AdminUsersResponse {
  ok: boolean;
  message: string;
  users?: AdminUserRecord[];
}

export interface AdminUserResponse {
  ok: boolean;
  message: string;
  user?: AdminUserDetail;
}

export interface UpdateAdminUserRolePayload {
  role: "admin" | "user";
}

export interface UpdateAdminUserRoleResponse {
  ok: boolean;
  message: string;
  user?: AuthUser;
}

export interface AdminDeleteUserResponse {
  ok: boolean;
  message: string;
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

export interface AdminSettlementRecord {
  id: string;
  title: string;
  groupId: string;
  groupName: string | null;
  createdByUserId: string;
  createdByName: string;
  paidByUserId: string;
  paidByName: string;
  participantCount: number;
  amount: number;
  currency: string;
  expenseDate: string;
  settlementStatus: "pending" | "settled";
  settlementNote: string | null;
  settledAt: string | null;
  settledByUserId: string | null;
  settledByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminSettlementParticipant {
  userId: string;
  name: string;
  email: string;
  shareAmount: number;
}

export interface AdminSettlementDetail extends AdminSettlementRecord {
  description: string;
  receiptId: string | null;
  reviewStatus: "pending" | "approved" | "rejected";
  participants: AdminSettlementParticipant[];
}

export interface AdminSettlementsQuery {
  status?: "pending" | "settled";
  search?: string;
  groupId?: string;
  paidByUserId?: string;
}

export interface AdminSettlementsResponse {
  ok: boolean;
  message: string;
  settlements?: AdminSettlementRecord[];
}

export interface AdminSettlementResponse {
  ok: boolean;
  message: string;
  settlement?: AdminSettlementDetail;
}

export interface AdminActivityLog {
  id: string;
  eventType:
    | "user_registered"
    | "group_created"
    | "expense_created"
    | "expense_settled"
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
