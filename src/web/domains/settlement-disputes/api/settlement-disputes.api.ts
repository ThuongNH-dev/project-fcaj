import { getJson, patchJson, postJson } from "../../../shared/api/client";
import type {
  CreateDisputeEvidencePresignPayload,
  CreateDisputeEvidencePresignResponse,
  CreateDisputePayload,
  CreateDisputeResponse,
  GetDisputeEvidenceViewUrlResponse,
  GetDisputeResponse,
  GetAdminDisputesParams,
  GetMyDisputesParams,
  GetMyDisputesResponse,
  UpdateAdminDisputeStatusPayload,
  UpdateAdminDisputeStatusResponse,
} from "../models/settlement-disputes.types";

function appendDisputeQuery(
  params: GetMyDisputesParams | GetAdminDisputesParams,
) {
  const query = new URLSearchParams();

  if (params.page !== undefined) query.set("page", String(params.page));
  if (params.limit !== undefined) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  if (params.settlementId) query.set("settlementId", params.settlementId);
  if (params.groupId) query.set("groupId", params.groupId);
  if ("createdByUserId" in params && params.createdByUserId) {
    query.set("createdByUserId", params.createdByUserId);
  }

  return query.toString();
}

export function createDisputeEvidencePresign(
  payload: CreateDisputeEvidencePresignPayload,
) {
  return postJson<
    CreateDisputeEvidencePresignPayload,
    CreateDisputeEvidencePresignResponse
  >("/api/settlement-disputes/evidence/presign", payload);
}

export function createSettlementDispute(payload: CreateDisputePayload) {
  return postJson<CreateDisputePayload, CreateDisputeResponse>(
    "/api/settlement-disputes",
    payload,
  );
}

export function getMySettlementDisputes(params: GetMyDisputesParams = {}) {
  const queryString = appendDisputeQuery(params);

  return getJson<GetMyDisputesResponse>(
    `/api/settlement-disputes/my${queryString ? `?${queryString}` : ""}`,
  );
}

export function getSettlementDisputeById(disputeId: string) {
  return getJson<GetDisputeResponse>(
    `/api/settlement-disputes/${encodeURIComponent(disputeId)}`,
  );
}

export function getSettlementDisputeEvidenceViewUrl(
  disputeId: string,
  evidenceId: string,
) {
  return getJson<GetDisputeEvidenceViewUrlResponse>(
    `/api/settlement-disputes/${encodeURIComponent(disputeId)}/evidence/${encodeURIComponent(evidenceId)}/view-url`,
  );
}

export function getAdminSettlementDisputes(params: GetAdminDisputesParams = {}) {
  const queryString = appendDisputeQuery(params);

  return getJson<GetMyDisputesResponse>(
    `/api/admin/settlement-disputes${queryString ? `?${queryString}` : ""}`,
  );
}

export function getAdminSettlementDisputeById(disputeId: string) {
  return getJson<GetDisputeResponse>(
    `/api/admin/settlement-disputes/${encodeURIComponent(disputeId)}`,
  );
}

export function updateAdminSettlementDisputeStatus(
  disputeId: string,
  payload: UpdateAdminDisputeStatusPayload,
) {
  return patchJson<
    UpdateAdminDisputeStatusPayload,
    UpdateAdminDisputeStatusResponse
  >(
    `/api/admin/settlement-disputes/${encodeURIComponent(disputeId)}/status`,
    payload,
  );
}

export function getAdminSettlementDisputeEvidenceViewUrl(
  disputeId: string,
  evidenceId: string,
) {
  return getJson<GetDisputeEvidenceViewUrlResponse>(
    `/api/admin/settlement-disputes/${encodeURIComponent(disputeId)}/evidence/${encodeURIComponent(evidenceId)}/view-url`,
  );
}
