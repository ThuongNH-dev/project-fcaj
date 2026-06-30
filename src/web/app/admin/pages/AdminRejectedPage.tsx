import { XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getAdminRejected,
  type AdminRejectedRecord,
} from "../../../domains/admin-reporting";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { AdminSearchInput } from "../components/AdminSearchInput";
import { formatDateTime } from "../lib/admin.utils";

export function AdminRejectedPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingRejected, setIsLoadingRejected] = useState(true);
  const [rejectedItems, setRejectedItems] = useState<AdminRejectedRecord[]>([]);
  const [search, setSearch] = useState("");
  const { t } = useLanguage();

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
          <div className="px-5 py-8 text-sm text-[#6B7280]">
            Loading rejected items...
          </div>
        ) : filteredRejectedItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#F3F4F6]">
                  {["Type", "Title", "Group", "Actor", "Reason", "Date"].map((heading) => (
                    <th
                      key={heading}
                      className="whitespace-nowrap px-5 py-3 text-left text-xs uppercase tracking-wider text-[#9CA3AF]"
                      style={{ fontWeight: 600 }}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredRejectedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[#F9FAFB] transition-colors hover:bg-[#FAFAFA]"
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
                    <td className="px-5 py-3.5 text-sm text-[#6B7280]">{item.reason}</td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-xs text-[#9CA3AF]">
                      {formatDateTime(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            icon={XCircle}
            title={t.noRejectedTx}
            description={t.noRejectedDesc}
          />
        )}
      </div>
    </>
  );
}
