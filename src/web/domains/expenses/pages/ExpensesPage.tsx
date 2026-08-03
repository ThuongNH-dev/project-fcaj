import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, Plus, Search, Receipt, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import {
  formatCurrency,
  formatShortDate,
  toTitleCase,
} from "../../../shared/lib/formatters";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import { useStoredUser } from "../../auth";
import { getGroups, type Group } from "../../groups";
import { uploadReceiptFile } from "../../receipts";
import { useFeedback } from "../../../shared/providers/FeedbackProvider";
import { AddExpenseDialog, type NewExpense } from "../components/AddExpenseDialog";
import { createExpense, deleteExpense, getExpenses, updateExpense, type Expense } from "..";
import { getReceipt, getReceiptViewUrl, type ReceiptUpload } from "../../receipts";
import { formatCurrencyBreakdown } from "../../settlements/lib/settlement.utils";
import { getCurrentUserBilling, type CurrentUserBillingSummary } from "../../users";
import { AdminPagination } from "../../../app/admin/components/AdminPagination";
import {
  ADMIN_PAGE_SIZE,
  useAdminPagination,
} from "../../../app/admin/lib/admin.utils";

const catColors: Record<string, string> = {
  food: "bg-[#D1FAE5] text-[#065f46]",
  travel: "bg-[#DBEAFE] text-[#1e40af]",
  entertainment: "bg-[#FCE7F3] text-[#9d174d]",
  accommodation: "bg-[#FEF3C7] text-[#92400e]",
  shopping: "bg-[#EDE9FE] text-[#4c1d95]",
  utilities: "bg-[#FEE2E2] text-[#991b1b]",
  other: "bg-[#F3F4F6] text-[#4B5563]",
};

const statusStyles: Record<string, string> = {
  settled: "bg-[#D1FAE5] text-[#065f46]",
  pending: "bg-[#FEF3C7] text-[#92400e]",
};

const reviewStyles: Record<Expense["reviewStatus"], string> = {
  approved: "bg-[#D1FAE5] text-[#065f46]",
  pending: "bg-[#FEF3C7] text-[#92400e]",
  rejected: "bg-[#FEE2E2] text-[#991b1b]",
};

const reviewLabels: Record<Expense["reviewStatus"], string> = {
  pending: "Receive Pending",
  approved: "Approved",
  rejected: "Rejected",
};

function isExpenseApproved(expense: Expense) {
  return expense.reviewStatus === "approved";
}

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

export function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [billingSummary, setBillingSummary] = useState<CurrentUserBillingSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null);
  const [selectedReceiptUrl, setSelectedReceiptUrl] = useState("");
  const [selectedReceiptTitle, setSelectedReceiptTitle] = useState("");
  const [selectedReceiptMeta, setSelectedReceiptMeta] = useState<ReceiptUpload | null>(null);
  const { t } = useLanguage();
  const location = useLocation();
  const { confirm, showToast } = useFeedback();
  const currentUser = useStoredUser();
  const focusedExpenseId = useMemo(
    () => new URLSearchParams(location.search).get("expenseId"),
    [location.search],
  );
  const navigate = useNavigate();
  const preferredCurrency =
    currentUser?.defaultCurrency ?? expenses[0]?.currency ?? "VND";
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
  const isFreePlan = billingSummary?.profile.plan !== "pro";
  const monthlyExpenseLimit = billingSummary?.usage.expenseLimit ?? 5;
  const isMonthlyExpenseLimitReached =
    isFreePlan && currentMonthExpenseCount >= monthlyExpenseLimit;
  const filters = [
    { key: "All", label: t.all },
    { key: "Pending", label: t.pending },
    { key: "Settled", label: t.settled },
  ];

  async function loadExpenseData() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const [expensesResponse, groupsResponse, billingResponse] = await Promise.all([
        getExpenses(),
        getGroups(),
        getCurrentUserBilling(),
      ]);

      setExpenses(expensesResponse.expenses ?? []);
      setGroups(groupsResponse.groups ?? []);
      setBillingSummary(billingResponse.billing ?? null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load expenses.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadExpenseData();
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

  const filteredExpenses = expenses.filter((expense) => {
    const groupName = groupsById.get(expense.groupId)?.name ?? "";
    const keyword = search.trim().toLowerCase();
    const matchesSearch =
      !keyword ||
      expense.title.toLowerCase().includes(keyword) ||
      groupName.toLowerCase().includes(keyword);
    const matchesFilter =
      filter === "All" || expense.settlementStatus === filter.toLowerCase();

    return matchesSearch && matchesFilter;
  });
  const isExpenseInBannedGroup = (expense: Expense) =>
    Boolean(groupsById.get(expense.groupId)?.isBanned);

  const {
    page: expensesPage,
    pageItems: pagedExpenses,
    setPage: setExpensesPage,
    totalPages: expensesTotalPages,
  } = useAdminPagination(filteredExpenses);

  useEffect(() => {
    if (!focusedExpenseId || isLoading) {
      return;
    }

    const focusedIndex = filteredExpenses.findIndex(
      (expense) => expense.id === focusedExpenseId,
    );

    if (focusedIndex >= 0) {
      setExpensesPage(Math.floor(focusedIndex / ADMIN_PAGE_SIZE) + 1);
    }
  }, [filteredExpenses, focusedExpenseId, isLoading, setExpensesPage]);

  useEffect(() => {
    if (!focusedExpenseId) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const target = Array.from(
        document.querySelectorAll<HTMLElement>("[data-expense-id]"),
      ).find((element) => element.dataset.expenseId === focusedExpenseId);

      target?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [expensesPage, focusedExpenseId, pagedExpenses]);

  const totalSpentByCurrency = filteredExpenses.reduce((totals, expense) => {
    const currentUserShare =
      expense.participants.find((participant) => participant.userId === currentUser?.id)
        ?.shareAmount ?? 0;

    addCurrencyAmount(totals, expense.currency, currentUserShare);
    return totals;
  }, new Map<string, number>());

  const pendingTotalByCurrency = filteredExpenses
    .filter((expense) => expense.settlementStatus === "pending")
    .reduce((totals, expense) => {
      const currentUserShare =
        expense.participants.find((participant) => participant.userId === currentUser?.id)
          ?.shareAmount ?? 0;

      addCurrencyAmount(totals, expense.currency, currentUserShare);
      return totals;
    }, new Map<string, number>());

  const handleOpenAddExpense = () => {
    if (isMonthlyExpenseLimitReached) {
      showToast({
        variant: "error",
        message: "Free plan can create up to 5 expenses per month. Upgrade to Pro to continue.",
      });
      navigate("/settings?tab=billing");
      return;
    }

    if (groups.length === 0) {
      showToast({
        variant: "error",
        message: "Create or join a group before adding an expense.",
      });
      return;
    }

    setShowModal(true);
  };

  const handleRequestReceiptUpgrade = async () => {
    const confirmed = await confirm({
      title: "Receipt upload needs Pro",
      message:
        "Free plan does not include receipt upload. Upgrade to Pro to continue.",
      confirmLabel: "Go to billing",
      cancelLabel: "Not now",
    });

    if (!confirmed) {
      return;
    }

    navigate("/settings?tab=billing");
  };

  const handleAdd = async (expense: NewExpense) => {
    if (!expense.groupId || !expense.paidByUserId || !expense.participantShares) {
      throw new Error("Expense details are incomplete.");
    }

    let receiptId: string | undefined;

    if (expense.receiptFile) {
      const uploadedReceipt = await uploadReceiptFile({
        file: expense.receiptFile,
        groupId: expense.groupId,
      });

      receiptId = uploadedReceipt.id;
    }

    const response = await createExpense({
      groupId: expense.groupId,
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
      await loadExpenseData();
    }

    showToast({
      variant: "success",
      message: response.message,
    });
  };

  const handleUpdate = async (expense: NewExpense) => {
    if (!expenseToEdit) {
      throw new Error("Expense details are incomplete.");
    }

    if (!isExpenseApproved(expenseToEdit)) {
      showToast({
        variant: "error",
        message: "Only approved expenses can be edited.",
      });
      setExpenseToEdit(null);
      return;
    }

    if (!expense.paidByUserId || !expense.participantShares) {
      throw new Error("Expense details are incomplete.");
    }

    const response = await updateExpense(expenseToEdit.id, {
      paidByUserId: expense.paidByUserId,
      title: expense.title,
      description: expense.description,
      expenseDate: expense.date,
      category: expense.categoryKey ?? expense.category.toLowerCase(),
      amount: expense.amount,
      splitMode: expense.splitMode,
      participants: expense.participantShares,
    });

    if (response.expense) {
      setExpenses((prevExpenses) =>
        prevExpenses.map((currentExpense) =>
          currentExpense.id === response.expense?.id ? response.expense! : currentExpense,
        ),
      );
    } else {
      await loadExpenseData();
    }

    showToast({
      variant: "success",
      message: response.message,
    });
    setExpenseToEdit(null);
  };

  const handleDelete = async (expense: Expense) => {
    if (!isExpenseApproved(expense)) {
      showToast({
        variant: "error",
        message: "Only approved expenses can be deleted.",
      });
      return;
    }

    if (isExpenseInBannedGroup(expense) || !isExpenseApproved(expense)) {
      showToast({
        variant: "error",
        message: "This group has been banned. Expense deletion is disabled.",
      });
      return;
    }

    const confirmed = await confirm({
      title: "Delete expense",
      message: `Delete "${expense.title}"? This cannot be undone.`,
      cancelLabel: t.cancel,
      confirmLabel: "Delete",
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      const response = await deleteExpense(expense.id);
      setExpenses((prevExpenses) =>
        prevExpenses.filter((currentExpense) => currentExpense.id !== expense.id),
      );
      showToast({
        variant: "success",
        message: response.message,
      });
    } catch (error) {
      showToast({
        variant: "error",
        message: error instanceof Error ? error.message : "Unable to delete expense.",
      });
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
    <div className="min-h-screen bg-[#F6FBF8]">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1
              className="text-[#111827]"
              style={{ fontSize: "1.5rem", fontWeight: 800 }}
            >
              {t.expensesTitle}
            </h1>
            <p className="text-[#6B7280] text-sm mt-0.5">
              {expenses.length} {expenses.length !== 1 ? t.expensesTotal : t.expenseTotal}
            </p>
          </div>
          <button
            onClick={handleOpenAddExpense}
            className="flex items-center gap-2 bg-[#16A34A] text-white px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-all shadow-sm"
            style={{ fontWeight: 600, fontSize: "0.875rem" }}
          >
            <Plus className="w-4 h-4" />
            {isMonthlyExpenseLimitReached ? "Upgrade to Pro" : t.addExpenseBtn}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            {
              label: t.totalSpent,
              value: formatCurrencyBreakdown(totalSpentByCurrency, {
                emptyCurrency: preferredCurrency,
              }),
            },
            {
              label: t.pendingSettlement,
              value: formatCurrencyBreakdown(pendingTotalByCurrency, {
                emptyCurrency: preferredCurrency,
              }),
            },
            { label: t.expensesThisMonth, value: `${currentMonthExpenseCount}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#F0FAF5] rounded-2xl p-5 border border-white">
              <p
                className="text-[#111827]"
                style={{ fontSize: "1.5rem", fontWeight: 800 }}
              >
                <CurrencyBreakdownValue value={value} />
              </p>
              <p className="text-[#6B7280] text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
            {errorMessage}
          </div>
        )}

        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder={t.searchExpensesGroups}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA]"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-xl p-1">
            {filters.map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                  filter === filterOption.key
                    ? "bg-[#16A34A] text-white shadow-sm"
                    : "text-[#6B7280] hover:text-[#111827]"
                }`}
                style={{ fontWeight: 500 }}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          {isLoading ? (
            <div className="px-5 py-8 text-sm text-[#6B7280]">
              Loading expenses...
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
              <div className="w-16 h-16 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-8 h-8 text-[#7EDDBA]" />
              </div>
              <h3 className="text-[#111827] mb-1" style={{ fontWeight: 700 }}>
                {expenses.length === 0 ? t.noExpensesTitle : t.noResultsFound}
              </h3>
              <p className="text-[#6B7280] text-sm mb-6">
                {expenses.length === 0 ? t.noExpensesAddFirst : t.adjustFilter}
              </p>
              {expenses.length === 0 && (
                <button
                  onClick={handleOpenAddExpense}
                  className="flex items-center gap-2 bg-[#16A34A] text-white px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors"
                  style={{ fontWeight: 600, fontSize: "0.875rem" }}
                >
                  <Plus className="w-4 h-4" />
                  {isMonthlyExpenseLimitReached ? "Upgrade to Pro" : t.addExpenseBtn}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F3F4F6]">
                      {[t.expense, t.group, t.category, t.paidBy, "Total", t.yourShare, t.date, t.status, "Action"].map((heading) => (
                        <th
                          key={heading}
                          className="text-left px-5 py-3 text-xs text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap"
                          style={{ fontWeight: 600 }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pagedExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      data-expense-id={expense.id}
                      className={`border-b transition-colors ${
                        expense.id === focusedExpenseId
                          ? "border-[#86EFAC] bg-[#ECFDF5] ring-2 ring-inset ring-[#16A34A]"
                          : "border-[#F9FAFB] hover:bg-[#FAFAFA]"
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-[#F0FAF5] rounded-xl flex items-center justify-center flex-shrink-0">
                            <Receipt className="w-3.5 h-3.5 text-[#16A34A]" />
                          </div>
                          <span
                            className="text-sm text-[#111827] whitespace-nowrap"
                            style={{ fontWeight: 500 }}
                          >
                            {expense.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className="text-xs bg-[#F0FAF5] text-[#16A34A] px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ fontWeight: 500 }}
                        >
                          {groupsById.get(expense.groupId)?.name ?? "Unknown group"}
                        </span>
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
                        className="px-5 py-3.5 text-sm text-[#374151] whitespace-nowrap"
                        style={{ fontWeight: 500 }}
                      >
                        {memberNameById.get(expense.paidByUserId) ?? expense.paidByUserId}
                      </td>
                      <td
                        className="px-5 py-3.5 text-sm text-[#6B7280]"
                        style={{ fontWeight: 500 }}
                      >
                        {formatCurrency(expense.amount, expense.currency)}
                      </td>
                      <td
                        className="px-5 py-3.5 text-sm text-[#111827]"
                        style={{ fontWeight: 700 }}
                      >
                        {formatCurrency(
                          expense.participants.find(
                            (participant) => participant.userId === currentUser?.id,
                          )?.shareAmount ?? 0,
                          expense.currency,
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-[#9CA3AF] whitespace-nowrap">
                        {formatShortDate(expense.expenseDate)}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex flex-wrap items-center gap-2">
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
                              reviewStyles[expense.reviewStatus]
                            }`}
                            style={{ fontWeight: 500 }}
                          >
                            {reviewLabels[expense.reviewStatus]}
                          </span>
                          {expense.reviewStatus === "rejected" ? (
                            <p className="w-full text-xs text-[#B91C1C]">
                              {t.rejectionReason}: {expense.rejectionReason?.trim() || "No reason provided."}
                            </p>
                          ) : null}
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
                              {expense.createdBy === currentUser?.id && (
                                <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setExpenseToEdit(expense)}
                                disabled={isExpenseInBannedGroup(expense) || !isExpenseApproved(expense)}
                                className={`inline-flex h-9 items-center gap-1 rounded-full border px-3 text-xs transition-colors ${
                                  isExpenseInBannedGroup(expense) || !isExpenseApproved(expense)
                                    ? "cursor-not-allowed border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF]"
                                    : "border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB]"
                                }`}
                                style={{ fontWeight: 600 }}
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDelete(expense)}
                                disabled={isExpenseInBannedGroup(expense) || !isExpenseApproved(expense)}
                                className={`inline-flex h-9 items-center gap-1 rounded-full border px-3 text-xs transition-colors ${
                                  isExpenseInBannedGroup(expense) || !isExpenseApproved(expense)
                                    ? "cursor-not-allowed border-[#E5E7EB] bg-[#F9FAFB] text-[#9CA3AF]"
                                    : "border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2]"
                                }`}
                                style={{ fontWeight: 600 }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <AdminPagination
                page={expensesPage}
                totalPages={expensesTotalPages}
                onPageChange={setExpensesPage}
              />
            </>
          )}
        </div>
      </div>

      {createPortal(
        <AddExpenseDialog
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
          showGroupSelect={true}
          availableGroups={groups}
          currentUserId={currentUser?.id ?? null}
          canUploadReceipt={!isFreePlan}
          onRequestReceiptUpgrade={handleRequestReceiptUpgrade}
        />,
        document.body,
      )}
      {createPortal(
        <AddExpenseDialog
          isOpen={expenseToEdit !== null}
          onClose={() => setExpenseToEdit(null)}
          onSubmit={handleUpdate}
          showGroupSelect={true}
          availableGroups={groups}
          currentUserId={currentUser?.id ?? null}
          initialExpense={expenseToEdit ? {
            title: expenseToEdit.title,
            description: expenseToEdit.description,
            amount: expenseToEdit.amount,
            paidBy: expenseToEdit.paidByUserId,
            paidByUserId: expenseToEdit.paidByUserId,
            category: expenseToEdit.category,
            categoryKey: expenseToEdit.category,
            date: expenseToEdit.expenseDate.slice(0, 10),
            splitWith: expenseToEdit.participants.map((participant) => participant.userId),
            participantShares: expenseToEdit.participants,
            group: groupsById.get(expenseToEdit.groupId)?.name,
            groupId: expenseToEdit.groupId,
            splitMode: expenseToEdit.splitMode as "equal" | "custom",
            receiptFile: null,
          } : null}
          submitLabel="Save changes"
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
