import {
  getJson,
  patchJsonWithoutBody,
} from "../../../shared/api/client";
import type {
  GetMySettlementsParams,
  GetMySettlementsResponse,
  MarkSettlementAsSentResponse,
} from "../models/settlements.types";

function buildMySettlementsQuery(params: GetMySettlementsParams) {
  const query = new URLSearchParams();

  if (params.page !== undefined) {
    query.set("page", String(params.page));
  }
  if (params.limit !== undefined) {
    query.set("limit", String(params.limit));
  }
  if (params.status !== undefined) {
    query.set("status", params.status);
  }
  if (params.groupId !== undefined) {
    query.set("groupId", params.groupId);
  }
  if (params.expenseId !== undefined) {
    query.set("expenseId", params.expenseId);
  }
  if (params.role !== undefined) {
    query.set("role", params.role);
  }

  return query.toString();
}

export function getMySettlements(params: GetMySettlementsParams = {}) {
  const query = buildMySettlementsQuery(params);

  return getJson<GetMySettlementsResponse>(
    `/api/settlements/my${query ? `?${query}` : ""}`,
  );
}

export function markSettlementAsSent(settlementId: string) {
  return patchJsonWithoutBody<MarkSettlementAsSentResponse>(
    `/api/settlements/${encodeURIComponent(settlementId)}/sent`,
  );
}
