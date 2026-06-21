import type { PublicUser } from "../auth/auth.types.js";

export interface AdminDashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalGroups: number;
  totalExpenses: number;
  totalReceiptUploads: number;
  newUsersLast7Days: number;
  recentUsers: PublicUser[];
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
