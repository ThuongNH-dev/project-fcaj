import { Eye, Search, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getAdminSettlement,
  getAdminSettlements,
  type AdminSettlementDetail,
  type AdminSettlementRecord,
} from "../../../domains/admin-reporting";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../shared/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../shared/ui/select";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { AdminPagination } from "../components/AdminPagination";
import {
  formatCurrency,
  formatDateTime,
  formatLocalDate,
  getSettlementStatusLabel,
  useAdminPagination,
} from "../lib/admin.utils";

export function AdminSettlementsPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoadingSettlementDetail, setIsLoadingSettlementDetail] = useState(false);
  const [isLoadingSettlements, setIsLoadingSettlements] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSettlement, setSelectedSettlement] =
    useState<AdminSettlementDetail | null>(null);
  const [selectedSettlementId, setSelectedSettlementId] = useState<string | null>(null);
  const [settlementFilter, setSettlementFilter] = useState<"all" | "pending" | "settled">(
    "all",
  );
  const [settlements, setSettlements] = useState<AdminSettlementRecord[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    let isMounted = true;

    async function loadSettlements(nextFilter: "all" | "pending" | "settled") {
      try {
        setIsLoadingSettlements(true);
        setErrorMessage("");
        const response = await getAdminSettlements({
          status: nextFilter === "all" ? undefined : nextFilter,
        });
        const loadedSettlements = response.settlements ?? [];

        if (!isMounted) {
          return;
        }

        setSettlements(loadedSettlements);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load settlements.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingSettlements(false);
        }
      }
    }

    void loadSettlements(settlementFilter);

    return () => {
      isMounted = false;
    };
  }, [settlementFilter]);

  useEffect(() => {
    if (!selectedSettlementId) {
      return;
    }

    let isMounted = true;

    async function loadSettlementDetail() {
      try {
        setIsLoadingSettlementDetail(true);
        const response = await getAdminSettlement(selectedSettlementId);

        if (isMounted) {
          setSelectedSettlement(response.settlement ?? null);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load settlement detail.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingSettlementDetail(false);
        }
      }
    }

    void loadSettlementDetail();

    return () => {
      isMounted = false;
    };
  }, [selectedSettlementId]);

  function handleViewSettlement(settlementId: string) {
    setSelectedSettlementId(settlementId);
    setIsDetailOpen(true);
  }

  const filteredSettlements = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return settlements.filter((settlement) => {
      if (!keyword) {
        return true;
      }

      return (
        settlement.title.toLowerCase().includes(keyword) ||
        settlement.groupName?.toLowerCase().includes(keyword) === true ||
        settlement.createdByName.toLowerCase().includes(keyword) ||
        settlement.paidByName.toLowerCase().includes(keyword) ||
        settlement.settledByName?.toLowerCase().includes(keyword) === true ||
        getSettlementStatusLabel(settlement.settlementStatus).toLowerCase().includes(keyword)
      );
    });
  }, [search, settlements]);

  const settlementSummary = useMemo(() => {
    return filteredSettlements.reduce(
      (summary, settlement) => {
        summary.totalAmount += settlement.amount;

        if (settlement.settlementStatus === "pending") {
          summary.pendingAmount += settlement.amount;
          summary.pendingCount += 1;
          summary.pendingAmountsByCurrency.set(
            settlement.currency,
            (summary.pendingAmountsByCurrency.get(settlement.currency) ?? 0) +
              settlement.amount,
          );
        } else {
          summary.settledCount += 1;
        }

        return summary;
      },
      {
        pendingAmount: 0,
        pendingAmountsByCurrency: new Map<string, number>(),
        pendingCount: 0,
        settledCount: 0,
        totalAmount: 0,
      },
    );
  }, [filteredSettlements]);

  const pendingAmountSummaryLabel = useMemo(() => {
    if (settlementSummary.pendingAmountsByCurrency.size === 0) {
      return "--";
    }

    return Array.from(settlementSummary.pendingAmountsByCurrency.entries())
      .map(([currency, amount]) => formatCurrency(amount, currency))
      .join(", ");
  }, [settlementSummary.pendingAmountsByCurrency]);

  const {
    page: settlementsPage,
    pageItems: pagedSettlements,
    setPage: setSettlementsPage,
    totalPages: settlementsTotalPages,
  } = useAdminPagination(filteredSettlements);

  return (
    <>
      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {errorMessage}
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              bg: "bg-[#F0FAF5]",
              label: "Visible Settlements",
              value: filteredSettlements.length.toString(),
              valueClassName: "text-[#166534]",
            },
            {
              bg: "bg-[#FEF3C7]",
              label: "Pending Items",
              value: settlementSummary.pendingCount.toString(),
              valueClassName: "text-[#92400e]",
            },
            {
              bg: "bg-[#FEF2F2]",
              label: "Pending Amount",
              value: pendingAmountSummaryLabel,
              valueClassName: "text-[#B91C1C]",
            },
            {
              bg: "bg-[#EFF6FF]",
              label: "Settled Items",
              value: settlementSummary.settledCount.toString(),
              valueClassName: "text-[#1d4ed8]",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`${item.bg} rounded-2xl border border-white p-5 shadow-[0_1px_2px_rgba(17,24,39,0.06)] transition-all duration-200 hover:shadow-[0_8px_20px_rgba(17,24,39,0.08)] hover:-translate-y-0.5`}
            >
              <p
                className={`whitespace-pre-line text-2xl ${item.valueClassName}`}
                style={{ fontWeight: 800 }}
              >
                {item.value}
              </p>
              <p className="mt-1 text-xs text-[#6B7280]" style={{ fontWeight: 600 }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F3F4F6] px-5 py-4">
            <div>
              <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                Settlement Queue
              </h3>
              <p className="mt-1 text-sm text-[#6B7280]">
                Review pending and settled expenses across all groups.
              </p>
            </div>
            <div className="flex flex-wrap items-stretch gap-2">
              <div className="relative h-9 w-56">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder="Search settlements..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="box-border h-9 w-full rounded-xl border border-[#E5E7EB] bg-white pl-9 pr-4 text-sm leading-9 text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA]"
                />
              </div>
              <Select
                value={settlementFilter}
                onValueChange={(value) =>
                  setSettlementFilter(value as "all" | "pending" | "settled")
                }
              >
                <SelectTrigger className="h-9 w-40 rounded-xl border-[#E5E7EB] bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="settled">Settled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {isLoadingSettlements ? (
            <div className="space-y-3 p-5">
              <div className="h-14 animate-pulse rounded-xl bg-[#F3F4F6]" />
              <div className="h-14 animate-pulse rounded-xl bg-[#F3F4F6]" />
              <div className="h-14 animate-pulse rounded-xl bg-[#F3F4F6]" />
              <div className="h-14 animate-pulse rounded-xl bg-[#F3F4F6]" />
              <div className="h-14 animate-pulse rounded-xl bg-[#F3F4F6]" />
            </div>
          ) : filteredSettlements.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F3F4F6] bg-[#FAFAFA]">
                      {[
                        "Expense",
                        "Paid By",
                        "Amount",
                        "Participants",
                        "Status",
                        "Expense Date",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-5 py-3 text-left text-xs uppercase tracking-wider text-[#9CA3AF]"
                          style={{ fontWeight: 700 }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedSettlements.map((settlement) => {
                      const statusClassName =
                        settlement.settlementStatus === "settled"
                          ? "bg-[#D1FAE5] text-[#065f46]"
                          : "bg-[#FEF3C7] text-[#92400e]";

                      return (
                        <tr
                          key={settlement.id}
                          onClick={() => handleViewSettlement(settlement.id)}
                          className="cursor-pointer border-b border-[#F9FAFB] transition-colors hover:bg-[#F0FAF5]"
                        >
                          <td className="px-5 py-3.5">
                            <p
                              className="text-sm text-[#111827]"
                              style={{ fontWeight: 700 }}
                            >
                              {settlement.title}
                            </p>
                            <p className="truncate text-xs text-[#9CA3AF]">
                              {settlement.groupName ?? "Unknown group"}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-sm text-[#374151]">
                            {settlement.paidByName}
                          </td>
                          <td
                            className="whitespace-nowrap px-5 py-3.5 text-sm text-[#111827]"
                            style={{ fontWeight: 700 }}
                          >
                            {formatCurrency(settlement.amount, settlement.currency)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-sm text-[#374151]">
                            {settlement.participantCount}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5">
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs ${statusClassName}`}
                              style={{ fontWeight: 600 }}
                            >
                              {getSettlementStatusLabel(settlement.settlementStatus)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-sm text-[#374151]">
                            {formatLocalDate(settlement.expenseDate)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleViewSettlement(settlement.id);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F0FAF5] hover:text-[#16A34A]"
                              title="View settlement detail"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <AdminPagination
                page={settlementsPage}
                totalPages={settlementsTotalPages}
                onPageChange={setSettlementsPage}
              />
            </>
          ) : (
            <AdminEmptyState
              icon={TrendingUp}
              title={t.allClear}
              description={t.noSettlementsDesc}
            />
          )}
        </div>
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Settlement Detail</DialogTitle>
          </DialogHeader>
          <p className="-mt-3 text-sm text-[#6B7280]">
            Inspect allocation, notes, and settlement history.
          </p>

          {isLoadingSettlementDetail ? (
            <div className="space-y-3">
              <div className="h-24 animate-pulse rounded-2xl bg-[#F3F4F6]" />
              <div className="h-20 animate-pulse rounded-2xl bg-[#F3F4F6]" />
              <div className="h-32 animate-pulse rounded-2xl bg-[#F3F4F6]" />
            </div>
          ) : selectedSettlement ? (
            <div className="space-y-5">
              <div className="rounded-2xl bg-[#F9FAFB] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                      {selectedSettlement.title}
                    </p>
                    <p className="mt-1 text-sm text-[#6B7280]">
                      {selectedSettlement.groupName ?? "Unknown group"}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      selectedSettlement.settlementStatus === "settled"
                        ? "bg-[#D1FAE5] text-[#065f46]"
                        : "bg-[#FEF3C7] text-[#92400e]"
                    }`}
                    style={{ fontWeight: 700 }}
                  >
                    {getSettlementStatusLabel(selectedSettlement.settlementStatus)}
                  </span>
                </div>
                <p className="mt-4 text-2xl text-[#111827]" style={{ fontWeight: 800 }}>
                  {formatCurrency(selectedSettlement.amount, selectedSettlement.currency)}
                </p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  Created by {selectedSettlement.createdByName}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#F9FAFB] px-4 py-3">
                  <p className="text-xs uppercase text-[#9CA3AF]">Paid By</p>
                  <p className="mt-1 text-sm text-[#111827]" style={{ fontWeight: 600 }}>
                    {selectedSettlement.paidByName}
                  </p>
                </div>
                <div className="rounded-xl bg-[#F9FAFB] px-4 py-3">
                  <p className="text-xs uppercase text-[#9CA3AF]">Review Status</p>
                  <p className="mt-1 text-sm text-[#111827]" style={{ fontWeight: 600 }}>
                    {selectedSettlement.reviewStatus}
                  </p>
                </div>
                <div className="rounded-xl bg-[#F9FAFB] px-4 py-3">
                  <p className="text-xs uppercase text-[#9CA3AF]">Expense Date</p>
                  <p className="mt-1 text-sm text-[#111827]" style={{ fontWeight: 600 }}>
                    {formatDateTime(selectedSettlement.expenseDate)}
                  </p>
                </div>
                <div className="rounded-xl bg-[#F9FAFB] px-4 py-3">
                  <p className="text-xs uppercase text-[#9CA3AF]">Receipt Link</p>
                  <p
                    className="mt-1 break-all text-sm text-[#111827]"
                    style={{ fontWeight: 600 }}
                  >
                    {selectedSettlement.receiptId ?? "Not linked"}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                  Description
                </p>
                <p className="text-sm text-[#6B7280]">
                  {selectedSettlement.description || "No description provided."}
                </p>
              </div>

              <div>
                <p className="mb-3 text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                  Participants
                </p>
                <div className="space-y-3">
                  {selectedSettlement.participants.map((participant) => (
                    <div
                      key={`${selectedSettlement.id}-${participant.userId}`}
                      className="flex items-center justify-between gap-3 rounded-xl bg-[#F9FAFB] px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-[#111827]" style={{ fontWeight: 600 }}>
                          {participant.name}
                        </p>
                        <p className="truncate text-sm text-[#6B7280]">
                          {participant.email}
                        </p>
                      </div>
                      <span className="text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                        {formatCurrency(
                          participant.shareAmount,
                          selectedSettlement.currency,
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E7EB] px-4 py-4">
                <p className="mb-3 text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                  Settlement History
                </p>
                <div className="space-y-2 text-sm text-[#6B7280]">
                  <p>Note: {selectedSettlement.settlementNote ?? "No settlement note."}</p>
                  <p>
                    Settled at:{" "}
                    {selectedSettlement.settledAt
                      ? formatDateTime(selectedSettlement.settledAt)
                      : "Not settled yet"}
                  </p>
                  <p>
                    Settled by: {selectedSettlement.settledByName ?? "Not settled yet"}
                  </p>
                  <p>Last updated: {formatDateTime(selectedSettlement.updatedAt)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#6B7280]">Select a settlement to see details.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}