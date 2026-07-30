import { Eye, Receipt } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getAdminUploadViewUrl,
  getAdminUploads,
  reviewAdminUpload,
  type AdminUploadRecord,
} from "../../../domains/admin-reporting";
import { useFeedback } from "../../../shared/providers/FeedbackProvider";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { AdminPagination } from "../components/AdminPagination";
import { AdminSearchInput } from "../components/AdminSearchInput";
import {
  formatDateTime,
  formatFileSize,
  getUploadStatusLabel,
  useAdminPagination,
} from "../lib/admin.utils";

export function AdminUploadsPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingUploads, setIsLoadingUploads] = useState(true);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isReviewSubmitting, setIsReviewSubmitting] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUpload, setSelectedUpload] = useState<AdminUploadRecord | null>(null);
  const [uploads, setUploads] = useState<AdminUploadRecord[]>([]);
  const { t } = useLanguage();
  const { confirm, showToast } = useFeedback();

  async function loadUploads() {
    try {
      setIsLoadingUploads(true);
      setErrorMessage("");
      const response = await getAdminUploads();
      setUploads(response.uploads ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load admin uploads.",
      );
    } finally {
      setIsLoadingUploads(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function run() {
      if (!isMounted) {
        return;
      }

      await loadUploads();
    }

    void run();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleOpenPreview(upload: AdminUploadRecord) {
    try {
      setSelectedUpload(upload);
      setPreviewUrl("");
      setRejectReason(upload.rejectionReason ?? "");
      setIsLoadingPreview(true);
      const response = await getAdminUploadViewUrl(upload.id);
      setPreviewUrl(response.url ?? "");
    } catch (error) {
      setSelectedUpload(null);
      showToast({
        title: "Unable to open bill",
        message:
          error instanceof Error ? error.message : "Unable to load receipt preview.",
        variant: "error",
      });
    } finally {
      setIsLoadingPreview(false);
    }
  }

  function handleClosePreview() {
    setSelectedUpload(null);
    setPreviewUrl("");
    setRejectReason("");
    setIsLoadingPreview(false);
    setIsReviewSubmitting(false);
  }

  async function handleApprove(upload: AdminUploadRecord) {
    const confirmed = await confirm({
      title: "Approve this bill?",
      message: `Bill ${upload.originalFileName} will move out of pending review.`,
      confirmLabel: "Approve",
    });

    if (!confirmed) {
      return;
    }

    try {
      setIsReviewSubmitting(true);
      await reviewAdminUpload(upload.id, { reviewStatus: "approved" });
      await loadUploads();
      showToast({
        title: "Bill approved",
        message: `${upload.originalFileName} was approved successfully.`,
        variant: "success",
      });
      handleClosePreview();
    } catch (error) {
      showToast({
        title: "Approve failed",
        message: error instanceof Error ? error.message : "Unable to approve bill.",
        variant: "error",
      });
    } finally {
      setIsReviewSubmitting(false);
    }
  }

  async function handleReject(upload: AdminUploadRecord) {
    const trimmedReason = rejectReason.trim();

    if (!trimmedReason) {
      showToast({
        title: "Reason required",
        message: "Please enter a reason before rejecting this bill.",
        variant: "error",
      });
      return;
    }

    try {
      setIsReviewSubmitting(true);
      await reviewAdminUpload(upload.id, {
        reviewStatus: "rejected",
        rejectionReason: trimmedReason,
      });
      await loadUploads();
      showToast({
        title: "Bill rejected",
        message: `${upload.originalFileName} was rejected successfully.`,
        variant: "success",
      });
      handleClosePreview();
    } catch (error) {
      showToast({
        title: "Reject failed",
        message: error instanceof Error ? error.message : "Unable to reject bill.",
        variant: "error",
      });
    } finally {
      setIsReviewSubmitting(false);
    }
  }

  const filteredUploads = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return uploads.filter((upload) => {
      if (!keyword) {
        return true;
      }

      return (
        upload.originalFileName.toLowerCase().includes(keyword) ||
        upload.uploadedByName.toLowerCase().includes(keyword) ||
        upload.uploadedByEmail.toLowerCase().includes(keyword) ||
        upload.groupName?.toLowerCase().includes(keyword) === true ||
        upload.expenseTitle?.toLowerCase().includes(keyword) === true
      );
    });
  }, [search, uploads]);

  const {
    page: uploadsPage,
    pageItems: pagedUploads,
    setPage: setUploadsPage,
    totalPages: uploadsTotalPages,
  } = useAdminPagination(filteredUploads);

  return (
    <>
      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {errorMessage}
        </div>
      )}

      <AdminSearchInput
        placeholder="Search uploads..."
        value={search}
        onChange={setSearch}
      />

      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
        {isLoadingUploads ? (
          <div className="space-y-3 p-5">
            <div className="h-12 animate-pulse rounded-xl bg-[#F3F4F6]" />
            <div className="h-12 animate-pulse rounded-xl bg-[#F3F4F6]" />
            <div className="h-12 animate-pulse rounded-xl bg-[#F3F4F6]" />
            <div className="h-12 animate-pulse rounded-xl bg-[#F3F4F6]" />
            <div className="h-12 animate-pulse rounded-xl bg-[#F3F4F6]" />
          </div>
        ) : filteredUploads.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F3F4F6] bg-[#FAFAFA]">
                    {["File", "Uploader", "Group", "Expense", "Status", "Uploaded", "Actions"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-5 py-3 text-left text-xs uppercase tracking-wider text-[#9CA3AF]"
                          style={{ fontWeight: 700 }}
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pagedUploads.map((upload) => (
                    <tr
                      key={upload.id}
                      className="border-b border-[#F9FAFB] transition-colors hover:bg-[#F0FAF5]"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0FAF5] shadow-sm">
                            <Receipt className="h-4 w-4 text-[#16A34A]" strokeWidth={2.25} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm text-[#111827]" style={{ fontWeight: 600 }}>
                              {upload.originalFileName}
                            </p>
                            <p className="truncate text-xs text-[#9CA3AF]">
                              {upload.fileKind.toUpperCase()} /{" "}
                              {formatFileSize(upload.sizeInBytes)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm text-[#111827]" style={{ fontWeight: 600 }}>
                          {upload.uploadedByName}
                        </p>
                        <p className="truncate text-xs text-[#9CA3AF]">
                          {upload.uploadedByEmail}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-[#374151]">
                        {upload.groupName ?? "Unassigned"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-[#374151]">
                        {upload.expenseTitle ?? "Not linked"}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${
                            upload.reviewStatus === "approved" ||
                            upload.processingStatus === "processed"
                              ? "bg-[#D1FAE5] text-[#065f46]"
                              : upload.reviewStatus === "rejected" ||
                                  upload.processingStatus === "failed"
                                ? "bg-[#FEE2E2] text-[#991b1b]"
                                : "bg-[#FEF3C7] text-[#92400e]"
                          }`}
                          style={{ fontWeight: 600 }}
                        >
                          {getUploadStatusLabel(upload, t)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-[#9CA3AF]">
                        {formatDateTime(upload.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => void handleOpenPreview(upload)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs text-[#111827] transition-colors hover:bg-[#F9FAFB]"
                            style={{ fontWeight: 600 }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Xem bill
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={uploadsPage}
              totalPages={uploadsTotalPages}
              onPageChange={setUploadsPage}
            />
          </>
        ) : (
          <AdminEmptyState
            icon={Receipt}
            title={t.noUploads}
            description={t.noUploadsDesc}
          />
        )}
      </div>

      {selectedUpload && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={handleClosePreview}
          />
          <div className="relative flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.75rem] border border-[#E5E7EB] bg-white shadow-[0_24px_64px_rgba(17,24,39,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#F3F4F6] px-6 py-5">
              <div className="min-w-0">
                <h2 className="truncate text-lg text-[#111827]" style={{ fontWeight: 800 }}>
                  {selectedUpload.originalFileName}
                </h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {selectedUpload.uploadedByName} • {selectedUpload.uploadedByEmail}
                </p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  {selectedUpload.groupName ?? "Unassigned"} •{" "}
                  {selectedUpload.expenseTitle ?? "Not linked"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClosePreview}
                className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm text-[#374151] transition-colors hover:bg-[#F9FAFB]"
                style={{ fontWeight: 600 }}
              >
                Close
              </button>
            </div>

            <div className="grid min-h-0 flex-1 gap-0 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-h-[50vh] bg-[#F9FAFB] p-4">
                <div className="flex h-full min-h-[45vh] items-center justify-center overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
                  {isLoadingPreview ? (
                    <div className="text-sm text-[#6B7280]">Loading bill preview...</div>
                  ) : !previewUrl ? (
                    <div className="text-sm text-[#6B7280]">No preview available.</div>
                  ) : selectedUpload.fileKind === "pdf" ? (
                    <iframe
                      src={previewUrl}
                      title={selectedUpload.originalFileName}
                      className="h-[70vh] w-full"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt={selectedUpload.originalFileName}
                      className="max-h-[70vh] w-auto max-w-full object-contain"
                    />
                  )}
                </div>
              </div>

              <div className="border-t border-[#F3F4F6] p-5 lg:border-t-0 lg:border-l">
                <div className="space-y-4">
                  <div className="rounded-2xl bg-[#F9FAFB] p-4">
                    <p className="text-xs uppercase tracking-wider text-[#9CA3AF]">
                      Current status
                    </p>
                    <p className="mt-2 text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                      {getUploadStatusLabel(selectedUpload, t)}
                    </p>
                    {selectedUpload.reviewedByName && (
                      <p className="mt-2 text-xs text-[#6B7280]">
                        Reviewed by {selectedUpload.reviewedByName}
                        {selectedUpload.reviewedAt
                          ? ` at ${formatDateTime(selectedUpload.reviewedAt)}`
                          : ""}
                      </p>
                    )}
                    {selectedUpload.rejectionReason && (
                      <p className="mt-2 text-xs text-[#B91C1C]">
                        Reason: {selectedUpload.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="reject-reason"
                      className="mb-2 block text-sm text-[#111827]"
                      style={{ fontWeight: 700 }}
                    >
                      Rejection reason
                    </label>
                    <textarea
                      id="reject-reason"
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                      placeholder="Ví dụ: Ảnh mờ, không đọc được thông tin, bill không hợp lệ..."
                      className="min-h-32 w-full rounded-2xl border border-[#D1D5DB] px-4 py-3 text-sm text-[#111827] outline-none transition-colors placeholder:text-[#9CA3AF] focus:border-[#16A34A]"
                      disabled={isReviewSubmitting}
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      type="button"
                      onClick={() => void handleApprove(selectedUpload)}
                      disabled={isReviewSubmitting || isLoadingPreview}
                      className="rounded-2xl bg-[#16A34A] px-4 py-3 text-sm text-white transition-colors hover:bg-[#15803D] disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ fontWeight: 700 }}
                    >
                      {isReviewSubmitting ? "Saving..." : "Duyệt bill"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReject(selectedUpload)}
                      disabled={isReviewSubmitting || isLoadingPreview}
                      className="rounded-2xl bg-[#DC2626] px-4 py-3 text-sm text-white transition-colors hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ fontWeight: 700 }}
                    >
                      {isReviewSubmitting ? "Saving..." : "Từ chối bill"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
