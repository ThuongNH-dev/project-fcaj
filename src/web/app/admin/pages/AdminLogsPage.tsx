import { Activity } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getAdminActivityLogs,
  type AdminActivityLog,
} from "../../../domains/admin-reporting";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { AdminPagination } from "../components/AdminPagination";
import { AdminSearchInput } from "../components/AdminSearchInput";
import { formatDateTime, getLogTypeIcon, getLogTypeLabel, useAdminPagination } from "../lib/admin.utils";

export function AdminLogsPage() {
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [search, setSearch] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    let isMounted = true;

    async function loadActivity() {
      try {
        setIsLoadingActivity(true);
        setErrorMessage("");
        const response = await getAdminActivityLogs();

        if (isMounted) {
          setActivityLogs(response.activityLogs ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load activity logs.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingActivity(false);
        }
      }
    }

    void loadActivity();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredActivityLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return activityLogs.filter((activityLog) => {
      if (!keyword) {
        return true;
      }

      return (
        activityLog.title.toLowerCase().includes(keyword) ||
        activityLog.description.toLowerCase().includes(keyword)
      );
    });
  }, [activityLogs, search]);

  const {
    page: logsPage,
    pageItems: pagedActivityLogs,
    setPage: setLogsPage,
    totalPages: logsTotalPages,
  } = useAdminPagination(filteredActivityLogs);

  return (
    <>
      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {errorMessage}
        </div>
      )}

      <AdminSearchInput
        placeholder="Search activity logs..."
        value={search}
        onChange={setSearch}
      />

      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
        {isLoadingActivity ? (
          <div className="space-y-3 p-5">
            <div className="h-16 animate-pulse rounded-xl bg-[#F3F4F6]" />
            <div className="h-16 animate-pulse rounded-xl bg-[#F3F4F6]" />
            <div className="h-16 animate-pulse rounded-xl bg-[#F3F4F6]" />
            <div className="h-16 animate-pulse rounded-xl bg-[#F3F4F6]" />
            <div className="h-16 animate-pulse rounded-xl bg-[#F3F4F6]" />
          </div>
        ) : filteredActivityLogs.length > 0 ? (
          <div className="divide-y divide-[#F3F4F6]">
            {pagedActivityLogs.map((activityLog) => {
              const LogIcon = getLogTypeIcon(activityLog.eventType);

              return (
                <div
                  key={activityLog.id}
                  className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#FAFAFA]"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0FAF5] shadow-sm">
                      <LogIcon className="h-4 w-4 text-[#16A34A]" strokeWidth={2.25} />
                    </div>
                    <div className="min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span
                          className="inline-flex rounded-full bg-[#F0FAF5] px-2.5 py-1 text-xs text-[#166534]"
                          style={{ fontWeight: 700 }}
                        >
                          {getLogTypeLabel(activityLog.eventType)}
                        </span>
                        <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                          {activityLog.title}
                        </p>
                      </div>
                      <p className="text-sm text-[#6B7280]">{activityLog.description}</p>
                    </div>
                  </div>
                  <p className="whitespace-nowrap text-xs text-[#9CA3AF]">
                    {formatDateTime(activityLog.createdAt)}
                  </p>
                </div>
              );
            })}
            <AdminPagination
              page={logsPage}
              totalPages={logsTotalPages}
              onPageChange={setLogsPage}
            />
          </div>
        ) : (
          <AdminEmptyState
            icon={Activity}
            title={t.noLogsYet}
            description={t.noLogsDesc}
          />
        )}
      </div>
    </>
  );
}