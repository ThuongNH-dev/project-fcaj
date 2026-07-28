import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Bell,
  Search,
  Plus,
  ArrowUpRight,
  ArrowRight,
  ChevronRight,
  Settings as SettingsIcon,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import {
  formatCurrency,
  formatLocalDate,
  toTitleCase,
} from "../../../shared/lib/formatters";
import { getUserInitials, useStoredUser } from "../../../domains/auth";
import { getExpenses, type Expense } from "../../../domains/expenses";
import { getGroups, type Group } from "../../../domains/groups";
import { formatCurrencyBreakdown } from "../../../domains/settlements/lib/settlement.utils";

const CATEGORY_DOT_COLORS = [
  "#16A34A",
  "#3B82F6",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
  "#06B6D4",
  "#EF4444",
];

function addCurrencyAmount(totals: Map<string, number>, currency: string, amount: number) {
  totals.set(currency, Number(((totals.get(currency) ?? 0) + amount).toFixed(2)));
}

function CurrencyBreakdownValue({ value }: { value: string }) {
  return value.split("\n").map((line) => (
    <span key={line} className="block">
      {line}
    </span>
  ));
}

function SkeletonRow({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-[#F3F4F6] ${className}`}
    />
  );
}

function getGreeting(lang: string): string {
  const hour = new Date().getHours();

  if (lang === "vi") {
    if (hour < 12) return "Ch\u00e0o bu\u1ed5i s\u00e1ng";
    if (hour < 18) return "Ch\u00e0o bu\u1ed5i chi\u1ec1u";
    return "Ch\u00e0o bu\u1ed5i t\u1ed1i";
  }

  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function DashboardPage() {
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { t, lang } = useLanguage();
  const user = useStoredUser();
  const navigate = useNavigate();

  const userName = user ? `${user.firstName} ${user.lastName}` : "Guest";
  const userInitials = user ? getUserInitials(user) : "GU";
  const welcomeMessage = user ? `Signed in as ${userName}` : t.welcomeMsg;
  const isAdminUser = user?.role === "admin";
  const greeting = getGreeting(lang);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setErrorMessage("");
        setIsLoadingGroups(true);
        setIsLoadingExpenses(true);

        const [groupsResponse, expensesResponse] = await Promise.all([
          getGroups(),
          getExpenses(),
        ]);

        setGroups(groupsResponse.groups ?? []);
        setExpenses(expensesResponse.expenses ?? []);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load dashboard.",
        );
      } finally {
        setIsLoadingGroups(false);
        setIsLoadingExpenses(false);
      }
    }

    void loadDashboardData();
  }, []);

  const filteredGroups = groups.filter((group) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      group.name.toLowerCase().includes(keyword) ||
      group.members.some((member) => member.name.toLowerCase().includes(keyword))
    );
  });

  const currency = user?.defaultCurrency ?? expenses[0]?.currency ?? "VND";
  const totalExpensesByCurrency = expenses.reduce((totals, expense) => {
    addCurrencyAmount(totals, expense.currency, expense.amount);
    return totals;
  }, new Map<string, number>());
  const youOweByCurrency = expenses
    .filter(
      (expense) =>
        expense.settlementStatus === "pending" &&
        expense.paidByUserId !== user?.id,
    )
    .reduce((totals, expense) => {
      const currentUserShare =
        expense.participants.find((participant) => participant.userId === user?.id)
          ?.shareAmount ?? 0;
      addCurrencyAmount(totals, expense.currency, currentUserShare);
      return totals;
    }, new Map<string, number>());
  const youAreOwedByCurrency = expenses
    .filter(
      (expense) =>
        expense.settlementStatus === "pending" &&
        expense.paidByUserId === user?.id,
    )
    .reduce((totals, expense) => {
      const owedByOthers = expense.participants
        .filter((participant) => participant.userId !== user?.id)
        .reduce(
          (participantSum, participant) =>
            participantSum + participant.shareAmount,
          0,
        );
      addCurrencyAmount(totals, expense.currency, owedByOthers);
      return totals;
    }, new Map<string, number>());
  const memberNameByUserId = new Map<string, string>();

  groups.forEach((group) => {
    group.members.forEach((member) => {
      memberNameByUserId.set(member.id, member.name);
    });
  });

  const debtNetByKey = new Map<
    string,
    { userId: string; currency: string; net: number }
  >();

  expenses
    .filter((expense) => expense.settlementStatus === "pending")
    .forEach((expense) => {
      if (expense.paidByUserId === user?.id) {
        expense.participants
          .filter((participant) => participant.userId !== user?.id)
          .forEach((participant) => {
            const key = `${participant.userId}-${expense.currency}`;
            const entry = debtNetByKey.get(key) ?? {
              userId: participant.userId,
              currency: expense.currency,
              net: 0,
            };

            entry.net += participant.shareAmount;
            debtNetByKey.set(key, entry);
          });

        return;
      }

      const myShare =
        expense.participants.find((participant) => participant.userId === user?.id)
          ?.shareAmount ?? 0;

      if (myShare > 0) {
        const key = `${expense.paidByUserId}-${expense.currency}`;
        const entry = debtNetByKey.get(key) ?? {
          userId: expense.paidByUserId,
          currency: expense.currency,
          net: 0,
        };

        entry.net -= myShare;
        debtNetByKey.set(key, entry);
      }
    });

  const quickDebts = Array.from(debtNetByKey.values())
    .filter((entry) => Math.abs(entry.net) > 0.004)
    .map((entry) => ({
      ...entry,
      name: memberNameByUserId.get(entry.userId) ?? t.unknownMember,
    }))
    .sort((left, right) => Math.abs(right.net) - Math.abs(left.net));
  const currentMonthExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.expenseDate);
    const today = new Date();

    return (
      expenseDate.getFullYear() === today.getFullYear() &&
      expenseDate.getMonth() === today.getMonth()
    );
  });
  const categorySummaries = Array.from(
    currentMonthExpenses.reduce((categoryMap, expense) => {
      const categoryKey = expense.category || "other";
      const amountByCurrency = categoryMap.get(categoryKey) ?? new Map<string, number>();
      addCurrencyAmount(amountByCurrency, expense.currency, expense.amount);
      categoryMap.set(categoryKey, amountByCurrency);
      return categoryMap;
    }, new Map<string, Map<string, number>>()),
    ([category, amounts]) => ({
      category,
      label:
        t.categories[category as keyof typeof t.categories] ??
        toTitleCase(category),
      amounts,
      sortValue: Array.from(amounts.values()).reduce((sum, amount) => sum + amount, 0),
    }),
  ).sort((leftCategory, rightCategory) => rightCategory.sortValue - leftCategory.sortValue);
  const totalCategoryAmount = categorySummaries.reduce(
    (sum, categorySummary) => sum + categorySummary.sortValue,
    0,
  );

  const summaryCards = [
    {
      label: t.totalExpenses,
      value: isLoadingExpenses
        ? "--"
        : formatCurrencyBreakdown(totalExpensesByCurrency, { emptyCurrency: currency }),
      icon: DollarSign,
      bg: "bg-[#E6F7ED]",
      iconBg: "bg-[#7EDDBA]",
      iconColor: "text-[#065f46]",
    },
    {
      label: t.youOwe,
      value: isLoadingExpenses
        ? "--"
        : formatCurrencyBreakdown(youOweByCurrency, { emptyCurrency: currency }),
      icon: TrendingDown,
      bg: "bg-[#FEF2F2]",
      iconBg: "bg-[#FCA5A5]",
      iconColor: "text-[#991b1b]",
    },
    {
      label: t.youAreOwed,
      value: isLoadingExpenses
        ? "--"
        : formatCurrencyBreakdown(youAreOwedByCurrency, { emptyCurrency: currency }),
      icon: TrendingUp,
      bg: "bg-[#EFF6FF]",
      iconBg: "bg-[#93C5FD]",
      iconColor: "text-[#1e40af]",
    },
    {
      label: t.activeGroups,
      value: isLoadingGroups ? "--" : String(groups.length),
      icon: Users,
      bg: "bg-[#FEFCE8]",
      iconBg: "bg-[#FCD34D]",
      iconColor: "text-[#92400e]",
    },
  ];

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        <div className="relative overflow-hidden rounded-3xl border border-[#E5E7EB] bg-gradient-to-br from-white via-white to-[#EAFBF3] px-6 py-6 sm:px-8 sm:py-7 mb-8">
          <div
            className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[#7EDDBA]/25 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#BBF7D0] bg-white/90 pl-2 pr-3.5 py-1.5 shadow-sm mb-3">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#7EDDBA] to-[#16A34A] flex-shrink-0">
                  <Sparkles className="w-3 h-3 text-white" />
                </span>
                <span
                  className="text-[#15803D]"
                  style={{ fontSize: "0.8125rem", fontWeight: 700, letterSpacing: "0.01em" }}
                >
                  {greeting}{user ? `, ${user.firstName}` : ""}
                </span>
              </div>
              <h1
                className="text-[#111827]"
                style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}
              >
                {t.dashboard}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <p className="text-[#6B7280] text-sm">{welcomeMessage}</p>
                {isAdminUser ? (
                  <span
                    className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#92400E]"
                    style={{ fontWeight: 700 }}
                  >
                    admin
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!isAdminUser ? (
                <>
                  <div className="relative hidden sm:block">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                    <input
                      type="text"
                      placeholder={t.searchGroups}
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="bg-white border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent transition-shadow w-56"
                    />
                  </div>
                  <button
                    onClick={() => navigate("/groups")}
                    className="hidden sm:flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-4 py-2.5 text-sm text-white hover:bg-[#15803D] active:scale-[0.98] transition-all shadow-sm"
                    style={{ fontWeight: 600 }}
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t.newGroup}</span>
                  </button>
                </>
              ) : null}
              <button
                className="relative w-9 h-9 bg-white rounded-xl border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F0FAF5] hover:border-[#BBF7D0] transition-colors flex-shrink-0"
                title={t.notifications}
              >
                <Bell className="w-4 h-4 text-[#6B7280]" />
              </button>
              <button
                onClick={() => navigate("/settings")}
                className="w-9 h-9 rounded-xl bg-[#7EDDBA] flex items-center justify-center text-[#065f46] text-xs overflow-hidden flex-shrink-0 hover:brightness-95 transition-all ring-2 ring-transparent hover:ring-[#BBF7D0]"
                style={{ fontWeight: 700 }}
                title={userName}
              >
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  userInitials
                )}
              </button>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4 text-sm text-[#B91C1C] mb-6">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summaryCards.map(({ label, value, icon: Icon, bg, iconBg, iconColor }) => (
            <div
              key={label}
              className={`${bg} rounded-2xl p-5 border border-[#FFFFFF] shadow-[0_1px_2px_rgba(17,24,39,0.06)] transition-all duration-200 hover:shadow-[0_8px_20px_rgba(17,24,39,0.08)] hover:-translate-y-0.5`}
            >
              <div
                className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center mb-3 shadow-sm`}
              >
                <Icon className={`w-[18px] h-[18px] ${iconColor}`} strokeWidth={2.25} />
              </div>
              <p
                className="text-[#111827] whitespace-pre-line"
                style={{ fontSize: "1.625rem", fontWeight: 800, letterSpacing: "-0.02em" }}
              >
                <CurrencyBreakdownValue value={value} />
              </p>
              <p className="text-[#4B5563] text-xs mt-1" style={{ fontWeight: 600 }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E5E7EB]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-[#111827] mb-1" style={{ fontWeight: 700 }}>
                  {t.groupsTitle}
                </h3>
                <p className="text-[#9CA3AF] text-xs">{t.monthlyOverview}</p>
              </div>
              {!isLoadingGroups && filteredGroups.length > 0 ? (
                <button
                  onClick={() => navigate("/groups")}
                  className="hidden sm:flex items-center gap-1 text-xs text-[#16A34A] hover:gap-1.5 transition-all flex-shrink-0"
                  style={{ fontWeight: 600 }}
                >
                  <span>{t.viewExpenses}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>
            {isLoadingGroups ? (
              <div className="space-y-3">
                <SkeletonRow className="h-16" />
                <SkeletonRow className="h-16" />
                <SkeletonRow className="h-16" />
              </div>
            ) : filteredGroups.length > 0 ? (
              <div className="space-y-3">
                {filteredGroups.slice(0, 4).map((group) => (
                  <button
                    key={group.id}
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-left hover:bg-[#F0FAF5] hover:border-[#BBF7D0] transition-all group"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm"
                          style={{ background: group.color }}
                        >
                          {group.icon}
                        </div>
                        <div className="min-w-0">
                          <p
                            className="text-[#111827] truncate"
                            style={{ fontWeight: 700 }}
                          >
                            {group.name}
                          </p>
                          <p className="text-xs text-[#9CA3AF]">
                            {group.members.length} {t.members}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#16A34A] group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => navigate("/groups")}
                  className="sm:hidden text-sm text-[#16A34A] hover:underline"
                  style={{ fontWeight: 600 }}
                >
                  {t.viewExpenses}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-12 h-12 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ArrowUpRight className="w-6 h-6 text-[#7EDDBA]" />
                </div>
                <p className="text-[#374151] text-sm" style={{ fontWeight: 600 }}>
                  {t.noGroupsYet}
                </p>
                <p className="text-[#9CA3AF] text-xs mt-1 mb-4">{t.noGroupsDesc}</p>
                <button
                  onClick={() => navigate("/groups")}
                  className="flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-4 py-2 text-xs text-white hover:bg-[#15803D] transition-colors"
                  style={{ fontWeight: 600 }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.newGroup}</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
            <h3 className="text-[#111827] mb-1" style={{ fontWeight: 700 }}>
              {t.byCategory}
            </h3>
            <p className="text-[#9CA3AF] text-xs mb-4">{t.thisMonth}</p>
            {isLoadingExpenses ? (
              <div className="space-y-4">
                <SkeletonRow className="h-8" />
                <SkeletonRow className="h-8" />
                <SkeletonRow className="h-8" />
              </div>
            ) : categorySummaries.length > 0 ? (
              <div className="space-y-4">
                {categorySummaries.slice(0, 5).map((categorySummary, index) => {
                  const percent =
                    categorySummary.sortValue > 0
                      ? Math.round(
                            (categorySummary.sortValue / totalCategoryAmount) * 100,
                          )
                        : 0;
                  const dotColor =
                    CATEGORY_DOT_COLORS[index % CATEGORY_DOT_COLORS.length];

                  return (
                    <div key={categorySummary.category}>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: dotColor }}
                          />
                          <span
                            className="text-sm text-[#111827] truncate"
                            style={{ fontWeight: 600 }}
                          >
                            {categorySummary.label}
                          </span>
                        </span>
                        <span className="text-xs text-[#6B7280] flex-shrink-0 whitespace-pre-line text-right">
                          {formatCurrencyBreakdown(categorySummary.amounts, {
                            emptyCurrency: currency,
                          })}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%`, backgroundColor: dotColor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-36 text-center">
                <div className="w-10 h-10 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-5 h-5 text-[#7EDDBA]" />
                </div>
                <p className="text-[#9CA3AF] text-xs">{t.noCategoryData}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-[#E5E7EB]">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                {t.recentActivity}
              </h3>
              {!isLoadingGroups && filteredGroups.length > 0 ? (
                <button
                  onClick={() => navigate("/groups")}
                  className="flex items-center gap-1 text-xs text-[#16A34A] hover:gap-1.5 transition-all"
                  style={{ fontWeight: 600 }}
                >
                  <span>{t.viewAll}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>
            {isLoadingGroups ? (
              <div className="space-y-3">
                <SkeletonRow className="h-14" />
                <SkeletonRow className="h-14" />
                <SkeletonRow className="h-14" />
              </div>
            ) : filteredGroups.length > 0 ? (
              <div className="space-y-3">
                {filteredGroups.slice(0, 5).map((group) => (
                  <button
                    key={group.id}
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="w-full flex items-center justify-between rounded-2xl bg-[#F9FAFB] hover:bg-[#F0FAF5] px-4 py-3 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0"
                        style={{ background: group.color }}
                      >
                        {group.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[#111827] truncate" style={{ fontWeight: 600 }}>
                          {group.name}
                        </p>
                        <p className="text-xs text-[#9CA3AF]">
                          {t.createdOn} {formatLocalDate(group.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className="text-xs rounded-full bg-white px-3 py-1 text-[#166534] flex-shrink-0"
                      style={{ fontWeight: 600 }}
                    >
                      {group.members.length} {t.members}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-[#7EDDBA]" />
                </div>
                <p className="text-[#374151] text-sm mb-1" style={{ fontWeight: 600 }}>
                  {t.noActivityYet}
                </p>
                <p className="text-[#9CA3AF] text-xs">{t.activityDesc}</p>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            {user ? (
              <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB]">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                    Account
                  </h3>
                  <button
                    onClick={() => navigate("/settings")}
                    className="flex items-center gap-1 text-xs text-[#9CA3AF] hover:text-[#16A34A] transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    <SettingsIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl bg-[#7EDDBA] flex items-center justify-center text-[#065f46] overflow-hidden flex-shrink-0"
                    style={{ fontWeight: 700 }}
                  >
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={userName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      userInitials
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                      {userName}
                    </p>
                    <p className="text-sm text-[#6B7280] truncate">{user.email}</p>
                    <p className="text-xs text-[#9CA3AF] mt-1">
                      Role: {user.role} · Currency: {user.defaultCurrency}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB]">
              <h3 className="text-[#111827] mb-4" style={{ fontWeight: 700 }}>
                {t.quickDebts}
              </h3>
              {isLoadingExpenses ? (
                <div className="space-y-3">
                  <SkeletonRow className="h-12" />
                  <SkeletonRow className="h-12" />
                </div>
              ) : quickDebts.length > 0 ? (
                <div className="space-y-3">
                  {quickDebts.slice(0, 5).map((debt) => {
                    const isOwedToYou = debt.net > 0;

                    return (
                      <div
                        key={`${debt.userId}-${debt.currency}`}
                        className="flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#EAFBF3] text-xs text-[#15803D]"
                            style={{ fontWeight: 700 }}
                          >
                            {debt.name
                              .split(" ")
                              .filter(Boolean)
                              .slice(0, 2)
                              .map((part) => part[0]?.toUpperCase())
                              .join("")}
                          </div>
                          <div className="min-w-0">
                            <p
                              className="text-sm text-[#111827] truncate"
                              style={{ fontWeight: 600 }}
                            >
                              {debt.name}
                            </p>
                            <p className="text-xs text-[#9CA3AF]">
                              {isOwedToYou ? t.owesYou : t.youOweLabel}
                            </p>
                          </div>
                        </div>
                        <span
                          className="text-sm flex-shrink-0"
                          style={{
                            fontWeight: 700,
                            color: isOwedToYou ? "#16A34A" : "#DC2626",
                          }}
                        >
                          {formatCurrency(Math.abs(debt.net), debt.currency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-10 h-10 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Users className="w-5 h-5 text-[#7EDDBA]" />
                  </div>
                  <p className="text-[#9CA3AF] text-xs">{t.noOutstandingDebts}</p>
                </div>
              )}
            </div>

            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#16A34A] to-[#0d5c2a] p-5 text-white">
              <Sparkles className="absolute -right-2 -top-2 w-20 h-20 text-white/10" />
              <p className="text-[#A7F3D0] text-sm mb-2 relative" style={{ fontWeight: 600 }}>
                {t.getStarted}
              </p>
              <p
                className="text-white mb-4 relative"
                style={{ fontSize: "1rem", fontWeight: 700 }}
              >
                {groups.length > 0 ? t.groupsTitle : t.heroDesc}
              </p>
              <button
                onClick={() => navigate("/groups")}
                className="relative flex items-center gap-1.5 rounded-xl bg-white/15 hover:bg-white/25 px-3 py-2 text-white text-xs transition-colors"
                style={{ fontWeight: 600 }}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t.goToGroups}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}