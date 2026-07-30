import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMySettlements, markSettlementAsSent } from "./settlements.api";

const { mockGetJson, mockPatchJsonWithoutBody } = vi.hoisted(() => ({
  mockGetJson: vi.fn(),
  mockPatchJsonWithoutBody: vi.fn(),
}));

vi.mock("../../../shared/api/client", () => ({
  getJson: mockGetJson,
  patchJsonWithoutBody: mockPatchJsonWithoutBody,
}));

describe("settlements api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets settlements using backend defaults when filters are omitted", () => {
    getMySettlements();

    expect(mockGetJson).toHaveBeenCalledWith("/api/settlements/my");
  });

  it("gets pending settlements where the current user is the debtor", () => {
    getMySettlements({ role: "debtor", status: "pending" });

    expect(mockGetJson).toHaveBeenCalledWith(
      "/api/settlements/my?status=pending&role=debtor",
    );
  });

  it("passes pagination and every supported backend filter", () => {
    getMySettlements({
      page: 2,
      limit: 50,
      status: "sent",
      groupId: "group/id",
      expenseId: "expense?id",
      role: "creditor",
    });

    expect(mockGetJson).toHaveBeenCalledWith(
      "/api/settlements/my?page=2&limit=50&status=sent&groupId=group%2Fid&expenseId=expense%3Fid&role=creditor",
    );
  });

  it("marks a settlement as sent using an encoded id and no body", () => {
    markSettlementAsSent("settlement/id");

    expect(mockPatchJsonWithoutBody).toHaveBeenCalledWith(
      "/api/settlements/settlement%2Fid/sent",
    );
  });
});
