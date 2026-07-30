import type { ObjectId } from "mongodb";

export type SettlementDisputeStatus = "pending" | "resolved" | "rejected";

export type SettlementDisputeReason =
  | "payment_not_received"
  | "incorrect_amount"
  | "unauthorized_settlement"
  | "other";

export type DisputeEvidenceMimeType = "image/jpeg" | "image/png" | "image/webp";

export interface SettlementDisputeEvidence {
  id: string;
  objectKey: string;
  originalFileName: string;
  mimeType: DisputeEvidenceMimeType;
  sizeInBytes: number;
  uploadedAt: Date;
}

export interface SettlementDisputeDocument {
  _id?: ObjectId;

  settlementId: string;
  groupId: string;

  createdByUserId: string;
  againstUserId: string;

  reason: SettlementDisputeReason;
  description: string;

  evidence: SettlementDisputeEvidence[];

  status: SettlementDisputeStatus;

  adminNote: string | null;
  handledByAdminId: string | null;

  createdAt: Date;
  updatedAt: Date;
}

// ─── Public DTO ──────────────────────────────────────────────────────────────

export interface PublicDisputeEvidence {
  id: string;
  originalFileName: string;
  mimeType: DisputeEvidenceMimeType;
  sizeInBytes: number;
  uploadedAt: string;
}

export interface PublicSettlementDispute {
  id: string;
  settlementId: string;
  groupId: string;
  createdByUserId: string;
  againstUserId: string;
  reason: SettlementDisputeReason;
  description: string;
  evidence: PublicDisputeEvidence[];
  status: SettlementDisputeStatus;
  adminNote: string | null;
  handledByAdminId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateDisputeEvidenceInput {
  objectKey: string;
  originalFileName: string;
  mimeType: DisputeEvidenceMimeType;
  sizeInBytes: number;
}

export interface CreateDisputeInput {
  settlementId: string;
  reason: SettlementDisputeReason;
  description: string;
  evidence: CreateDisputeEvidenceInput[];
}

export interface GetDisputesFilters {
  status?: SettlementDisputeStatus;
  settlementId?: string;
  groupId?: string;
  createdByUserId?: string;
}

export interface DisputesPaginationOptions {
  page: number;
  limit: number;
}
