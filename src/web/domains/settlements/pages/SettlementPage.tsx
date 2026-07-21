import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, DollarSign, TrendingUp, Users } from "lucide-react";
import { useStoredUser } from "../../auth";
import { getGroups, type Group } from "../../groups";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import { useFeedback } from "../../../shared/providers/FeedbackProvider";
import { getExpenses, settleExpense, type Expense } from "../../expenses";
import {
  formatCurrency,
  formatCurrencyBreakdown,
  formatDate,
  formatDateTime,
  getCurrentUserShare,
  getNetPositionByCurrency,
  getOthersShare,
  getPendingExpenses,
  getRelevantExpenses,
  getSettledExpenses,
  getSettledThisMonthByCurrency,
  getYouAreOwedByCurrency,
  getYouOweByCurrency,
} from "../lib/settlement.utils";

function CurrencyBreakdownValue({ value }: { value: string }) {
  return value.split("\n").map((line) => (
    <span key={line} className="block">
      {line}
    </span>
  ));
}

export function SettlementPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [settlingExpenseId, setSettlingExpenseId] = useState<string | null>(null);
  const { t } = useLanguage();
  const { confirm, showToast } = useFeedback();
  const currentUser = useStoredUser();

  async function loadSettlementData() {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const [expensesResponse, groupsResponse] = await Promise.all([
        getExpenses(),
        getGroups(),
      ]);

      setExpenses(expensesResponse.expenses ?? []);
      setGroups(groupsResponse.groups ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load settlements.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSettlementData();
  }, []);

  const groupsById = useMemo(
    () => new Map(groups.map((group) => [group.id, group])),
    [groups],
  );

  const memberNameById = useMemo(() => {
    const memberMap = new Map<string, string>();

    groups.forEach((group) => {
      group.members.forEach((member) => {
        memberMap.set(member.id, member.name);
      });
    });

    return memberMap;
  }, [groups]);

  const relevantExpenses = useMemo(() => {
    return getRelevantExpenses(expenses, currentUser?.id);
  }, [currentUser?.id, expenses]);

  const pendingExpenses = useMemo(
    () => getPendingExpenses(relevantExpenses),
    [relevantExpenses],
  );

  const settledExpenses = useMemo(
    () => getSettledExpenses(relevantExpenses),
    [relevantExpenses],
  );

  const primaryCurrency =
    currentUser?.defaultCurrency ??
    relevantExpenses[0]?.currency ??
    expenses[0]?.currency ??
    "USD";

  const youAreOwedByCurrency = useMemo(() => {
    return getYouAreOwedByCurrency(pendingExpenses, currentUser?.id);
  }, [currentUser?.id, pendingExpenses]);

  const youOweByCurrency = useMemo(() => {
    return getYouOweByCurrency(pendingExpenses, currentUser?.id);
  }, [currentUser?.id, pendingExpenses]);

  const settledThisMonthByCurrency = useMemo(() => {
    return getSettledThisMonthByCurrency(settledExpenses, currentUser?.id);
  }, [currentUser?.id, settledExpenses]);

  const netPositionByCurrency = useMemo(() => {
    return getNetPositionByCurrency(youAreOwedByCurrency, youOweByCurrency);
  }, [youAreOwedByCurrency, youOweByCurrency]);

  const youAreOwedSummary = useMemo(
    () =>
      formatCurrencyBreakdown(youAreOwedByCurrency, {
        emptyCurrency: primaryCurrency,
      }),
    [primaryCurrency, youAreOwedByCurrency],
  );

  const youOweSummary = useMemo(
    () =>
      formatCurrencyBreakdown(youOweByCurrency, {
        emptyCurrency: primaryCurrency,
      }),
    [primaryCurrency, youOweByCurrency],
  );

  const settledThisMonthSummary = useMemo(
    () =>
      formatCurrencyBreakdown(settledThisMonthByCurrency, {
        emptyCurrency: primaryCurrency,
      }),
    [primaryCurrency, settledThisMonthByCurrency],
  );

  const netPositionSummary = useMemo(
    () =>
      formatCurrencyBreakdown(netPositionByCurrency, {
        signed: true,
        emptyCurrency: primaryCurrency,
      }),
    [netPositionByCurrency, primaryCurrency],
  );

  async function handleSettleExpense(expense: Expense) {
    const confirmed = await confirm({
      title: t.markAsPaid,
      message: `${t.markAsPaid} "${expense.title}"?`,
      cancelLabel: t.cancel,
      confirmLabel: t.settled,
    });

    if (!confirmed) {
      return;
    }

    try {
      setSettlingExpenseId(expense.id);
      const response = await settleExpense(expense.id);

      setExpenses((currentExpenses) =>
        currentExpenses.map((currentExpense) =>
          currentExpense.id === expense.id ? response.expense ?? currentExpense : currentExpense,
        ),
      );

      showToast({
        variant: "success",
        message: response.message,
      });
    } catch (error) {
      showToast({
        variant: "error",
        message:
          error instanceof Error ? error.message : "Unable to settle expense.",
      });
    } finally {
      setSettlingExpenseId(null);
    }
  }

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        <div className="mb-8">
          <h1
            className="text-[#111827]"
            style={{ fontSize: "1.5rem", fontWeight: 800 }}
          >
            {t.settlementsTitle}
          </h1>
          <p className="text-[#6B7280] text-sm mt-0.5">{t.settlementsDesc}</p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            {
              label: t.youAreOwedLabel,
              value: isLoading ? "--" : youAreOwedSummary,
              icon: TrendingUp,
              bg: "bg-[#F0FAF5]",
              iconBg: "bg-[#7EDDBA]",
            },
            {
              label: t.youOweLabel,
              value: isLoading ? "--" : youOweSummary,
              icon: DollarSign,
              bg: "bg-[#FEF2F2]",
              iconBg: "bg-[#FCA5A5]",
            },
            {
              label: t.settledThisMonth,
              value: isLoading ? "--" : settledThisMonthSummary,
              icon: CheckCircle2,
              bg: "bg-[#EFF6FF]",
              iconBg: "bg-[#93C5FD]",
            },
          ].map(({ label, value, icon: Icon, bg, iconBg }) => (
            <div key={label} className={`${bg} rounded-2xl p-5 border border-white`}>
              <div
                className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center mb-3`}
              >
                <Icon className="w-4 h-4 text-[#065f46]" />
              </div>
              <p
                className="text-[#111827] whitespace-pre-line"
                style={{ fontSize: "1.5rem", fontWeight: 800 }}
              >
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

              {isLoading ? (
                <div className="px-5 py-8 text-sm text-[#6B7280]">
                  {t.pendingSettlements}...
                </div>
              ) : pendingExpenses.length > 0 ? (
                <div className="divide-y divide-[#F3F4F6]">
                  {pendingExpenses.map((expense) => {
                    const groupName = groupsById.get(expense.groupId)?.name ?? "Unknown group";
                    const currentUserShare = getCurrentUserShare(expense, currentUser?.id);
                    const othersShare = getOthersShare(expense, currentUser?.id);
                    const isOwedToYou = expense.paidByUserId === currentUser?.id;
                    const counterpartyName = isOwedToYou
                      ? expense.participants.filter(
                          (participant) => participant.userId !== currentUser?.id,
                        ).length > 1
                        ? `${expense.participants.filter(
                            (participant) => participant.userId !== currentUser?.id,
                          ).length} members`
                        : memberNameById.get(
                            expense.participants.find(
                              (participant) => participant.userId !== currentUser?.id,
                            )?.userId ?? "",
                          ) ?? "Group member"
                      : memberNameById.get(expense.paidByUserId) ?? "Group member";

                    return (
                      <div
                        key={expense.id}
                        className="px-5 py-4 flex items-start justify-between gap-4"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                              {expense.title}
                            </p>
                            <span
                              className={`rounded-full px-2.5 py-1 text-xs ${
                                isOwedToYou
                                  ? "bg-[#D1FAE5] text-[#065f46]"
                                  : "bg-[#FEF3C7] text-[#92400e]"
                              }`}
                              style={{ fontWeight: 600 }}
                            >
                              {isOwedToYou ? t.youAreOwedLabel : t.youOweLabel}
                            </span>
                          </div>
                          <p className="text-sm text-[#6B7280]">
                            {groupName} |{" "}
                            {isOwedToYou
                              ? `Awaiting payment from ${counterpartyName}`
                              : `Payable to ${counterpartyName}`}
                          </p>
                          <p className="text-xs text-[#9CA3AF] mt-2">
                            {formatDate(expense.expenseDate)} | {expense.participants.length}{" "}
                            participants
                          </p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <p
                            className={
                              isOwedToYou ? "text-[#16A34A]" : "text-[#B45309]"
                            }
                            style={{ fontWeight: 800 }}
                          >
                            {formatCurrency(
                              isOwedToYou ? othersShare : currentUserShare,
                              expense.currency,
                            )}
                          </p>
                          {isOwedToYou && (
                            <button
                              type="button"
                              onClick={() => void handleSettleExpense(expense)}
                              disabled={settlingExpenseId === expense.id}
                              className="mt-3 rounded-xl bg-[#16A34A] px-3 py-2 text-xs text-white hover:bg-[#15803D] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                              style={{ fontWeight: 600 }}
                            >
                              {settlingExpenseId === expense.id
                                ? t.updating
                                : t.markAsPaid}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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

              {isLoading ? (
                <p className="text-[#9CA3AF] text-xs">Loading activity...</p>
              ) : settledExpenses.length > 0 ? (
                <div className="space-y-4">
                  {settledExpenses.slice(0, 5).map((expense) => (
                    <div
                      key={expense.id}
                      className="rounded-2xl bg-[#F9FAFB] px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                            {expense.title}
                          </p>
                          <p className="text-xs text-[#6B7280] mt-1">
                            {groupsById.get(expense.groupId)?.name ?? "Unknown group"}
                          </p>
                        </div>
                        <span
                          className="rounded-full bg-[#D1FAE5] px-2.5 py-1 text-xs text-[#065f46]"
                          style={{ fontWeight: 700 }}
                        >
                          {t.settled}
                        </span>
                      </div>
                      <p className="text-xs text-[#9CA3AF] mt-3">
                        {expense.settledBy
                          ? `Settled by ${
                              memberNameById.get(expense.settledBy) ?? "Unknown user"
                            }`
                          : "Settlement recorded"}
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        {formatDateTime(expense.settledAt ?? expense.updatedAt)}
                      </p>
                    </div>
                  ))}
                </div>
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
                {isLoading ? "--" : <CurrencyBreakdownValue value={netPositionSummary} />}
              </p>
              <p className="text-[#A7F3D0] text-xs">
                {relevantExpenses.length > 0
                  ? `${pendingExpenses.length} pending | ${settledExpenses.length} settled`
                  : t.addExpensesToSeeBalance}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
