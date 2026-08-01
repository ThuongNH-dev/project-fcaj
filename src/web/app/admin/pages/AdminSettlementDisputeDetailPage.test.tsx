import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SettlementDispute } from "../../../domains/settlement-disputes";
import { AdminSettlementDisputeDetailPage } from "./AdminSettlementDisputeDetailPage";

const {
  mockConfirm,
  mockGetAdminSettlementDisputeById,
  mockShowToast,
  mockUpdateAdminSettlementDisputeStatus,
} = vi.hoisted(() => ({
  mockConfirm: vi.fn(),
  mockGetAdminSettlementDisputeById: vi.fn(),
  mockShowToast: vi.fn(),
  mockUpdateAdminSettlementDisputeStatus: vi.fn(),
}));

vi.mock("../../../domains/settlement-disputes", () => ({
  getAdminSettlementDisputeById: mockGetAdminSettlementDisputeById,
  getAdminSettlementDisputeEvidenceViewUrl: vi.fn(),
  updateAdminSettlementDisputeStatus: mockUpdateAdminSettlementDisputeStatus,
}));

vi.mock("../../../shared/providers/FeedbackProvider", () => ({
  useFeedback: () => ({ confirm: mockConfirm, showToast: mockShowToast }),
}));

const pendingDispute: SettlementDispute = {
  id: "dispute-1",
  settlementId: "settlement-1",
  groupId: "group-1",
  createdByUserId: "user-1",
  againstUserId: "user-2",
  reason: "payment_not_received",
  description: "The recipient has not received the payment.",
  evidence: [],
  status: "pending",
  adminNote: null,
  handledByAdminId: null,
  createdAt: "2026-08-01T03:00:00.000Z",
  updatedAt: "2026-08-01T03:00:00.000Z",
};

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/admin/settlement-disputes/dispute-1"]}>
      <Routes>
        <Route
          path="/admin/settlement-disputes/:disputeId"
          element={<AdminSettlementDisputeDetailPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("AdminSettlementDisputeDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockResolvedValue(true);
    mockGetAdminSettlementDisputeById.mockResolvedValue({
      ok: true,
      message: "Settlement dispute fetched successfully.",
      dispute: pendingDispute,
    });
    mockUpdateAdminSettlementDisputeStatus.mockResolvedValue({
      ok: true,
      message: "Settlement dispute status updated successfully.",
      dispute: {
        ...pendingDispute,
        status: "resolved",
        adminNote: "Payment evidence verified.",
        handledByAdminId: "admin-1",
      },
    });
  });

  it("resolves a pending dispute with the required note", async () => {
    renderPage();

    expect(await screen.findByText("Payment not received")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Administrator note"), {
      target: { value: "Payment evidence verified." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Resolve" }));

    await waitFor(() => {
      expect(mockUpdateAdminSettlementDisputeStatus).toHaveBeenCalledWith("dispute-1", {
        status: "resolved",
        adminNote: "Payment evidence verified.",
      });
    });
    expect(screen.getByText("Administrator decision")).toBeInTheDocument();
    expect(mockShowToast).toHaveBeenCalledWith({
      variant: "success",
      message: "Settlement dispute status updated successfully.",
    });
  });
});
