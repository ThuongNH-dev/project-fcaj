import { Receipt } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getAdminUploads,
  type AdminUploadRecord,
} from "../../../domains/admin-reporting";
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
  const [search, setSearch] = useState("");
  const [uploads, setUploads] = useState<AdminUploadRecord[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    let isMounted = true;

    async function loadUploads() {
      try {
        setIsLoadingUploads(true);
        setErrorMessage("");
        const response = await getAdminUploads();

        if (isMounted) {
          setUploads(response.uploads ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load admin uploads.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingUploads(false);
        }
      }
    }

    void loadUploads();

    return () => {
      isMounted = false;
    };
  }, []);

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
                    {["File", "Uploader", "Group", "Expense", "Status", "Uploaded"].map(
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
                            upload.processingStatus === "processed"
                              ? "bg-[#D1FAE5] text-[#065f46]"
                              : upload.processingStatus === "failed"
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
    </>
  );
}