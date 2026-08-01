import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getAdminSettlementDisputeById,
  getAdminSettlementDisputes,
  getMySettlementDisputes,
  updateAdminSettlementDisputeStatus,
} from "./settlement-disputes.api";

const { mockGetJson, mockPatchJson, mockPostJson } = vi.hoisted(() => ({
  mockGetJson: vi.fn(),
  mockPatchJson: vi.fn(),
  mockPostJson: vi.fn(),
}));

vi.mock("../../../shared/api/client", () => ({
  getJson: mockGetJson,
  patchJson: mockPatchJson,
  postJson: mockPostJson,
}));

describe("settlement disputes api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists the current user's disputes with supported filters", () => {
    getMySettlementDisputes({
      page: 2,
      limit: 10,
      status: "pending",
      settlementId: "settlement/id",
      groupId: "group id",
    });

    expect(mockGetJson).toHaveBeenCalledWith(
      "/api/settlement-disputes/my?page=2&limit=10&status=pending&settlementId=settlement%2Fid&groupId=group+id",
    );
  });

  it("gets an admin dispute detail with an encoded id", () => {
    getAdminSettlementDisputeById("dispute/id");

    expect(mockGetJson).toHaveBeenCalledWith(
      "/api/admin/settlement-disputes/dispute%2Fid",
    );
  });

  it("lists disputes for admin with the admin-only creator filter", () => {
    getAdminSettlementDisputes({ status: "pending", createdByUserId: "user/id" });

    expect(mockGetJson).toHaveBeenCalledWith(
      "/api/admin/settlement-disputes?status=pending&createdByUserId=user%2Fid",
    );
  });

  it("updates a dispute status with the required admin note", () => {
    updateAdminSettlementDisputeStatus("dispute/id", {
      status: "resolved",
      adminNote: "Payment evidence verified.",
    });

    expect(mockPatchJson).toHaveBeenCalledWith(
      "/api/admin/settlement-disputes/dispute%2Fid/status",
      { status: "resolved", adminNote: "Payment evidence verified." },
    );
  });
});
