import { TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  getAdminSettlement,
  getAdminSettlements,
  type AdminSettlementDetail,
  type AdminSettlementRecord,
} from "../../../domains/admin-reporting";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { AdminSearchInput } from "../components/AdminSearchInput";
import {
  formatCurrency,
  formatDateTime,
  getSettlementStatusLabel,
} from "../lib/admin.utils";

export function AdminSettlementsPage() {
  const [errorMessage, setErrorMessage] = useState("");
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
        if (loadedSettlements.length > 0) {
          setSelectedSettlementId((currentSelectedSettlementId) =>
            currentSelectedSettlementId &&
            loadedSettlements.some(
              (currentSettlement) => currentSettlement.id === currentSelectedSettlementId,
            )
              ? currentSelectedSettlementId
              : loadedSettlements[0].id,
          );
        } else {
          setSelectedSettlementId(null);
          setSelectedSettlement(null);
        }
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

  return (
    <>
      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {errorMessage}
        </div>
      )}

      <AdminSearchInput
        placeholder="Search settlements..."
        value={search}
        onChange={setSearch}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "settled", label: "Settled" },
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            type="button"
            onClick={() =>
              setSettlementFilter(filterOption.key as "all" | "pending" | "settled")
            }
            className={`rounded-xl px-4 py-2 text-sm transition-all ${
              settlementFilter === filterOption.key
                ? "bg-[#16A34A] text-white shadow-sm"
                : "border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#111827]"
            }`}
            style={{ fontWeight: 600 }}
          >
            {filterOption.label}
          </button>
        ))}
      </div>

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
            <div key={item.label} className={`${item.bg} rounded-2xl border border-white p-5`}>
              <p className={`text-2xl ${item.valueClassName}`} style={{ fontWeight: 800 }}>
                {item.value}
              </p>
              <p className="mt-1 text-xs text-[#6B7280]">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
            {isLoadingSettlements ? (
              <div className="px-5 py-8 text-sm text-[#6B7280]">
                Loading settlements...
              </div>
            ) : filteredSettlements.length > 0 ? (
              <div className="divide-y divide-[#F3F4F6]">
                <div className="px-5 py-4">
                  <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                    Settlement Queue
                  </h3>
                  <p className="mt-1 text-sm text-[#6B7280]">
                    Review pending and settled expenses across all groups.
                  </p>
                </div>
                {filteredSettlements.map((settlement) => {
                  const isSelected = selectedSettlementId === settlement.id;
                  const statusClassName =
                    settlement.settlementStatus === "settled"
                      ? "bg-[#D1FAE5] text-[#065f46]"
                      : "bg-[#FEF3C7] text-[#92400e]";

                  return (
                    <button
                      key={settlement.id}
                      type="button"
                      onClick={() => setSelectedSettlementId(settlement.id)}
                      className={`w-full px-5 py-4 text-left transition-colors ${
                        isSelected ? "bg-[#F0FAF5]" : "hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                              {settlement.title}
                            </p>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs ${statusClassName}`}
                              style={{ fontWeight: 600 }}
                            >
                              {getSettlementStatusLabel(settlement.settlementStatus)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-[#6B7280]">
                            {settlement.groupName ?? "Unknown group"} / Paid by{" "}
                            {settlement.paidByName}
                          </p>
                          <p className="mt-2 text-xs text-[#9CA3AF]">
                            {settlement.participantCount} participants /{" "}
                            {formatCurrency(settlement.amount, settlement.currency)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs text-[#9CA3AF]">Expense date</p>
                          <p className="text-sm text-[#111827]" style={{ fontWeight: 600 }}>
                            {new Date(settlement.expenseDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <AdminEmptyState
                icon={TrendingUp}
                title={t.allClear}
                description={t.noSettlementsDesc}
              />
            )}
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
            <div className="mb-4">
              <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                Settlement Detail
              </h3>
              <p className="mt-1 text-sm text-[#6B7280]">
                Inspect allocation, notes, and settlement history.
              </p>
            </div>

            {isLoadingSettlementDetail ? (
              <p className="text-sm text-[#6B7280]">Loading settlement detail...</p>
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
          </div>
        </div>
      </div>
    </>
  );
}
