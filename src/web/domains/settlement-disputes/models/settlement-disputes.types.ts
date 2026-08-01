export type SettlementDisputeStatus = "pending" | "resolved" | "rejected";

export type SettlementDisputeReason =
  | "payment_not_received"
  | "incorrect_amount"
  | "unauthorized_settlement"
  | "other";

export type DisputeEvidenceMimeType = "image/jpeg" | "image/png" | "image/webp";

export interface PublicDisputeEvidence {
  id: string;
  originalFileName: string;
  mimeType: DisputeEvidenceMimeType;
  sizeInBytes: number;
  uploadedAt: string;
}

export interface SettlementDispute {
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

export interface CreateDisputeEvidencePresignPayload {
  settlementId: string;
  originalFileName: string;
  mimeType: DisputeEvidenceMimeType;
  sizeInBytes: number;
}

export interface CreateDisputeEvidencePresignResponse {
  ok: boolean;
  message: string;
  uploadUrl: string;
  objectKey: string;
  expiresIn: number;
  headers?: Record<string, string>;
}

export interface DisputeEvidenceInput {
  objectKey: string;
  originalFileName: string;
  mimeType: DisputeEvidenceMimeType;
  sizeInBytes: number;
}

export interface CreateDisputePayload {
  settlementId: string;
  reason: SettlementDisputeReason;
  description: string;
  evidence: DisputeEvidenceInput[];
}

export interface CreateDisputeResponse {
  ok: boolean;
  message: string;
  dispute: SettlementDispute;
}

export interface DisputesPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetMyDisputesParams {
  page?: number;
  limit?: number;
  status?: SettlementDisputeStatus;
  settlementId?: string;
  groupId?: string;
}

export interface GetAdminDisputesParams extends GetMyDisputesParams {
  createdByUserId?: string;
}

export interface GetMyDisputesResponse {
  ok: boolean;
  message: string;
  disputes: SettlementDispute[];
  pagination: DisputesPagination;
}

export interface GetDisputeResponse {
  ok: boolean;
  message: string;
  dispute: SettlementDispute;
}

export interface UpdateAdminDisputeStatusPayload {
  status: "resolved" | "rejected";
  adminNote: string;
}

export interface UpdateAdminDisputeStatusResponse {
  ok: boolean;
  message: string;
  dispute: SettlementDispute;
}

export interface GetDisputeEvidenceViewUrlResponse {
  ok: boolean;
  message: string;
  url: string;
  expiresIn: number;
}
