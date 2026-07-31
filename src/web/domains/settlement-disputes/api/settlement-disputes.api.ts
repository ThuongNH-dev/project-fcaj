import { getJson, postJson } from "../../../shared/api/client";
import type {
  CreateDisputeEvidencePresignPayload,
  CreateDisputeEvidencePresignResponse,
  CreateDisputePayload,
  CreateDisputeResponse,
  GetDisputeEvidenceViewUrlResponse,
  GetDisputeResponse,
  GetMyDisputesParams,
  GetMyDisputesResponse,
} from "../models/settlement-disputes.types";

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
  const query = new URLSearchParams();

  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.status) query.set("status", params.status);
  if (params.settlementId) query.set("settlementId", params.settlementId);
  if (params.groupId) query.set("groupId", params.groupId);

  const queryString = query.toString();

  return getJson<GetMyDisputesResponse>(
    `/api/settlement-disputes/my${queryString ? `?${queryString}` : ""}`,
  );
}

export function getSettlementDisputeById(disputeId: string) {
  return getJson<GetDisputeResponse>(`/api/settlement-disputes/${disputeId}`);
}

export function getSettlementDisputeEvidenceViewUrl(
  disputeId: string,
  evidenceId: string,
) {
  return getJson<GetDisputeEvidenceViewUrlResponse>(
    `/api/settlement-disputes/${disputeId}/evidence/${evidenceId}/view-url`,
  );
}