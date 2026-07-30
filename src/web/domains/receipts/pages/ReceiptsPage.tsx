import { useEffect, useMemo, useState } from "react";
import { Upload, Search, FileText, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { formatFileSize, formatShortDate } from "../../../shared/lib/formatters";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import { getGroups, type Group } from "../../groups";
import { useFeedback } from "../../../shared/providers/FeedbackProvider";
import { getReceipts, uploadReceiptFile, type ReceiptUpload } from "..";
import { getReceiptPublicUrl, getReceiptViewUrl } from "..";
import { getCurrentUserBilling, type CurrentUserBillingSummary } from "../../users";

const statusStyles: Record<string, string> = {
  processed: "bg-[#D1FAE5] text-[#065f46]",
  pending: "bg-[#FEF3C7] text-[#92400e]",
  failed: "bg-[#FEE2E2] text-[#991b1b]",
};

export function ReceiptsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [dragOver, setDragOver] = useState(false);
  const [receipts, setReceipts] = useState<ReceiptUpload[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [billingSummary, setBillingSummary] = useState<CurrentUserBillingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptUpload | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const { t } = useLanguage();
  const { confirm, showToast } = useFeedback();
  const navigate = useNavigate();
  const isFreePlan = billingSummary?.profile.plan !== "pro";

  const filters = [
    { key: "all", label: t.all },
    { key: "processed", label: t.processed },
    { key: "pending", label: t.pendingReview },
    { key: "failed", label: t.failedErrors },
  ];

  async function loadReceiptData() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [receiptsResponse, groupsResponse, billingResponse] = await Promise.all([
        getReceipts(),
        getGroups(),
        getCurrentUserBilling(),
      ]);

      setReceipts(receiptsResponse.receipts ?? []);
      setGroups(groupsResponse.groups ?? []);
      setBillingSummary(billingResponse.billing ?? null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load receipts.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadReceiptData();
  }, []);

  async function handleOpenReceipt(receipt: ReceiptUpload) {
    try {
      setSelectedReceipt(receipt);
      setPreviewUrl("");
      setIsPreviewLoading(true);
      const response = await getReceiptViewUrl(receipt.id);
      setPreviewUrl(response.url ?? getReceiptPublicUrl(receipt) ?? "");
    } catch {
      setPreviewUrl(getReceiptPublicUrl(receipt) ?? "");
    } finally {
      setIsPreviewLoading(false);
    }
  }

  function handleCloseReceiptPreview() {
    setSelectedReceipt(null);
    setPreviewUrl("");
    setIsPreviewLoading(false);
  }

  const groupsById = useMemo(
    () => new Map(groups.map((group) => [group.id, group.name])),
    [groups],
  );

  const filteredReceipts = receipts.filter((receipt) => {
    const keyword = search.trim().toLowerCase();
    const groupName = receipt.groupId ? groupsById.get(receipt.groupId) ?? "" : "";
    const matchesSearch =
      !keyword ||
      receipt.originalFileName.toLowerCase().includes(keyword) ||
      groupName.toLowerCase().includes(keyword);
    const matchesFilter = filter === "all" || receipt.processingStatus === filter;

    return matchesSearch && matchesFilter;
  });

  const receiptStats = {
    processed: receipts.filter((receipt) => receipt.reviewStatus === "approved")
      .length,
    pending: receipts.filter((receipt) => receipt.processingStatus === "pending")
      .length,
    failed: receipts.filter((receipt) => receipt.reviewStatus === "rejected").length,
  };

  const handleUploadFile = async (file: File) => {
    try {
      setIsUploading(true);
      setErrorMessage("");

      const uploadedReceipt = await uploadReceiptFile({
        file,
      });

      setReceipts((prevReceipts) => [uploadedReceipt, ...prevReceipts]);

      showToast({
        variant: "success",
        message: "Receipt uploaded successfully.",
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to upload receipt.";

      setErrorMessage(message);
      showToast({
        variant: "error",
        message,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRequestUploadUpgrade = async () => {
    const confirmed = await confirm({
      title: "Receipt upload needs Pro",
      message: "Free plan does not include receipt upload. Upgrade to Pro to continue.",
      confirmLabel: "Go to billing",
      cancelLabel: "Not now",
    });

    if (!confirmed) {
      return;
    }

    navigate("/settings?tab=billing");
  };

  const handleFileSelection = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    if (file) {
      void handleUploadFile(file);
      event.target.value = "";
    }
  };

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1
              className="text-[#111827]"
              style={{ fontSize: "1.5rem", fontWeight: 800 }}
            >
              {t.receiptsTitle}
            </h1>
            <p className="text-[#6B7280] text-sm mt-0.5">
              {receipts.length} {t.receiptsUploaded}
            </p>
          </div>
          <button
            type="button"
            onClick={(event) => {
              if (isFreePlan) {
                event.preventDefault();
                void handleRequestUploadUpgrade();
                return;
              }

              const input = event.currentTarget.querySelector(
                'input[type="file"]',
              ) as HTMLInputElement | null;

              input?.click();
            }}
            className="flex items-center gap-2 bg-[#16A34A] text-white px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-all shadow-sm cursor-pointer"
            style={{ fontWeight: 600, fontSize: "0.875rem" }}
          >
            <Plus className="w-4 h-4" />
            {isFreePlan ? "Upgrade to Pro" : isUploading ? "Uploading..." : t.uploadReceipt}
            {!isFreePlan && (
              <input
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.pdf"
                disabled={isUploading}
                onChange={handleFileSelection}
              />
            )}
          </button>
        </div>

        <label
          onClick={(event) => {
            if (isFreePlan) {
              event.preventDefault();
              void handleRequestUploadUpgrade();
            }
          }}
          className={`border-2 border-dashed rounded-2xl p-10 mb-7 text-center transition-all cursor-pointer ${
            dragOver
              ? "border-[#7EDDBA] bg-[#F0FAF5]"
              : "border-[#D1FAE5] bg-white hover:border-[#7EDDBA] hover:bg-[#F0FAF5]"
          }`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            const file = event.dataTransfer.files?.[0];

            if (file) {
              void handleUploadFile(file);
            }
          }}
        >
          <div className="w-14 h-14 bg-[#D1FAE5] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-7 h-7 text-[#16A34A]" />
          </div>
          <p className="text-[#374151] mb-1" style={{ fontWeight: 600 }}>
            {t.dragDrop}
          </p>
          <p className="text-[#9CA3AF] text-sm">{t.dragDropHint}</p>
          <input
            type="file"
            className="hidden"
            accept=".png,.jpg,.jpeg,.pdf"
            disabled={isUploading}
            onChange={handleFileSelection}
          />
        </label>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            { label: t.processed, value: `${receiptStats.processed}`, bg: "bg-[#F0FAF5]" },
            { label: t.pendingReview, value: `${receiptStats.pending}`, bg: "bg-[#FEFCE8]" },
            { label: t.failedErrors, value: `${receiptStats.failed}`, bg: "bg-[#FEF2F2]" },
          ].map(({ label, value, bg }) => (
            <div key={label} className={`${bg} rounded-2xl p-5 border border-white`}>
              <p
                className="text-[#111827]"
                style={{ fontSize: "1.5rem", fontWeight: 800 }}
              >
                {value}
              </p>
              <p className="text-[#6B7280] text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder={t.searchReceipts}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA]"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-xl p-1">
            {filters.map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                  filter === filterOption.key
                    ? "bg-[#16A34A] text-white shadow-sm"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
                style={{ fontWeight: 500 }}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          {isLoading ? (
            <div className="px-5 py-8 text-sm text-[#6B7280]">
              Loading receipts...
            </div>
          ) : filteredReceipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <div className="w-16 h-16 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-[#7EDDBA]" />
              </div>
              <h3 className="text-[#111827] mb-1" style={{ fontWeight: 700 }}>
                {receipts.length === 0 ? t.noReceiptsTitle : t.noResultsFound}
              </h3>
              <p className="text-[#6B7280] text-sm mb-6">
                {receipts.length === 0 ? t.noReceiptsDesc : t.adjustFilter}
              </p>
              {receipts.length === 0 && (
                <button
                  type="button"
                  onClick={(event) => {
                    if (isFreePlan) {
                      event.preventDefault();
                      void handleRequestUploadUpgrade();
                      return;
                    }

                    const input = event.currentTarget.querySelector(
                      'input[type="file"]',
                    ) as HTMLInputElement | null;

                    input?.click();
                  }}
                  className="flex items-center gap-2 bg-[#16A34A] text-white px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors cursor-pointer"
                  style={{ fontWeight: 600, fontSize: "0.875rem" }}
                >
                  <Upload className="w-4 h-4" />
                  {isUploading ? "Uploading..." : t.uploadFirstReceipt}
                  {!isFreePlan && (
                    <input
                      type="file"
                      className="hidden"
                      accept=".png,.jpg,.jpeg,.pdf"
                      disabled={isUploading}
                      onChange={handleFileSelection}
                    />
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F3F4F6]">
                    {["File", "Group", "Type", "Size", "Status", "Uploaded", "Action"].map((heading) => (
                      <th
                        key={heading}
                        className="text-left px-5 py-3 text-xs text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap"
                        style={{ fontWeight: 600 }}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredReceipts.map((receipt) => (
                    <tr
                      key={receipt.id}
                      className="border-b border-[#F9FAFB] hover:bg-[#FAFAFA] transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-[#F0FAF5] rounded-xl flex items-center justify-center flex-shrink-0">
                            <FileText className="w-3.5 h-3.5 text-[#16A34A]" />
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-sm text-[#111827] truncate"
                              style={{ fontWeight: 500 }}
                            >
                              {receipt.originalFileName}
                            </p>
                            <p className="text-xs text-[#9CA3AF] truncate">
                              {receipt.mimeType}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td
                        className="px-5 py-3.5 text-sm text-[#374151] whitespace-nowrap"
                        style={{ fontWeight: 500 }}
                      >
                        {receipt.groupId
                          ? groupsById.get(receipt.groupId) ?? "Unknown group"
                          : "Unassigned"}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#6B7280] whitespace-nowrap">
                        {receipt.fileKind.toUpperCase()}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#6B7280] whitespace-nowrap">
                        {formatFileSize(receipt.sizeInBytes)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full ${
                            receipt.reviewStatus === "approved"
                              ? "bg-[#D1FAE5] text-[#065f46]"
                              : receipt.reviewStatus === "rejected"
                                ? "bg-[#FEE2E2] text-[#991b1b]"
                                : statusStyles[receipt.processingStatus] ||
                                  "bg-[#F3F4F6] text-[#6B7280]"
                          }`}
                          style={{ fontWeight: 500 }}
                        >
                          {receipt.reviewStatus === "approved"
                            ? t.processed
                            : receipt.reviewStatus === "rejected"
                              ? t.failedErrors
                              : receipt.processingStatus === "processed"
                                ? t.processed
                                : receipt.processingStatus === "failed"
                                  ? t.failedErrors
                                  : t.pendingReview}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#9CA3AF] whitespace-nowrap">
                        {formatShortDate(receipt.createdAt)}
                      </td>
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => void handleOpenReceipt(receipt)}
                          className="rounded-xl border border-[#D1D5DB] px-3 py-2 text-xs text-[#111827] transition-colors hover:bg-[#F9FAFB]"
                          style={{ fontWeight: 600 }}
                        >
                          View bill
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {selectedReceipt && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={handleCloseReceiptPreview}
          />
          <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-[1.75rem] border border-[#E5E7EB] bg-white shadow-[0_24px_64px_rgba(17,24,39,0.22)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#F3F4F6] px-6 py-5">
              <div className="min-w-0">
                <h2 className="truncate text-lg text-[#111827]" style={{ fontWeight: 800 }}>
                  {selectedReceipt.originalFileName}
                </h2>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {selectedReceipt.reviewStatus === "approved"
                    ? "Approved"
                    : selectedReceipt.reviewStatus === "rejected"
                      ? "Rejected"
                      : "Pending review"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseReceiptPreview}
                className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm text-[#374151] transition-colors hover:bg-[#F9FAFB]"
                style={{ fontWeight: 600 }}
              >
                Close
              </button>
            </div>
            <div className="min-h-[60vh] bg-[#F9FAFB] p-4">
              <div className="flex h-full min-h-[55vh] items-center justify-center overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
                {isPreviewLoading ? (
                  <div className="text-sm text-[#6B7280]">Loading bill preview...</div>
                ) : previewUrl ? (
                  selectedReceipt.fileKind === "pdf" ? (
                    <iframe
                      src={previewUrl}
                      title={selectedReceipt.originalFileName}
                      className="h-[75vh] w-full"
                    />
                  ) : (
                    <img
                      src={previewUrl}
                      alt={selectedReceipt.originalFileName}
                      className="max-h-[75vh] w-auto max-w-full object-contain"
                    />
                  )
                ) : (
                  <div className="text-sm text-[#6B7280]">No preview available.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
