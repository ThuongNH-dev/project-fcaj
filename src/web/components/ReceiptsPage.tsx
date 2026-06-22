import { useEffect, useMemo, useState } from "react";
import { Upload, Search, FileText, Plus } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  getReceipts,
  getReceiptViewUrl,
  uploadReceiptFile,
  type ReceiptUpload,
} from "../api/receipts";
import { useFeedback } from "./ui/FeedbackProvider";

function formatReceiptSize(sizeInBytes: number) {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ReceiptsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [dragOver, setDragOver] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [activeReceiptActionId, setActiveReceiptActionId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [uploadedReceipts, setUploadedReceipts] = useState<ReceiptUpload[]>([]);
  const { t } = useLanguage();
  const { showToast } = useFeedback();

  const filters = [
    { key: "all", label: t.all },
    { key: "processed", label: t.processed },
    { key: "pending", label: t.pendingReview },
    { key: "failed", label: t.failedErrors },
  ];

  useEffect(() => {
    let isMounted = true;

    async function loadReceipts() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const response = await getReceipts();

        if (isMounted) {
          setUploadedReceipts(response.receipts ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load receipts.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadReceipts();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredReceipts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return uploadedReceipts.filter((receipt) => {
      const matchesSearch =
        !keyword ||
        receipt.originalFileName.toLowerCase().includes(keyword) ||
        receipt.mimeType.toLowerCase().includes(keyword);
      const matchesFilter =
        filter === "all" || receipt.processingStatus === filter;

      return matchesSearch && matchesFilter;
    });
  }, [filter, search, uploadedReceipts]);

  const receiptStats = {
    processed: uploadedReceipts.filter((receipt) => receipt.processingStatus === "processed")
      .length,
    pending: uploadedReceipts.filter((receipt) => receipt.processingStatus === "pending")
      .length,
    failed: uploadedReceipts.filter((receipt) => receipt.processingStatus === "failed").length,
  };

  async function handleUploadFile(file: File) {
    try {
      setIsUploading(true);
      setErrorMessage("");

      const uploadedReceipt = await uploadReceiptFile({
        file,
      });

      setUploadedReceipts((currentReceipts) => [uploadedReceipt, ...currentReceipts]);
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
  }

  async function handleOpenReceipt(receiptId: string, download?: boolean) {
    try {
      setActiveReceiptActionId(`${receiptId}:${download ? "download" : "view"}`);
      const response = await getReceiptViewUrl(receiptId, download);

      if (!response.url) {
        throw new Error("Receipt access URL was not returned.");
      }

      if (download) {
        const link = document.createElement("a");
        link.href = response.url;
        link.target = "_blank";
        link.rel = "noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        window.open(response.url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to open receipt.";

      showToast({
        variant: "error",
        message,
      });
    } finally {
      setActiveReceiptActionId("");
    }
  }

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-[#111827]" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{t.receiptsTitle}</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">{uploadedReceipts.length} {t.receiptsUploaded}</p>
          </div>
          <label className="flex items-center gap-2 bg-[#16A34A] text-white px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-all shadow-sm cursor-pointer" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
            <Plus className="w-4 h-4" />
            {isUploading ? "Uploading..." : t.uploadReceipt}
            <input
              type="file"
              className="hidden"
              accept="image/*,.pdf"
              disabled={isUploading}
              onChange={(e) => {
                const file = e.target.files?.[0];

                if (file) {
                  void handleUploadFile(file);
                  e.target.value = "";
                }
              }}
            />
          </label>
        </div>

        <div
          className={`border-2 border-dashed rounded-2xl p-10 mb-7 text-center transition-all cursor-pointer ${dragOver ? "border-[#7EDDBA] bg-[#F0FAF5]" : "border-[#D1FAE5] bg-white hover:border-[#7EDDBA] hover:bg-[#F0FAF5]"}`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];

            if (file) {
              void handleUploadFile(file);
            }
          }}
        >
          <div className="w-14 h-14 bg-[#D1FAE5] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Upload className="w-7 h-7 text-[#16A34A]" />
          </div>
          <p className="text-[#374151] mb-1" style={{ fontWeight: 600 }}>{t.dragDrop}</p>
          <p className="text-[#9CA3AF] text-sm">{t.dragDropHint}</p>
        </div>

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
              <p className="text-[#111827]" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{value}</p>
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
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA]"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-xl p-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-1.5 rounded-lg text-sm transition-all ${filter === f.key ? "bg-[#16A34A] text-white shadow-sm" : "text-[#6B7280] hover:text-[#111827]"}`}
                style={{ fontWeight: 500 }}
              >
                {f.label}
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
                {uploadedReceipts.length === 0 ? t.noReceiptsTitle : t.noResultsFound}
              </h3>
              <p className="text-[#6B7280] text-sm mb-6">
                {uploadedReceipts.length === 0 ? t.noReceiptsDesc : t.adjustFilter}
              </p>
              <label className="flex items-center gap-2 bg-[#16A34A] text-white px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors cursor-pointer" style={{ fontWeight: 600, fontSize: "0.875rem" }}>
                <Upload className="w-4 h-4" />
                {isUploading ? "Uploading..." : t.uploadFirstReceipt}
                <input
                  type="file"
                  className="hidden"
                  accept="image/*,.pdf"
                  disabled={isUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (file) {
                      void handleUploadFile(file);
                      e.target.value = "";
                    }
                  }}
                />
              </label>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F3F4F6]">
                    {["File", "Type", "Size", "Status", "Created", "Actions"].map((heading) => (
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
                            <p className="text-sm text-[#111827] truncate" style={{ fontWeight: 500 }}>
                              {receipt.originalFileName}
                            </p>
                            <p className="text-xs text-[#9CA3AF] truncate">
                              {receipt.storedFileName}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#374151] whitespace-nowrap">
                        {receipt.fileKind.toUpperCase()}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#374151] whitespace-nowrap">
                        {formatReceiptSize(receipt.sizeInBytes)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full ${
                            receipt.processingStatus === "processed"
                              ? "bg-[#D1FAE5] text-[#065f46]"
                              : receipt.processingStatus === "failed"
                                ? "bg-[#FEE2E2] text-[#991b1b]"
                                : "bg-[#FEF3C7] text-[#92400e]"
                          }`}
                          style={{ fontWeight: 500 }}
                        >
                          {receipt.processingStatus === "processed"
                            ? t.processed
                            : receipt.processingStatus === "failed"
                              ? t.failedErrors
                              : t.pendingReview}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#9CA3AF] whitespace-nowrap">
                        {new Date(receipt.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              void handleOpenReceipt(receipt.id);
                            }}
                            disabled={activeReceiptActionId === `${receipt.id}:view`}
                            className="rounded-lg border border-[#D1D5DB] px-3 py-1.5 text-xs text-[#374151] hover:bg-[#F9FAFB] disabled:cursor-not-allowed disabled:opacity-60"
                            style={{ fontWeight: 600 }}
                          >
                            {activeReceiptActionId === `${receipt.id}:view` ? "Opening..." : "View"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void handleOpenReceipt(receipt.id, true);
                            }}
                            disabled={activeReceiptActionId === `${receipt.id}:download`}
                            className="rounded-lg bg-[#16A34A] px-3 py-1.5 text-xs text-white hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-60"
                            style={{ fontWeight: 600 }}
                          >
                            {activeReceiptActionId === `${receipt.id}:download`
                              ? "Preparing..."
                              : "Download"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
