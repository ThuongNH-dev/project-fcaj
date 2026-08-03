import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminUploadRecord } from "../../../domains/admin-reporting";
import { LanguageProvider } from "../../../shared/providers/LanguageProvider";
import { AdminUploadsPage } from "./AdminUploadsPage";

const {
  mockConfirm,
  mockGetAdminUploads,
  mockGetAdminUploadViewUrl,
  mockReviewAdminUpload,
  mockShowToast,
} = vi.hoisted(() => ({
  mockConfirm: vi.fn(),
  mockGetAdminUploads: vi.fn(),
  mockGetAdminUploadViewUrl: vi.fn(),
  mockReviewAdminUpload: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock("../../../domains/admin-reporting", () => ({
  getAdminUploads: mockGetAdminUploads,
  getAdminUploadViewUrl: mockGetAdminUploadViewUrl,
  reviewAdminUpload: mockReviewAdminUpload,
}));

vi.mock("../../../shared/providers/FeedbackProvider", () => ({
  useFeedback: () => ({ confirm: mockConfirm, showToast: mockShowToast }),
}));

const pendingUpload: AdminUploadRecord = {
  id: "receipt-1",
  originalFileName: "dinner.png",
  storedFileName: "receipt-1.png",
  storagePath: "receipts/receipt-1.png",
  mimeType: "image/png",
  fileKind: "image",
  sizeInBytes: 1024,
  processingStatus: "pending",
  reviewStatus: "pending",
  ocrStatus: "pending",
  uploadedByUserId: "user-1",
  uploadedByName: "Alex Nguyen",
  uploadedByEmail: "alex@example.com",
  groupId: "group-1",
  groupName: "Weekend trip",
  expenseId: "expense-1",
  expenseTitle: "Dinner",
  rejectionReason: null,
  reviewedAt: null,
  reviewedBy: null,
  reviewedByName: null,
  createdAt: "2026-08-03T01:00:00.000Z",
  updatedAt: "2026-08-03T01:00:00.000Z",
};

function renderPage() {
  return render(
    <LanguageProvider>
      <AdminUploadsPage />
    </LanguageProvider>,
  );
}

async function openPendingUpload() {
  fireEvent.click(await screen.findByRole("button", { name: "View bill" }));
  await screen.findByRole("button", { name: "Approve bill" });
}

describe("AdminUploadsPage receipt review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockResolvedValue(true);
    mockGetAdminUploadViewUrl.mockResolvedValue({
      ok: true,
      message: "Admin receipt access URL created successfully.",
      url: "https://example.test/receipt-1.png",
      expiresIn: 300,
    });
    mockReviewAdminUpload.mockResolvedValue({
      ok: true,
      message: "Receipt reviewed successfully.",
    });
  });

  it("approves with the required payload then refreshes and displays Approved", async () => {
    mockGetAdminUploads
      .mockResolvedValueOnce({
        ok: true,
        message: "Admin uploads fetched successfully.",
        uploads: [pendingUpload],
      })
      .mockResolvedValueOnce({
        ok: true,
        message: "Admin uploads fetched successfully.",
        uploads: [{ ...pendingUpload, reviewStatus: "approved" }],
      });

    renderPage();
    await openPendingUpload();
    fireEvent.click(screen.getByRole("button", { name: "Approve bill" }));

    await waitFor(() => {
      expect(mockReviewAdminUpload).toHaveBeenCalledWith("receipt-1", {
        reviewStatus: "approved",
      });
      expect(mockGetAdminUploads).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText("Approved")).toBeInTheDocument();
  });

  it("requires a rejection reason before calling the review API", async () => {
    mockGetAdminUploads.mockResolvedValue({
      ok: true,
      message: "Admin uploads fetched successfully.",
      uploads: [pendingUpload],
    });

    renderPage();
    await openPendingUpload();
    fireEvent.click(screen.getByRole("button", { name: "Reject bill" }));

    expect(mockReviewAdminUpload).not.toHaveBeenCalled();
    expect(mockShowToast).toHaveBeenCalledWith({
      title: "Reason required",
      message: "Please enter a reason before rejecting this bill.",
      variant: "error",
    });
  });

  it("keeps the displayed pending state when the review API fails", async () => {
    mockGetAdminUploads.mockResolvedValue({
      ok: true,
      message: "Admin uploads fetched successfully.",
      uploads: [pendingUpload],
    });
    mockReviewAdminUpload.mockRejectedValue(new Error("Review request failed."));

    renderPage();
    await openPendingUpload();
    fireEvent.click(screen.getByRole("button", { name: "Approve bill" }));

    await waitFor(() => {
      expect(mockShowToast).toHaveBeenCalledWith({
        title: "Approve failed",
        message: "Review request failed.",
        variant: "error",
      });
    });
    expect(mockGetAdminUploads).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Approve bill" })).toBeEnabled();
  });

  it("does not submit a duplicate review request while approval is in flight", async () => {
    let resolveReview: (() => void) | undefined;
    mockGetAdminUploads
      .mockResolvedValueOnce({
        ok: true,
        message: "Admin uploads fetched successfully.",
        uploads: [pendingUpload],
      })
      .mockResolvedValueOnce({
        ok: true,
        message: "Admin uploads fetched successfully.",
        uploads: [{ ...pendingUpload, reviewStatus: "approved" }],
      });
    mockReviewAdminUpload.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveReview = () => resolve({
            ok: true,
            message: "Receipt approved successfully.",
          });
        }),
    );

    renderPage();
    await openPendingUpload();
    const approveButton = screen.getByRole("button", { name: "Approve bill" });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(mockReviewAdminUpload).toHaveBeenCalledTimes(1);
      expect(approveButton).toBeDisabled();
    });
    fireEvent.click(approveButton);
    expect(mockReviewAdminUpload).toHaveBeenCalledTimes(1);

    resolveReview?.();
    await waitFor(() => {
      expect(mockGetAdminUploads).toHaveBeenCalledTimes(2);
    });
  });

  it("rejects with the entered reason, refreshes, and displays Rejected", async () => {
    mockGetAdminUploads
      .mockResolvedValueOnce({
        ok: true,
        message: "Admin uploads fetched successfully.",
        uploads: [pendingUpload],
      })
      .mockResolvedValueOnce({
        ok: true,
        message: "Admin uploads fetched successfully.",
        uploads: [
          {
            ...pendingUpload,
            reviewStatus: "rejected",
            rejectionReason: "Receipt image is unreadable.",
          },
        ],
      });

    renderPage();
    await openPendingUpload();
    fireEvent.change(screen.getByLabelText("Rejection reason"), {
      target: { value: " Receipt image is unreadable. " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reject bill" }));

    await waitFor(() => {
      expect(mockReviewAdminUpload).toHaveBeenCalledWith("receipt-1", {
        reviewStatus: "rejected",
        rejectionReason: "Receipt image is unreadable.",
      });
      expect(mockGetAdminUploads).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText("Rejected")).toBeInTheDocument();
  });
});
