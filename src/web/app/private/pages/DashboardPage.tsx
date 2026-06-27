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
  ChevronRight,
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

export function DashboardPage() {
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { t } = useLanguage();
  const user = useStoredUser();
  const navigate = useNavigate();

  const userName = user ? `${user.firstName} ${user.lastName}` : "Guest";
  const userInitials = user ? getUserInitials(user) : "GU";
  const welcomeMessage = user
    ? `Signed in as ${userName} (${user.role})`
    : t.welcomeMsg;

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

  const currency = user?.defaultCurrency ?? expenses[0]?.currency ?? "USD";
  const totalExpensesAmount = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0,
  );
  const youOweAmount = expenses
    .filter(
      (expense) =>
        expense.settlementStatus === "pending" &&
        expense.paidByUserId !== user?.id,
    )
    .reduce((sum, expense) => {
      const currentUserShare =
        expense.participants.find((participant) => participant.userId === user?.id)
          ?.shareAmount ?? 0;

      return sum + currentUserShare;
    }, 0);
  const youAreOwedAmount = expenses
    .filter(
      (expense) =>
        expense.settlementStatus === "pending" &&
        expense.paidByUserId === user?.id,
    )
    .reduce((sum, expense) => {
      const owedByOthers = expense.participants
        .filter((participant) => participant.userId !== user?.id)
        .reduce(
          (participantSum, participant) =>
            participantSum + participant.shareAmount,
          0,
        );

      return sum + owedByOthers;
    }, 0);
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
      const currentAmount = categoryMap.get(categoryKey) ?? 0;

      categoryMap.set(categoryKey, currentAmount + expense.amount);
      return categoryMap;
    }, new Map<string, number>()),
    ([category, amount]) => ({
      category,
      label:
        t.categories[category as keyof typeof t.categories] ??
        toTitleCase(category),
      amount,
    }),
  ).sort((leftCategory, rightCategory) => rightCategory.amount - leftCategory.amount);
  const totalCategoryAmount = categorySummaries.reduce(
    (sum, categorySummary) => sum + categorySummary.amount,
    0,
  );

  const summaryCards = [
    {
      label: t.totalExpenses,
      value: isLoadingExpenses ? "--" : formatCurrency(totalExpensesAmount, currency),
      icon: DollarSign,
      bg: "bg-[#F0FAF5]",
      iconBg: "bg-[#7EDDBA]",
      iconColor: "text-[#065f46]",
    },
    {
      label: t.youOwe,
      value: isLoadingExpenses ? "--" : formatCurrency(youOweAmount, currency),
      icon: TrendingDown,
      bg: "bg-[#FEF2F2]",
      iconBg: "bg-[#FCA5A5]",
      iconColor: "text-[#991b1b]",
    },
    {
      label: t.youAreOwed,
      value: isLoadingExpenses ? "--" : formatCurrency(youAreOwedAmount, currency),
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
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <h1
              className="text-[#111827]"
              style={{ fontSize: "1.5rem", fontWeight: 800 }}
            >
              {t.dashboard}
            </h1>
            <p className="text-[#6B7280] text-sm mt-0.5">{welcomeMessage}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder={t.searchGroups}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="bg-white border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] w-56"
              />
            </div>
            <button className="relative w-9 h-9 bg-white rounded-xl border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F0FAF5] transition-colors">
              <Bell className="w-4 h-4 text-[#6B7280]" />
            </button>
            <div
              className="w-9 h-9 rounded-xl bg-[#7EDDBA] flex items-center justify-center text-[#065f46] text-xs"
              style={{ fontWeight: 700 }}
              title={userName}
            >
              {userInitials}
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
            <div key={label} className={`${bg} rounded-2xl p-5 border border-white`}>
              <div
                className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center mb-3`}
              >
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <p
                className="text-[#111827]"
                style={{ fontSize: "1.5rem", fontWeight: 800 }}
              >
                {value}
              </p>
              <p className="text-[#6B7280] text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E5E7EB]">
            <h3 className="text-[#111827] mb-1" style={{ fontWeight: 700 }}>
              {t.groupsTitle}
            </h3>
            <p className="text-[#9CA3AF] text-xs mb-4">{t.monthlyOverview}</p>
            {isLoadingGroups ? (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <div className="w-12 h-12 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <ArrowUpRight className="w-6 h-6 text-[#7EDDBA]" />
                </div>
                <p className="text-[#374151] text-sm" style={{ fontWeight: 600 }}>
                  Loading groups...
                </p>
              </div>
            ) : filteredGroups.length > 0 ? (
              <div className="space-y-3">
                {filteredGroups.slice(0, 4).map((group) => (
                  <button
                    key={group.id}
                    onClick={() => navigate(`/groups/${group.id}`)}
                    className="w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-left hover:bg-[#F0FAF5] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
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
                      <ChevronRight className="w-4 h-4 text-[#9CA3AF]" />
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => navigate("/groups")}
                  className="text-sm text-[#16A34A] hover:underline"
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
                <p className="text-[#9CA3AF] text-xs mt-1">{t.noGroupsDesc}</p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
            <h3 className="text-[#111827] mb-1" style={{ fontWeight: 700 }}>
              {t.byCategory}
            </h3>
            <p className="text-[#9CA3AF] text-xs mb-4">{t.thisMonth}</p>
            {isLoadingExpenses ? (
              <div className="flex flex-col items-center justify-center h-36 text-center">
                <div className="w-10 h-10 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <DollarSign className="w-5 h-5 text-[#7EDDBA]" />
                </div>
                <p className="text-[#9CA3AF] text-xs">Loading expenses...</p>
              </div>
            ) : categorySummaries.length > 0 ? (
              <div className="space-y-4">
                {categorySummaries.slice(0, 5).map((categorySummary) => {
                  const percent =
                    totalCategoryAmount > 0
                      ? Math.round((categorySummary.amount / totalCategoryAmount) * 100)
                      : 0;

                  return (
                    <div key={categorySummary.category}>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <span
                          className="text-sm text-[#111827] truncate"
                          style={{ fontWeight: 600 }}
                        >
                          {categorySummary.label}
                        </span>
                        <span className="text-xs text-[#6B7280] flex-shrink-0">
                          {formatCurrency(categorySummary.amount, currency)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-[#F3F4F6] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#7EDDBA]"
                          style={{ width: `${percent}%` }}
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
            <h3 className="text-[#111827] mb-5" style={{ fontWeight: 700 }}>
              {t.recentActivity}
            </h3>
            {isLoadingGroups ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-[#7EDDBA]" />
                </div>
                <p className="text-[#374151] text-sm mb-1" style={{ fontWeight: 600 }}>
                  Loading groups...
                </p>
              </div>
            ) : filteredGroups.length > 0 ? (
              <div className="space-y-3">
                {filteredGroups.slice(0, 5).map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between rounded-2xl bg-[#F9FAFB] px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-[#111827]" style={{ fontWeight: 600 }}>
                        {group.name}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        Created {formatLocalDate(group.createdAt)}
                      </p>
                    </div>
                    <span
                      className="text-xs rounded-full bg-[#F0FAF5] px-3 py-1 text-[#166534]"
                      style={{ fontWeight: 600 }}
                    >
                      {group.members.length} {t.members}
                    </span>
                  </div>
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
                <h3 className="text-[#111827] mb-4" style={{ fontWeight: 700 }}>
                  Account
                </h3>
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-2xl bg-[#7EDDBA] flex items-center justify-center text-[#065f46]"
                    style={{ fontWeight: 700 }}
                  >
                    {userInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                      {userName}
                    </p>
                    <p className="text-sm text-[#6B7280]">{user.email}</p>
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
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-[#7EDDBA]" />
                </div>
                <p className="text-[#9CA3AF] text-xs">{t.noOutstandingDebts}</p>
              </div>
            </div>

            <div className="bg-[#16A34A] rounded-2xl p-5 text-white">
              <p className="text-[#A7F3D0] text-sm mb-2" style={{ fontWeight: 600 }}>
                {t.getStarted}
              </p>
              <p
                className="text-white mb-4"
                style={{ fontSize: "1rem", fontWeight: 700 }}
              >
                {groups.length > 0 ? t.groupsTitle : t.heroDesc}
              </p>
              <button
                onClick={() => navigate("/groups")}
                className="flex items-center gap-1.5 text-[#A7F3D0] text-xs"
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
