import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  Plus,
  Users,
  DollarSign,
  TrendingUp,
  Receipt,
  Trash2,
  UserPlus,
} from "lucide-react";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import { useStoredUser } from "../../auth";
import { useFeedback } from "../../../shared/providers/FeedbackProvider";
import { getCurrentUserBilling, type CurrentUserBillingSummary } from "../../users";
import {
  AddExpenseDialog,
  createExpense,
  getExpenses,
  type Expense,
  type NewExpense,
} from "../../expenses";
import { uploadReceiptFile } from "../../receipts";
import { getReceipt, getReceiptViewUrl, type ReceiptUpload } from "../../receipts";
import {
  addGroupMember,
  canManageGroupMembers,
  canRemoveGroupMember,
  getGroup,
  removeGroupMember,
  type Group,
} from "..";
import {
  formatCurrency,
  formatShortDate,
  toTitleCase,
} from "../../../shared/lib/formatters";
import { formatCurrencyBreakdown } from "../../settlements/lib/settlement.utils";

const catColors: Record<string, string> = {
  food: "bg-[#D1FAE5] text-[#065f46]",
  travel: "bg-[#DBEAFE] text-[#1e40af]",
  entertainment: "bg-[#FCE7F3] text-[#9d174d]",
  accommodation: "bg-[#FEF3C7] text-[#92400e]",
  shopping: "bg-[#EDE9FE] text-[#4c1d95]",
  utilities: "bg-[#FEE2E2] text-[#991b1b]",
  other: "bg-[#F3F4F6] text-[#6B7280]",
};

const statusStyles: Record<string, string> = {
  settled: "bg-[#D1FAE5] text-[#065f46]",
  pending: "bg-[#FEF3C7] text-[#92400e]",
};

const reviewStyles: Record<string, string> = {
  approved: "bg-[#D1FAE5] text-[#065f46]",
  pending: "bg-[#FEF3C7] text-[#92400e]",
  rejected: "bg-[#FEE2E2] text-[#991b1b]",
};

function addCurrencyAmount(totals: Map<string, number>, currency: string, amount: number) {
  totals.set(currency, Number(((totals.get(currency) ?? 0) + amount).toFixed(2)));
}

export function GroupDetailPage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [group, setGroup] = useState<Group | null>(null);
  const [billingSummary, setBillingSummary] = useState<CurrentUserBillingSummary | null>(null);
  const [isLoadingGroup, setIsLoadingGroup] = useState(true);
  const [isLoadingExpenses, setIsLoadingExpenses] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [isSubmittingMember, setIsSubmittingMember] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState("");
  const [selectedReceiptTitle, setSelectedReceiptTitle] = useState("");
  const [selectedReceiptMeta, setSelectedReceiptMeta] = useState<ReceiptUpload | null>(null);
  const { t } = useLanguage();
  const { confirm, showToast } = useFeedback();
  const currentUser = useStoredUser();
  const navigate = useNavigate();
  const { groupId = null } = useParams();

  useEffect(() => {
    async function loadBilling() {
      try {
        const response = await getCurrentUserBilling();
        setBillingSummary(response.billing ?? null);
      } catch {
        setBillingSummary(null);
      }
    }

    async function loadGroup() {
      if (!groupId) {
        setErrorMessage("No group selected.");
        setIsLoadingGroup(false);
        return;
      }

      try {
        setErrorMessage("");
        setIsLoadingGroup(true);

        const response = await getGroup(groupId);
        setGroup(response.group ?? null);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load group.",
        );
      } finally {
        setIsLoadingGroup(false);
      }
    }

    void loadGroup();
    void loadBilling();
  }, [groupId]);

  useEffect(() => {
    async function loadExpensesForGroup() {
      if (!groupId) {
        setExpenses([]);
        setIsLoadingExpenses(false);
        return;
      }

      try {
        setIsLoadingExpenses(true);
        const response = await getExpenses();
        const groupExpenses = (response.expenses ?? []).filter(
          (expense) => expense.groupId === groupId,
        );
        setExpenses(groupExpenses);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load group expenses.",
        );
      } finally {
        setIsLoadingExpenses(false);
      }
    }

    void loadExpensesForGroup();
  }, [groupId]);

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(expenses.map((expense) => toTitleCase(expense.category))),
    );

    return ["All", ...uniqueCategories];
  }, [expenses]);

  const filteredExpenses =
    activeCategory === "All"
      ? expenses
      : expenses.filter(
          (expense) => toTitleCase(expense.category) === activeCategory,
        );

  const memberCount = group?.members.length ?? 0;
  const canManageMembers = Boolean(group && canManageGroupMembers(currentUser, group));
  const isGroupBanned = Boolean(group?.isBanned);
  const groupCurrency = group?.currency ?? currentUser?.defaultCurrency ?? "USD";
  const isFreePlan = billingSummary?.profile.plan !== "pro";
  const groupExpenseCount = group?.expenseCount ?? expenses.length;
  const isFreeGroupExpenseLimitReached = isFreePlan && groupExpenseCount >= 20;
  const currentMonthExpenseCount = useMemo(() => {
    const now = new Date();

    return expenses.filter((expense) => {
      const createdAt = new Date(expense.createdAt);

      return (
        expense.createdBy === currentUser?.id &&
        createdAt.getFullYear() === now.getFullYear() &&
        createdAt.getMonth() === now.getMonth()
      );
    }).length;
  }, [currentUser?.id, expenses]);
  const isFreeMonthlyExpenseLimitReached = isFreePlan && currentMonthExpenseCount >= 5;
  const totalExpensesByCurrency = expenses.reduce((totals, expense) => {
    addCurrencyAmount(totals, expense.currency, expense.amount);
    return totals;
  }, new Map<string, number>());
  const yourShareByCurrency = expenses.reduce((totals, expense) => {
    const share =
      expense.participants.find((participant) => participant.userId === currentUser?.id)
        ?.shareAmount ?? 0;
    addCurrencyAmount(totals, expense.currency, share);
    return totals;
  }, new Map<string, number>());
  const youPaidByCurrency = expenses.reduce((totals, expense) => {
    if (expense.paidByUserId === currentUser?.id) {
      addCurrencyAmount(totals, expense.currency, expense.amount);
    }
    return totals;
  }, new Map<string, number>());
  const youAreOwedByCurrency = new Map<string, number>();
  youPaidByCurrency.forEach((paidAmount, currency) => {
    addCurrencyAmount(youAreOwedByCurrency, currency, paidAmount - (yourShareByCurrency.get(currency) ?? 0));
  });

  async function handleAddExpense(expense: NewExpense) {
    if (!group || !groupId || !expense.paidByUserId || !expense.participantShares) {
      throw new Error("Expense details are incomplete.");
    }

    if (group.isBanned) {
      showToast({
        variant: "error",
        message: "This group has been banned. You can only view old data.",
      });
      return;
    }

    let receiptId: string | undefined;

    if (expense.receiptFile) {
      if (isFreePlan) {
        const confirmed = await confirm({
          title: "Receipt upload needs Pro",
          message:
            "Free plan does not include receipt upload in groups. Upgrade to Pro to add a receipt to this expense.",
          confirmLabel: "Go to billing",
          cancelLabel: "Not now",
        });

        if (!confirmed) {
          return;
        }

        navigate("/settings?tab=billing");
        return;
      }

      const uploadedReceipt = await uploadReceiptFile({
        file: expense.receiptFile,
        groupId,
      });

      receiptId = uploadedReceipt.id;
    }

    const response = await createExpense({
      groupId,
      paidByUserId: expense.paidByUserId,
      title: expense.title,
      description: expense.description,
      expenseDate: expense.date,
      category: expense.categoryKey ?? expense.category.toLowerCase(),
      amount: expense.amount,
      splitMode: expense.splitMode,
      participants: expense.participantShares,
      receiptId,
    });

    if (response.expense) {
      setExpenses((prevExpenses) => [response.expense, ...prevExpenses]);
    } else {
      const refreshedExpenses = await getExpenses();
      setExpenses(
        (refreshedExpenses.expenses ?? []).filter(
          (currentExpense) => currentExpense.groupId === groupId,
        ),
      );
    }

    showToast({
      variant: "success",
      message: response.message,
    });
  }

  const handleOpenAddExpense = () => {
    if (!group) {
      return;
    }

    if (group.isBanned) {
      showToast({
        variant: "error",
        message: "This group has been banned. You can only view old data.",
      });
      return;
    }

    if (isFreeMonthlyExpenseLimitReached) {
      showToast({
        variant: "error",
        message: "Free plan can create up to 5 expenses per month. Upgrade to Pro to continue.",
      });
      navigate("/settings?tab=billing");
      return;
    }

    if (isFreeGroupExpenseLimitReached) {
      showToast({
        variant: "error",
        message: "Free plan groups can have up to 20 expenses. Upgrade to Pro to continue.",
      });
      navigate("/settings?tab=billing");
      return;
    }

    setShowExpenseModal(true);
  };

  const handleRequestReceiptUpgrade = async () => {
    if (group?.isBanned) {
      showToast({
        variant: "error",
        message: "This group has been banned. You can only view old data.",
      });
      return;
    }

    const confirmed = await confirm({
      title: "Receipt upload needs Pro",
      message:
        "Free plan does not include receipt upload in groups. Upgrade to Pro to continue.",
      confirmLabel: "Go to billing",
      cancelLabel: "Not now",
    });

    if (!confirmed) {
      return;
    }

    navigate("/settings?tab=billing");
  };

  const handleAddMember = async () => {
    if (!groupId) {
      return;
    }

    if (group?.isBanned) {
      showToast({
        variant: "error",
        message: "This group has been banned. You can only view old data.",
      });
      return;
    }

    if (!memberEmail.trim()) {
      showToast({
        variant: "error",
        message: "Member email is required.",
      });
      return;
    }

    try {
      setIsSubmittingMember(true);
      const response = await addGroupMember(groupId, {
        email: memberEmail.trim(),
      });
      setGroup(response.group ?? null);
      setMemberEmail("");
      showToast({
        variant: "success",
        message: response.message,
      });
    } catch (error) {
      showToast({
        variant: "error",
        message:
          error instanceof Error ? error.message : "Unable to add member.",
      });
    } finally {
      setIsSubmittingMember(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!groupId) {
      return;
    }

    if (group?.isBanned) {
      showToast({
        variant: "error",
        message: "This group has been banned. You can only view old data.",
      });
      return;
    }

    const confirmed = await confirm({
      title: t.removeMember,
      message: `${t.removeMemberConfirm} "${memberName}"?`,
      cancelLabel: t.cancel,
      confirmLabel: t.removeMember,
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      setRemovingMemberId(memberId);
      const response = await removeGroupMember(groupId, memberId);
      setGroup(response.group ?? null);
      showToast({
        variant: "success",
        message: response.message,
      });
    } catch (error) {
      showToast({
        variant: "error",
        message:
          error instanceof Error ? error.message : "Unable to remove member.",
      });
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleOpenReceipt = async (expense: Expense) => {
    if (!expense.receiptId) {
      return;
    }

    try {
      const response = await getReceipt(expense.receiptId);
      const receipt = response.receipt ?? null;
      setSelectedReceiptMeta(receipt);
      setSelectedReceiptTitle(receipt?.originalFileName ?? expense.title);

      if (receipt?.reviewStatus === "rejected") {
        setSelectedReceiptUrl("");
        return;
      }

      const previewResponse = await getReceiptViewUrl(expense.receiptId);
      setSelectedReceiptUrl(previewResponse.url ?? "");
    } catch (error) {
      setSelectedReceiptMeta(null);
      showToast({
        variant: "error",
        message: error instanceof Error ? error.message : "Unable to open receipt.",
      });
    }
  };

  const handleCloseReceipt = () => {
    setSelectedReceiptUrl("");
    setSelectedReceiptTitle("");
    setSelectedReceiptMeta(null);
  };

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        <div className="mb-6">
          <button
            onClick={() => navigate("/groups")}
            className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] mb-4 transition-colors"
            style={{ fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToGroups}
          </button>
          {errorMessage && (
            <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4 text-sm text-[#B91C1C] mb-4">
              {errorMessage}
            </div>
          )}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1
                className="text-[#111827] mb-1"
                style={{ fontSize: "1.5rem", fontWeight: 800 }}
              >
                {isLoadingGroup ? "Loading group..." : group?.name ?? t.groupsTitle}
              </h1>
              {!isLoadingGroup && group && (
                <p className="text-[#6B7280] text-sm mb-2">
                  {memberCount} {t.members}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span
                  className={`text-xs px-2.5 py-1 rounded-full ${
                    isGroupBanned ? "bg-[#FEE2E2] text-[#991B1B]" : "bg-[#D1FAE5] text-[#065f46]"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  {isGroupBanned ? "Banned" : t.active}
                </span>
              </div>
            </div>
            <button
              onClick={handleOpenAddExpense}
              disabled={isGroupBanned}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all shadow-sm ${
                isGroupBanned
                  ? "bg-[#D1D5DB] text-[#6B7280] cursor-not-allowed hover:bg-[#D1D5DB]"
                  : "bg-[#16A34A] text-white hover:bg-[#15803d]"
              }`}
              style={{ fontWeight: 600, fontSize: "0.875rem" }}
            >
              <Plus className="w-4 h-4" />
              {t.addExpense}
            </button>
          </div>
        </div>

        {isGroupBanned && (
          <div className="mb-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4 text-sm text-[#991B1B]">
            This group has been banned. You can view old data only. No new expenses,
            members, receipts, or edits are allowed.
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {[
            {
              label: t.totalExpenses,
              value: formatCurrencyBreakdown(totalExpensesByCurrency, {
                emptyCurrency: groupCurrency,
              }),
              icon: DollarSign,
              bg: "bg-[#F0FAF5]",
              iconBg: "bg-[#7EDDBA]",
            },
            {
              label: t.yourShare,
              value: formatCurrencyBreakdown(yourShareByCurrency, {
                emptyCurrency: groupCurrency,
              }),
              icon: Users,
              bg: "bg-[#EFF6FF]",
              iconBg: "bg-[#93C5FD]",
            },
            {
              label: t.youPaid,
              value: formatCurrencyBreakdown(youPaidByCurrency, {
                emptyCurrency: groupCurrency,
              }),
              icon: TrendingUp,
              bg: "bg-[#FEFCE8]",
              iconBg: "bg-[#FCD34D]",
            },
            {
              label: t.youAreOwed,
              value: formatCurrencyBreakdown(youAreOwedByCurrency, {
                signed: true,
                emptyCurrency: groupCurrency,
              }),
              icon: TrendingUp,
              bg: "bg-[#F0FDF4]",
              iconBg: "bg-[#4ADE80]",
            },
          ].map(({ label, value, icon: Icon, bg, iconBg }) => (
            <div key={label} className={`${bg} rounded-2xl p-4 border border-white`}>
              <div
                className={`w-8 h-8 ${iconBg} rounded-xl flex items-center justify-center mb-3`}
              >
                <Icon className="w-4 h-4 text-[#065f46]" />
              </div>
              <p
                className="text-[#111827] whitespace-pre-line"
                style={{ fontWeight: 700, fontSize: "1.25rem" }}
              >
                {value}
              </p>
              <p className="text-[#6B7280] text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                  {t.expenses}
                </h3>
                <div className="flex items-center gap-1">
                  {categories.map((category) => (
                    <button
                      key={category}
                      onClick={() => setActiveCategory(category)}
                      className={`px-3 py-1 rounded-full text-xs transition-all ${
                        activeCategory === category
                          ? "bg-[#16A34A] text-white"
                          : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"
                      }`}
                      style={{ fontWeight: 500 }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {isLoadingExpenses ? (
                <div className="px-5 py-8 text-sm text-[#6B7280]">
                  Loading group expenses...
                </div>
              ) : filteredExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="w-12 h-12 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Receipt className="w-6 h-6 text-[#7EDDBA]" />
                  </div>
                  <p className="text-[#374151] text-sm mb-1" style={{ fontWeight: 600 }}>
                    {t.noExpensesInGroup}
                  </p>
                  <p className="text-[#9CA3AF] text-xs mb-4">{t.addExpensePrompt}</p>
                  <button
                    onClick={handleOpenAddExpense}
                    disabled={isGroupBanned}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-colors ${
                      isGroupBanned
                        ? "bg-[#D1D5DB] text-[#6B7280] cursor-not-allowed hover:bg-[#D1D5DB]"
                        : "bg-[#16A34A] text-white hover:bg-[#15803d]"
                    }`}
                    style={{ fontWeight: 600 }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {isFreeGroupExpenseLimitReached ? "Upgrade to Pro" : t.addExpense}
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#F3F4F6]">
                        {[t.expense, t.category, t.paidBy, t.amount, t.date, t.status, "Action"].map(
                          (heading) => (
                            <th
                              key={heading}
                              className="text-left px-5 py-3 text-xs text-[#9CA3AF] uppercase tracking-wider"
                              style={{ fontWeight: 600 }}
                            >
                              {heading}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((expense) => (
                        <tr
                          key={expense.id}
                          className="border-b border-[#F9FAFB] hover:bg-[#FAFAFA] transition-colors"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 bg-[#F0FAF5] rounded-lg flex items-center justify-center">
                                <Receipt className="w-3.5 h-3.5 text-[#16A34A]" />
                              </div>
                              <span
                                className="text-sm text-[#111827]"
                                style={{ fontWeight: 500 }}
                              >
                                {expense.title}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span
                              className={`text-xs px-2.5 py-1 rounded-full ${
                                catColors[expense.category] || "bg-[#F3F4F6] text-[#6B7280]"
                              }`}
                              style={{ fontWeight: 500 }}
                            >
                              {toTitleCase(expense.category)}
                            </span>
                          </td>
                          <td
                            className="px-5 py-3.5 text-sm text-[#374151]"
                            style={{ fontWeight: 500 }}
                          >
                            {group?.members.find((member) => member.id === expense.paidByUserId)
                              ?.name ?? expense.paidByUserId}
                          </td>
                          <td
                            className="px-5 py-3.5 text-sm text-[#111827]"
                            style={{ fontWeight: 700 }}
                          >
                            {formatCurrency(expense.amount, expense.currency)}
                          </td>
                          <td className="px-5 py-3.5 text-xs text-[#9CA3AF]">
                            {formatShortDate(expense.expenseDate)}
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex flex-wrap gap-2">
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full ${
                                  statusStyles[expense.settlementStatus] ||
                                  "bg-[#F3F4F6] text-[#6B7280]"
                                }`}
                                style={{ fontWeight: 500 }}
                              >
                                {toTitleCase(expense.settlementStatus)}
                              </span>
                              <span
                                className={`text-xs px-2.5 py-1 rounded-full ${
                                  reviewStyles[expense.reviewStatus] ||
                                  "bg-[#F3F4F6] text-[#6B7280]"
                                }`}
                                style={{ fontWeight: 500 }}
                              >
                                {expense.reviewStatus === "approved"
                                  ? "Receipt approved"
                                  : expense.reviewStatus === "rejected"
                                    ? "Receipt rejected"
                                    : "Receipt pending"}
                              </span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex flex-col items-end gap-2">
                              {expense.receiptId && (
                                <button
                                  type="button"
                                  onClick={() => void handleOpenReceipt(expense)}
                                  className="inline-flex h-9 w-24 items-center justify-center rounded-full border border-[#D1D5DB] px-3 text-xs text-[#111827] transition-colors hover:bg-[#F9FAFB]"
                                  style={{ fontWeight: 600 }}
                                >
                                  {t.view}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB]">
              <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
                <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                  {t.memberBalances}
                </h3>
                {canManageMembers && (
                  <span
                    className="rounded-full bg-[#F0FAF5] px-3 py-1 text-xs text-[#166534]"
                    style={{ fontWeight: 600 }}
                  >
                    {t.manageMembers}
                  </span>
                )}
              </div>
              {canManageMembers && (
                  <div className="mb-4 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-3">
                  <label
                    className="mb-2 block text-xs text-[#6B7280]"
                    style={{ fontWeight: 600 }}
                  >
                    {t.addMemberByEmail}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="email"
                      placeholder="friend@email.com"
                      value={memberEmail}
                      onChange={(event) => setMemberEmail(event.target.value)}
                      disabled={isGroupBanned}
                      className="flex-1 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent disabled:cursor-not-allowed disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]"
                    />
                    <button
                      type="button"
                      onClick={() => void handleAddMember()}
                      disabled={isSubmittingMember || isGroupBanned}
                      className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                        isGroupBanned
                          ? "bg-[#D1D5DB] text-[#6B7280]"
                          : "bg-[#16A34A] text-white hover:bg-[#15803d]"
                      }`}
                      style={{ fontWeight: 600 }}
                    >
                      <UserPlus className="h-4 w-4" />
                      {isSubmittingMember ? t.addingMember : t.addMember}
                    </button>
                  </div>
                </div>
              )}
              {group && group.members.length > 0 ? (
                <div className="space-y-3">
                  {group.members.map((member, index) => (
                    <div
                      key={`${member.name}-${index}`}
                      className="flex items-center justify-between rounded-xl bg-[#F9FAFB] px-3 py-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-full bg-[#D1FAE5] flex items-center justify-center text-[#065f46] text-xs"
                          style={{ fontWeight: 700 }}
                        >
                          {member.name
                            .split(" ")
                            .map((part) => part.charAt(0))
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-[#111827]" style={{ fontWeight: 600 }}>
                            {member.name}
                          </p>
                          <p className="text-xs text-[#9CA3AF] truncate">
                            {member.email || member.role}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#6B7280]" style={{ fontWeight: 600 }}>
                          {member.role}
                        </span>
                        {group && canRemoveGroupMember(currentUser, group, member) && (
                          <button
                            type="button"
                            onClick={() => void handleRemoveMember(member.id, member.name)}
                            disabled={removingMemberId === member.id || isGroupBanned}
                            className="inline-flex items-center justify-center rounded-lg bg-[#FEF2F2] p-2 text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            title={t.removeMember}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-10 h-10 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-2">
                    <Users className="w-5 h-5 text-[#7EDDBA]" />
                  </div>
                  <p className="text-[#9CA3AF] text-xs">{t.noMembersYet}</p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB]">
              <h3 className="text-[#111827] mb-4" style={{ fontWeight: 700 }}>
                {t.whoOwesWhom}
              </h3>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-[#9CA3AF] text-xs">{t.noDebts}</p>
              </div>
              <button
                onClick={() => navigate("/settlement")}
                disabled={isGroupBanned}
                className={`w-full mt-2 py-2.5 rounded-xl text-sm transition-colors ${
                  isGroupBanned
                    ? "bg-[#D1D5DB] text-[#6B7280] cursor-not-allowed hover:bg-[#D1D5DB]"
                    : "bg-[#16A34A] text-white hover:bg-[#15803d]"
                }`}
                style={{ fontWeight: 600 }}
              >
                {t.goToSettlements}
              </button>
            </div>

            <div className="bg-[#F0FAF5] rounded-2xl p-5 border border-[#D1FAE5]">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4 text-[#16A34A]" />
                <h3 className="text-[#111827] text-sm" style={{ fontWeight: 700 }}>
                  Receipts
                </h3>
              </div>
              <p className="text-[#6B7280] text-xs">
                {expenses.some((expense) => expense.receiptId)
                  ? `${expenses.filter((expense) => expense.receiptId).length} receipt(s) attached.`
                  : t.noReceiptsYet}
              </p>
            </div>
          </div>
        </div>
      </div>

      {createPortal(
        <AddExpenseDialog
          isOpen={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
          onAdd={handleAddExpense}
          availableGroups={group ? [group] : []}
          defaultGroupId={groupId}
          currentUserId={currentUser?.id ?? null}
          canUploadReceipt={!isFreePlan}
          onRequestReceiptUpgrade={handleRequestReceiptUpgrade}
        />,
        document.body,
      )}
      {(selectedReceiptUrl || selectedReceiptMeta) && (
        <div className="fixed inset-0 z-[240] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/45" onClick={handleCloseReceipt} />
          <div className="relative w-full max-w-5xl overflow-hidden rounded-[1.5rem] bg-white shadow-[0_24px_64px_rgba(17,24,39,0.22)]">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
              <div>
                <p className="text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                  {selectedReceiptTitle}
                </p>
                <p className="text-xs text-[#6B7280]">Receipt preview</p>
              </div>
              <button
                type="button"
                onClick={handleCloseReceipt}
                className="rounded-xl border border-[#E5E7EB] px-3 py-2 text-sm text-[#374151]"
                style={{ fontWeight: 600 }}
              >
                Close
              </button>
            </div>
            {selectedReceiptMeta?.reviewStatus === "rejected" ? (
              <div className="flex min-h-[55vh] items-center justify-center bg-[#F9FAFB] p-6">
                <div className="max-w-2xl rounded-2xl border border-[#FECACA] bg-[#FFF1F2] px-6 py-5 text-center">
                  <p className="text-base text-[#991b1b]" style={{ fontWeight: 800 }}>
                    {t.billRejected}
                  </p>
                  <p className="mt-2 text-sm text-[#7F1D1D]">
                    {t.rejectionReason}: {selectedReceiptMeta.rejectionReason?.trim() || "No reason provided."}
                  </p>
                </div>
              </div>
            ) : (
              <iframe src={selectedReceiptUrl} title={selectedReceiptTitle} className="h-[75vh] w-full" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
