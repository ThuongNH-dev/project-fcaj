import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, Receipt } from "lucide-react";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import { getStoredUser } from "../../auth";
import { getGroups, type Group } from "../../groups";
import { uploadReceiptFile } from "../../receipts";
import { useFeedback } from "../../../shared/providers/FeedbackProvider";
import { AddExpenseModal, type NewExpense } from "../components/AddExpenseModal";
import { createExpense, getExpenses, type Expense } from "..";

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

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDisplayDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { t } = useLanguage();
  const { showToast } = useFeedback();
  const currentUser = getStoredUser();
  const filters = [
    { key: "All", label: t.all },
    { key: "Pending", label: t.pending },
    { key: "Settled", label: t.settled },
  ];

  async function loadExpenseData() {
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

  const totalSpent = filteredExpenses.reduce((sum, expense) => {
    const currentUserShare =
      expense.participants.find((participant) => participant.userId === currentUser?.id)
        ?.shareAmount ?? 0;

    return sum + currentUserShare;
  }, 0);

  const pendingTotal = filteredExpenses
    .filter((expense) => expense.settlementStatus === "pending")
    .reduce((sum, expense) => {
      const currentUserShare =
        expense.participants.find((participant) => participant.userId === currentUser?.id)
          ?.shareAmount ?? 0;

      return sum + currentUserShare;
    }, 0);

  const handleOpenAddExpense = () => {
    if (groups.length === 0) {
      showToast({
        variant: "error",
        message: "Create or join a group before adding an expense.",
      });
      return;
    }

    setShowModal(true);
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

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
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
            {t.addExpenseBtn}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            {
              label: t.totalSpent,
              value: formatCurrency(totalSpent, currentUser?.defaultCurrency ?? "USD"),
            },
            {
              label: t.pendingSettlement,
              value: formatCurrency(pendingTotal, currentUser?.defaultCurrency ?? "USD"),
            },
            { label: t.expensesThisMonth, value: `${expenses.length}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#F0FAF5] rounded-2xl p-5 border border-white">
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
                  {t.addExpenseBtn}
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F3F4F6]">
                    {[t.expense, t.group, t.category, t.paidBy, "Total", t.yourShare, t.date, t.status].map((heading) => (
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
                  {filteredExpenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="border-b border-[#F9FAFB] hover:bg-[#FAFAFA] transition-colors"
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
                        {formatDisplayDate(expense.expenseDate)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full ${
                            statusStyles[expense.settlementStatus] ||
                            "bg-[#F3F4F6] text-[#6B7280]"
                          }`}
                          style={{ fontWeight: 500 }}
                        >
                          {toTitleCase(expense.settlementStatus)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {createPortal(
        <AddExpenseModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
          showGroupSelect={true}
          availableGroups={groups}
          currentUserId={currentUser?.id ?? null}
        />,
        document.body,
      )}
    </div>
  );
}
