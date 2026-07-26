import { Eye, Trash2, X, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getAdminRejected,
  type AdminRejectedRecord,
} from "../../../domains/admin-reporting";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import { useFeedback } from "../../../shared/providers/FeedbackProvider";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { AdminPagination } from "../components/AdminPagination";
import { AdminSearchInput } from "../components/AdminSearchInput";
import { formatDateTime, useAdminPagination } from "../lib/admin.utils";
import { toTitleCase } from "../../../shared/lib/formatters";

export function AdminRejectedPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingRejected, setIsLoadingRejected] = useState(true);
  const [rejectedItems, setRejectedItems] = useState<AdminRejectedRecord[]>([]);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<AdminRejectedRecord | null>(null);
  const { t } = useLanguage();
  const { confirm, showToast } = useFeedback();

  useEffect(() => {
    let isMounted = true;

    async function loadRejected() {
      try {
        setIsLoadingRejected(true);
        setErrorMessage("");
        const response = await getAdminRejected();

        if (isMounted) {
          setRejectedItems(response.rejectedItems ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load rejected items.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingRejected(false);
        }
      }
    }

    void loadRejected();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRejectedItems = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return rejectedItems.filter((item) => {
      if (!keyword) {
        return true;
      }

      return (
        item.title.toLowerCase().includes(keyword) ||
        item.actorName.toLowerCase().includes(keyword) ||
        item.groupName?.toLowerCase().includes(keyword) === true ||
        item.reason.toLowerCase().includes(keyword)
      );
    });
  }, [rejectedItems, search]);

  const {
    page: rejectedPage,
    pageItems: pagedRejectedItems,
    setPage: setRejectedPage,
    totalPages: rejectedTotalPages,
  } = useAdminPagination(filteredRejectedItems);

  function handleOpenDetail(item: AdminRejectedRecord) {
    setSelectedItem(item);
  }

  function handleCloseDetail() {
    setSelectedItem(null);
  }

  async function handleRemoveFromList(item: AdminRejectedRecord) {
    const confirmed = await confirm({
      cancelLabel: t.cancel,
      confirmLabel: t.remove,
      message: `Remove "${item.title}" from this list?`,
      title: t.remove,
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    setRejectedItems((currentItems) =>
      currentItems.filter((currentItem) => currentItem.id !== item.id),
    );
    setSelectedItem((currentSelectedItem) =>
      currentSelectedItem?.id === item.id ? null : currentSelectedItem,
    );
    showToast({
      message: "Removed from this list.",
      variant: "success",
    });
  }

  return (
    <>
      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {errorMessage}
        </div>
      )}

      <AdminSearchInput
        placeholder="Search rejected items..."
        value={search}
        onChange={setSearch}
      />

      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
        {isLoadingRejected ? (
          <div className="space-y-3 p-5">
            <div className="h-12 animate-pulse rounded-xl bg-[#F3F4F6]" />
            <div className="h-12 animate-pulse rounded-xl bg-[#F3F4F6]" />
            <div className="h-12 animate-pulse rounded-xl bg-[#F3F4F6]" />
            <div className="h-12 animate-pulse rounded-xl bg-[#F3F4F6]" />
            <div className="h-12 animate-pulse rounded-xl bg-[#F3F4F6]" />
          </div>
        ) : filteredRejectedItems.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F3F4F6] bg-[#FAFAFA]">
                    {["Type", "Title", "Group", "Actor", "Reason", "Status", "Date", "Action"].map(
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
                  {pagedRejectedItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-[#F9FAFB] transition-colors hover:bg-[#FEF2F2]"
                    >
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${
                            item.entityType === "receipt"
                              ? "bg-[#EFF6FF] text-[#1e40af]"
                              : "bg-[#FEF3C7] text-[#92400e]"
                          }`}
                          style={{ fontWeight: 600 }}
                        >
                          {item.entityType}
                        </span>
                      </td>
                      <td
                        className="px-5 py-3.5 text-sm text-[#111827]"
                        style={{ fontWeight: 600 }}
                      >
                        {item.title}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-[#374151]">
                        {item.groupName ?? "Unassigned"}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-sm text-[#374151]">
                        {item.actorName}
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#B91C1C]">{item.reason}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs ${
                            item.status === "rejected"
                              ? "bg-[#FEE2E2] text-[#991b1b]"
                              : "bg-[#FEF3C7] text-[#92400e]"
                          }`}
                          style={{ fontWeight: 600 }}
                        >
                          {toTitleCase(item.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5 text-xs text-[#9CA3AF]">
                        {formatDateTime(item.createdAt)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3.5">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetail(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F0FAF5] hover:text-[#16A34A]"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => void handleRemoveFromList(item)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#FEF2F2] hover:text-[#DC2626]"
                            title={t.remove}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={rejectedPage}
              totalPages={rejectedTotalPages}
              onPageChange={setRejectedPage}
            />
          </>
        ) : (
          <AdminEmptyState
            icon={XCircle}
            title={t.noRejectedTx}
            description={t.noRejectedDesc}
          />
        )}
      </div>

      {selectedItem && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/35 backdrop-blur-sm"
            onClick={handleCloseDetail}
          />
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-[#E5E7EB] bg-white p-6 shadow-[0_24px_64px_rgba(17,24,39,0.22)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                Rejected Item Detail
              </h3>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-2xl bg-[#F9FAFB] px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                  {selectedItem.title}
                </p>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs ${
                    selectedItem.status === "rejected"
                      ? "bg-[#FEE2E2] text-[#991b1b]"
                      : "bg-[#FEF3C7] text-[#92400e]"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {toTitleCase(selectedItem.status)}
                </span>
              </div>
              <p className="mt-1 text-sm text-[#6B7280]">
                {selectedItem.groupName ?? "Unassigned"}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#F9FAFB] px-4 py-3">
                <p className="text-xs uppercase text-[#9CA3AF]">Type</p>
                <p className="mt-1 text-sm text-[#111827]" style={{ fontWeight: 600 }}>
                  {toTitleCase(selectedItem.entityType)}
                </p>
              </div>
              <div className="rounded-xl bg-[#F9FAFB] px-4 py-3">
                <p className="text-xs uppercase text-[#9CA3AF]">Actor</p>
                <p className="mt-1 text-sm text-[#111827]" style={{ fontWeight: 600 }}>
                  {selectedItem.actorName}
                </p>
              </div>
              <div className="col-span-2 rounded-xl bg-[#F9FAFB] px-4 py-3">
                <p className="text-xs uppercase text-[#9CA3AF]">Date</p>
                <p className="mt-1 text-sm text-[#111827]" style={{ fontWeight: 600 }}>
                  {formatDateTime(selectedItem.createdAt)}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                Reason
              </p>
              <p className="text-sm text-[#B91C1C]">{selectedItem.reason}</p>
            </div>

            <button
              type="button"
              onClick={() => void handleRemoveFromList(selectedItem)}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C] transition-colors hover:bg-[#FEE2E2]"
              style={{ fontWeight: 600 }}
            >
              <Trash2 className="h-4 w-4" />
              {t.remove}
            </button>
          </div>
        </div>
      )}
    </>
  );
}