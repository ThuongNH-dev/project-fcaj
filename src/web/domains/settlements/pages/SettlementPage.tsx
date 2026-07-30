import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, DollarSign, TrendingUp, Users } from "lucide-react";
import { useSearchParams } from "react-router";
import { useStoredUser } from "../../auth";
import { getExpenses, type Expense } from "../../expenses";
import { getGroups, type Group } from "../../groups";
import { AdminPagination } from "../../../app/admin/components/AdminPagination";
import { useFeedback } from "../../../shared/providers/FeedbackProvider";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import {
  formatCurrency,
  formatCurrencyBreakdown,
  formatDateTime,
  getNetPositionByCurrency,
} from "../lib/settlement.utils";
import {
  getMySettlements,
  markSettlementAsSent,
} from "../api/settlements.api";
import type {
  GetMySettlementsParams,
  Settlement,
  SettlementPagination,
} from "../models/settlements.types";

const PAGE_LIMIT = 10;
const SUMMARY_PAGE_LIMIT = 100;
const EMPTY_PAGINATION: SettlementPagination = {
  page: 1,
  limit: PAGE_LIMIT,
  total: 0,
  totalPages: 0,
};

type SummaryFilters = Omit<GetMySettlementsParams, "page" | "limit">;

async function getAllSettlements(filters: SummaryFilters) {
  const firstPage = await getMySettlements({
    ...filters,
    page: 1,
    limit: SUMMARY_PAGE_LIMIT,
  });
  const settlements = [...firstPage.settlements];

  for (let page = 2; page <= firstPage.pagination.totalPages; page += 1) {
    const response = await getMySettlements({
      ...filters,
      page,
      limit: SUMMARY_PAGE_LIMIT,
    });
    settlements.push(...response.settlements);
  }

  return settlements;
}

function sumSettlementsByCurrency(settlements: Settlement[]) {
  return settlements.reduce((totals, settlement) => {
    totals.set(
      settlement.currency,
      (totals.get(settlement.currency) ?? 0) + settlement.amount,
    );
    return totals;
  }, new Map<string, number>());
}

function isInCurrentMonth(value: string | null) {
  if (!value) {
    return false;
  }

  const date = new Date(value);
  const now = new Date();

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function CurrencyBreakdownValue({ value }: { value: string }) {
  return value.split("\n").map((line) => (
    <span key={line} className="block">
      {line}
    </span>
  ));
}

export function SettlementPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debtorSettlements, setDebtorSettlements] = useState<Settlement[]>([]);
  const [creditorSettlements, setCreditorSettlements] = useState<Settlement[]>([]);
  const [sentSettlements, setSentSettlements] = useState<Settlement[]>([]);
  const [summaryDebtorSettlements, setSummaryDebtorSettlements] = useState<Settlement[]>([]);
  const [summaryCreditorSettlements, setSummaryCreditorSettlements] = useState<Settlement[]>([]);
  const [summarySentSettlements, setSummarySentSettlements] = useState<Settlement[]>([]);
  const [debtorPagination, setDebtorPagination] = useState(EMPTY_PAGINATION);
  const [creditorPagination, setCreditorPagination] = useState(EMPTY_PAGINATION);
  const [sentPagination, setSentPagination] = useState(EMPTY_PAGINATION);
  const [debtorPage, setDebtorPage] = useState(1);
  const [creditorPage, setCreditorPage] = useState(1);
  const [sentPage, setSentPage] = useState(1);
  const [isLoadingDebtor, setIsLoadingDebtor] = useState(true);
  const [isLoadingCreditor, setIsLoadingCreditor] = useState(true);
  const [isLoadingSent, setIsLoadingSent] = useState(true);
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [debtorErrorMessage, setDebtorErrorMessage] = useState("");
  const [creditorErrorMessage, setCreditorErrorMessage] = useState("");
  const [sentErrorMessage, setSentErrorMessage] = useState("");
  const [sendingSettlementId, setSendingSettlementId] = useState<string | null>(null);
  const [focusedSettlement, setFocusedSettlement] = useState<Settlement | null>(null);
  const [isLoadingFocusedSettlement, setIsLoadingFocusedSettlement] = useState(false);
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { confirm, showToast } = useFeedback();
  const currentUser = useStoredUser();
  const focusedSettlementId = searchParams.get("settlementId");
  const focusedExpenseId = searchParams.get("expenseId");

  useEffect(() => {
    let isActive = true;

    void Promise.allSettled([getExpenses(), getGroups()]).then(
      ([expensesResult, groupsResult]) => {
        if (!isActive) {
          return;
        }

        if (expensesResult.status === "fulfilled") {
          setExpenses(expensesResult.value.expenses ?? []);
        }
        if (groupsResult.status === "fulfilled") {
          setGroups(groupsResult.value.groups ?? []);
        }
      },
    );

    return () => {
      isActive = false;
    };
  }, []);

  const loadDebtorSettlements = useCallback(async () => {
    try {
      setIsLoadingDebtor(true);
      setDebtorErrorMessage("");
      const response = await getMySettlements({
        page: debtorPage,
        limit: PAGE_LIMIT,
        role: "debtor",
        status: "pending",
      });

      if (
        response.pagination.totalPages > 0 &&
        debtorPage > response.pagination.totalPages
      ) {
        setDebtorPage(response.pagination.totalPages);
        return;
      }

      setDebtorSettlements(response.settlements);
      setDebtorPagination(response.pagination);
    } catch (error) {
      setDebtorErrorMessage(
        error instanceof Error ? error.message : t.unableLoadSettlements,
      );
    } finally {
      setIsLoadingDebtor(false);
    }
  }, [debtorPage, t.unableLoadSettlements]);

  const loadCreditorSettlements = useCallback(async () => {
    try {
      setIsLoadingCreditor(true);
      setCreditorErrorMessage("");
      const response = await getMySettlements({
        page: creditorPage,
        limit: PAGE_LIMIT,
        role: "creditor",
        status: "pending",
      });

      if (
        response.pagination.totalPages > 0 &&
        creditorPage > response.pagination.totalPages
      ) {
        setCreditorPage(response.pagination.totalPages);
        return;
      }

      setCreditorSettlements(response.settlements);
      setCreditorPagination(response.pagination);
    } catch (error) {
      setCreditorErrorMessage(
        error instanceof Error ? error.message : t.unableLoadSettlements,
      );
    } finally {
      setIsLoadingCreditor(false);
    }
  }, [creditorPage, t.unableLoadSettlements]);

  const loadSentSettlements = useCallback(async () => {
    try {
      setIsLoadingSent(true);
      setSentErrorMessage("");
      const response = await getMySettlements({
        page: sentPage,
        limit: PAGE_LIMIT,
        status: "sent",
      });

      if (
        response.pagination.totalPages > 0 &&
        sentPage > response.pagination.totalPages
      ) {
        setSentPage(response.pagination.totalPages);
        return;
      }

      setSentSettlements(response.settlements);
      setSentPagination(response.pagination);
    } catch (error) {
      setSentErrorMessage(
        error instanceof Error ? error.message : t.unableLoadSettlements,
      );
    } finally {
      setIsLoadingSent(false);
    }
  }, [sentPage, t.unableLoadSettlements]);

  const loadSettlementSummaries = useCallback(async () => {
    try {
      setIsLoadingSummary(true);
      const [debtorItems, creditorItems, sentItems] = await Promise.all([
        getAllSettlements({ role: "debtor", status: "pending" }),
        getAllSettlements({ role: "creditor", status: "pending" }),
        getAllSettlements({ status: "sent" }),
      ]);

      setSummaryDebtorSettlements(debtorItems);
      setSummaryCreditorSettlements(creditorItems);
      setSummarySentSettlements(sentItems);
    } catch {
      // The paged lists remain usable if optional summary aggregation fails.
    } finally {
      setIsLoadingSummary(false);
    }
  }, []);

  useEffect(() => {
    void loadDebtorSettlements();
  }, [loadDebtorSettlements]);

  useEffect(() => {
    void loadCreditorSettlements();
  }, [loadCreditorSettlements]);

  useEffect(() => {
    void loadSentSettlements();
  }, [loadSentSettlements]);

  useEffect(() => {
    void loadSettlementSummaries();
  }, [loadSettlementSummaries]);

  useEffect(() => {
    let isActive = true;

    if (!focusedSettlementId || !focusedExpenseId) {
      setFocusedSettlement(null);
      setIsLoadingFocusedSettlement(false);
      return () => {
        isActive = false;
      };
    }

    setIsLoadingFocusedSettlement(true);
    void getMySettlements({
      page: 1,
      limit: SUMMARY_PAGE_LIMIT,
      expenseId: focusedExpenseId,
    })
      .then((response) => {
        if (!isActive) {
          return;
        }

        setFocusedSettlement(
          response.settlements.find(
            (settlement) => settlement.id === focusedSettlementId,
          ) ?? null,
        );
      })
      .catch(() => {
        if (isActive) {
          setFocusedSettlement(null);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoadingFocusedSettlement(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [focusedExpenseId, focusedSettlementId]);

  const groupsById = useMemo(
    () => new Map(groups.map((group) => [group.id, group])),
    [groups],
  );
  const expensesById = useMemo(
    () => new Map(expenses.map((expense) => [expense.id, expense])),
    [expenses],
  );
  const memberNameById = useMemo(() => {
    const names = new Map<string, string>();

    groups.forEach((group) => {
      group.members.forEach((member) => names.set(member.id, member.name));
    });

    return names;
  }, [groups]);

  const primaryCurrency =
    currentUser?.defaultCurrency ??
    summaryDebtorSettlements[0]?.currency ??
    summaryCreditorSettlements[0]?.currency ??
    "USD";
  const youOweByCurrency = useMemo(
    () => sumSettlementsByCurrency(summaryDebtorSettlements),
    [summaryDebtorSettlements],
  );
  const youAreOwedByCurrency = useMemo(
    () => sumSettlementsByCurrency(summaryCreditorSettlements),
    [summaryCreditorSettlements],
  );
  const sentThisMonthByCurrency = useMemo(
    () =>
      sumSettlementsByCurrency(
        summarySentSettlements.filter((settlement) =>
          isInCurrentMonth(settlement.sentAt),
        ),
      ),
    [summarySentSettlements],
  );
  const netPositionByCurrency = useMemo(
    () => getNetPositionByCurrency(youAreOwedByCurrency, youOweByCurrency),
    [youAreOwedByCurrency, youOweByCurrency],
  );
  const youAreOwedSummary = formatCurrencyBreakdown(youAreOwedByCurrency, {
    emptyCurrency: primaryCurrency,
  });
  const youOweSummary = formatCurrencyBreakdown(youOweByCurrency, {
    emptyCurrency: primaryCurrency,
  });
  const settledThisMonthSummary = formatCurrencyBreakdown(
    sentThisMonthByCurrency,
    { emptyCurrency: primaryCurrency },
  );
  const netPositionSummary = formatCurrencyBreakdown(netPositionByCurrency, {
    signed: true,
    emptyCurrency: primaryCurrency,
  });
  const errorMessages = Array.from(
    new Set(
      [debtorErrorMessage, creditorErrorMessage, sentErrorMessage].filter(Boolean),
    ),
  );
  const isFocusedSettlementInCurrentLists = Boolean(
    focusedSettlementId &&
      [...debtorSettlements, ...creditorSettlements, ...sentSettlements].some(
        (settlement) => settlement.id === focusedSettlementId,
      ),
  );

  useEffect(() => {
    if (!focusedSettlementId) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const target = Array.from(
        document.querySelectorAll<HTMLElement>("[data-settlement-id]"),
      ).find(
        (element) => element.dataset.settlementId === focusedSettlementId,
      );

      target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [
    creditorSettlements,
    debtorSettlements,
    focusedSettlement,
    focusedSettlementId,
    sentSettlements,
  ]);

  function getSettlementTitle(settlement: Settlement) {
    return (
      expensesById.get(settlement.expenseId)?.title ??
      `${t.settlementsTitle} #${settlement.id.slice(-6)}`
    );
  }

  async function handleMarkAsSent(settlement: Settlement) {
    const group = groupsById.get(settlement.groupId);

    if (group?.isBanned) {
      showToast({
        variant: "error",
        message: "This group has been banned. You can only view old data.",
      });
      return;
    }

    const confirmed = await confirm({
      title: t.markAsSent,
      message: `${t.markAsSent} "${getSettlementTitle(settlement)}"?`,
      cancelLabel: t.cancel,
      confirmLabel: t.markAsSent,
    });

    if (!confirmed) {
      return;
    }

    try {
      setSendingSettlementId(settlement.id);
      const response = await markSettlementAsSent(settlement.id);

      await Promise.all([
        loadDebtorSettlements(),
        loadSentSettlements(),
        loadSettlementSummaries(),
      ]);

      showToast({ variant: "success", message: response.message });
    } catch (error) {
      showToast({
        variant: "error",
        message:
          error instanceof Error ? error.message : t.unableMarkSettlementSent,
      });
    } finally {
      setSendingSettlementId(null);
    }
  }

  function renderPendingSettlements(settlements: Settlement[]) {
    return settlements.map((settlement) => {
      const isDebtor = settlement.debtorUserId === currentUser?.id;
      const isCreditor = settlement.creditorUserId === currentUser?.id;
      const counterpartyId = isDebtor
        ? settlement.creditorUserId
        : settlement.debtorUserId;
      const group = groupsById.get(settlement.groupId);
      const expense = expensesById.get(settlement.expenseId);
      const isSending = sendingSettlementId === settlement.id;

      return (
        <div
          key={settlement.id}
          data-settlement-id={settlement.id}
          className={`px-5 py-4 flex items-start justify-between gap-4 ${
            settlement.id === focusedSettlementId
              ? "bg-[#ECFDF5] ring-2 ring-inset ring-[#16A34A]"
              : ""
          }`}
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                {getSettlementTitle(settlement)}
              </p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs ${
                  isDebtor
                    ? "bg-[#FEF3C7] text-[#92400e]"
                    : "bg-[#D1FAE5] text-[#065f46]"
                }`}
                style={{ fontWeight: 600 }}
              >
                {isDebtor ? t.youOweLabel : t.youAreOwedLabel}
              </span>
            </div>
            <p className="text-sm text-[#6B7280]">
              {group?.name ?? "Unknown group"} | {isDebtor ? "Payable to" : "Awaiting payment from"}{" "}
              {memberNameById.get(counterpartyId) ?? "Group member"}
            </p>
            <p className="text-xs text-[#9CA3AF] mt-2">
              {formatDateTime(expense?.expenseDate ?? settlement.createdAt)}
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <p
              className={isDebtor ? "text-[#B45309]" : "text-[#16A34A]"}
              style={{ fontWeight: 800 }}
            >
              {formatCurrency(settlement.amount, settlement.currency)}
            </p>
            {isCreditor && settlement.status === "pending" ? (
              <button
                type="button"
                onClick={() => void handleMarkAsSent(settlement)}
                disabled={isSending || group?.isBanned === true}
                className={`mt-3 rounded-xl px-3 py-2 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                  group?.isBanned
                    ? "bg-[#D1D5DB] text-[#6B7280]"
                    : "bg-[#16A34A] text-white hover:bg-[#15803D]"
                }`}
                style={{ fontWeight: 600 }}
              >
                {isSending ? t.updating : t.markAsPaid}
              </button>
            ) : null}
          </div>
        </div>
      );
    });
  }

  const pendingIsLoading = isLoadingDebtor || isLoadingCreditor;
  const hasPendingSettlements =
    debtorSettlements.length > 0 || creditorSettlements.length > 0;

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-[#111827]" style={{ fontSize: "1.5rem", fontWeight: 800 }}>
            {t.settlementsTitle}
          </h1>
          <p className="text-[#6B7280] text-sm mt-0.5">{t.settlementsDesc}</p>
        </div>

        {errorMessages.map((message) => (
          <div
            key={message}
            className="mb-4 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]"
          >
            {message}
          </div>
        ))}

        {focusedSettlementId && focusedExpenseId && !isFocusedSettlementInCurrentLists ? (
          <section
            aria-label={t.selectedSettlement}
            className="mb-6 overflow-hidden rounded-2xl border border-[#86EFAC] bg-white shadow-sm"
          >
            <div className="border-b border-[#D1FAE5] bg-[#ECFDF5] px-5 py-3">
              <h2 className="text-sm font-bold text-[#065F46]">
                {t.selectedSettlement}
              </h2>
            </div>
            {isLoadingFocusedSettlement ? (
              <p className="px-5 py-5 text-sm text-[#6B7280]">
                {t.loadingSettlementActivity}
              </p>
            ) : focusedSettlement ? (
              renderPendingSettlements([focusedSettlement])
            ) : (
              <p className="px-5 py-5 text-sm text-[#6B7280]">
                {t.settlementNotFound}
              </p>
            )}
          </section>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: t.youAreOwedLabel,
              value: isLoadingSummary ? "--" : youAreOwedSummary,
              icon: TrendingUp,
              bg: "bg-[#F0FAF5]",
              iconBg: "bg-[#7EDDBA]",
            },
            {
              label: t.youOweLabel,
              value: isLoadingSummary ? "--" : youOweSummary,
              icon: DollarSign,
              bg: "bg-[#FEF2F2]",
              iconBg: "bg-[#FCA5A5]",
            },
            {
              label: t.settledThisMonth,
              value: isLoadingSummary ? "--" : settledThisMonthSummary,
              icon: CheckCircle2,
              bg: "bg-[#EFF6FF]",
              iconBg: "bg-[#93C5FD]",
            },
          ].map(({ label, value, icon: Icon, bg, iconBg }) => (
            <div key={label} className={`${bg} rounded-2xl p-5 border border-white`}>
              <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4 text-[#065f46]" />
              </div>
              <p className="text-[#111827] whitespace-pre-line" style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                <CurrencyBreakdownValue value={value} />
              </p>
              <p className="text-[#6B7280] text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F3F4F6]">
                <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                  {t.pendingSettlements}
                </h3>
              </div>

              {pendingIsLoading ? (
                <div className="px-5 py-8 text-sm text-[#6B7280]">{t.pendingSettlements}...</div>
              ) : hasPendingSettlements ? (
                <>
                  {debtorSettlements.length > 0 ? (
                    <section aria-label={t.youOweLabel}>
                      <div className="bg-[#FFFBEB] px-5 py-2 text-xs font-bold text-[#92400E]">
                        {t.youOweLabel}
                      </div>
                      <div className="divide-y divide-[#F3F4F6]">
                        {renderPendingSettlements(debtorSettlements)}
                      </div>
                      <AdminPagination
                        page={debtorPagination.page}
                        totalPages={debtorPagination.totalPages}
                        onPageChange={setDebtorPage}
                      />
                    </section>
                  ) : null}

                  {creditorSettlements.length > 0 ? (
                    <section aria-label={t.youAreOwedLabel}>
                      <div className="bg-[#F0FAF5] px-5 py-2 text-xs font-bold text-[#065F46]">
                        {t.youAreOwedLabel}
                      </div>
                      <div className="divide-y divide-[#F3F4F6]">
                        {renderPendingSettlements(creditorSettlements)}
                      </div>
                      <AdminPagination
                        page={creditorPagination.page}
                        totalPages={creditorPagination.totalPages}
                        onPageChange={setCreditorPage}
                      />
                    </section>
                  ) : null}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                  <div className="w-16 h-16 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-[#7EDDBA]" />
                  </div>
                  <h3 className="text-[#111827] mb-1" style={{ fontWeight: 700 }}>
                    {t.allClear}
                  </h3>
                  <p className="text-[#6B7280] text-sm">{t.noSettlementsDesc}</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB]">
              <h3 className="text-[#111827] mb-4" style={{ fontWeight: 700 }}>
                {t.settlementTimeline}
              </h3>

              {isLoadingSent ? (
                <p className="text-[#9CA3AF] text-xs">{t.loadingSettlementActivity}</p>
              ) : sentSettlements.length > 0 ? (
                <>
                  <div className="space-y-4">
                    {sentSettlements.map((settlement) => {
                      const isDebtor = settlement.debtorUserId === currentUser?.id;
                      return (
                        <div
                          key={settlement.id}
                          data-settlement-id={settlement.id}
                          className={`rounded-2xl px-4 py-3 ${
                            settlement.id === focusedSettlementId
                              ? "bg-[#ECFDF5] ring-2 ring-[#16A34A]"
                              : "bg-[#F9FAFB]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                                {getSettlementTitle(settlement)}
                              </p>
                              <p className="text-xs text-[#6B7280] mt-1">
                                {groupsById.get(settlement.groupId)?.name ?? "Unknown group"}
                              </p>
                            </div>
                            <span
                              className="rounded-full bg-[#D1FAE5] px-2.5 py-1 text-xs text-[#065f46]"
                              style={{ fontWeight: 700 }}
                            >
                              {t.sentLabel}
                            </span>
                          </div>
                          <p className="text-sm text-[#111827] mt-3" style={{ fontWeight: 700 }}>
                            {formatCurrency(settlement.amount, settlement.currency)}
                          </p>
                          <p className="text-xs text-[#9CA3AF] mt-1">
                            {isDebtor ? t.youOweLabel : t.youAreOwedLabel} |{" "}
                            {formatDateTime(settlement.sentAt ?? settlement.updatedAt)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <AdminPagination
                    page={sentPagination.page}
                    totalPages={sentPagination.totalPages}
                    onPageChange={setSentPage}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-10 h-10 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <Users className="w-5 h-5 text-[#7EDDBA]" />
                  </div>
                  <p className="text-[#9CA3AF] text-xs">{t.noActivityLogged}</p>
                </div>
              )}
            </div>

            <div className="bg-[#16A34A] rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#A7F3D0]" />
                <span className="text-[#A7F3D0] text-sm" style={{ fontWeight: 600 }}>
                  {t.netPosition}
                </span>
              </div>
              <p
                className="text-white mb-1 whitespace-pre-line"
                style={{ fontSize: "1.75rem", fontWeight: 800 }}
              >
                {isLoadingSummary ? "--" : <CurrencyBreakdownValue value={netPositionSummary} />}
              </p>
              <p className="text-[#A7F3D0] text-xs">
                {debtorPagination.total + creditorPagination.total > 0 || sentPagination.total > 0
                  ? `${debtorPagination.total + creditorPagination.total} pending | ${sentPagination.total} sent`
                  : t.addExpensesToSeeBalance}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
