import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, Receipt } from "lucide-react";
import {
  AddExpenseModal,
  type ExpenseGroupOption,
  NewExpense,
} from "./AddExpenseModal";
import { useLanguage } from "../context/LanguageContext";
import {
  createExpense,
  getExpenses,
  type ExpenseRecord,
} from "../api/expenses";
import { getGroups } from "../api/groups";
import {
  getReceiptPublicUrl,
  hasReceiptPublicBaseUrl,
  uploadReceiptFile,
  type ReceiptUpload,
} from "../api/receipts";
import { useFeedback } from "./ui/FeedbackProvider";

interface Expense extends ExpenseRecord {
  receipt: ReceiptUpload | null;
}

const catColors: Record<string, string> = {
  Food: "bg-[#D1FAE5] text-[#065f46]",
  Travel: "bg-[#DBEAFE] text-[#1e40af]",
  Entertainment: "bg-[#FCE7F3] text-[#9d174d]",
  Rent: "bg-[#FEF3C7] text-[#92400e]",
  Shopping: "bg-[#EDE9FE] text-[#4c1d95]",
};

const statusStyles: Record<string, string> = {
  Settled: "bg-[#D1FAE5] text-[#065f46]",
  Pending: "bg-[#FEF3C7] text-[#92400e]",
};

export function ExpensesPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [groupOptions, setGroupOptions] = useState<ExpenseGroupOption[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { t } = useLanguage();
  const { showToast } = useFeedback();
  const canRenderReceiptPreview = hasReceiptPublicBaseUrl();

  useEffect(() => {
    let isMounted = true;

    async function loadExpenses() {
      try {
        setIsLoading(true);
        setErrorMessage("");
        const [expensesResponse, groupsResponse] = await Promise.all([
          getExpenses(),
          getGroups(),
        ]);

        if (isMounted) {
          setExpenses(expensesResponse.expenses ?? []);
          setGroupOptions(
            (groupsResponse.groups ?? []).map((group) => ({
              id: group.id,
              name: group.name,
            })),
          );
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load expenses.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadExpenses();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAdd = async (expense: NewExpense) => {
    let uploadedReceipt: ReceiptUpload | null = null;

    if (expense.receiptFile) {
      uploadedReceipt = await uploadReceiptFile({
        file: expense.receiptFile,
        groupId: expense.groupId,
      });
    }

    const splitCount = expense.splitWith.length || 1;
    const raw = parseFloat(expense.amount.replace("$", "")) || 0;
    const createExpenseResponse = await createExpense({
      title: expense.title,
      category: expense.category,
      paidBy: expense.paidBy,
      amount: expense.amount,
      yourShare: `$${(raw / splitCount).toFixed(2)}`,
      date: expense.date,
      status: "Pending",
      groupId: expense.groupId,
      groupName: expense.groupName,
      receiptId: uploadedReceipt?.id,
    });

    if (!createExpenseResponse.expense) {
      throw new Error("Expense record was not returned.");
    }

    setExpenses((prev) => [createExpenseResponse.expense!, ...prev]);
    showToast({
      variant: "success",
      message: expense.receiptFile
        ? "Expense and receipt added successfully."
        : "Expense added successfully.",
    });
  };

  const filters = [
    { key: "All", label: t.all },
    { key: "Pending", label: t.pending },
    { key: "Settled", label: t.settled },
  ];

  const filtered = expenses.filter((expense) => {
    const keyword = search.trim().toLowerCase();
    const matchSearch =
      !keyword ||
      expense.title.toLowerCase().includes(keyword) ||
      (expense.groupName ?? "").toLowerCase().includes(keyword);
    const matchFilter = filter === "All" || expense.status === filter;

    return matchSearch && matchFilter;
  });

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-[#111827]" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{t.expensesTitle}</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">{expenses.length} {expenses.length !== 1 ? t.expensesTotal : t.expenseTotal}</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#16A34A] text-white px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-all shadow-sm"
            style={{ fontWeight: 600, fontSize: "0.875rem" }}
          >
            <Plus className="w-4 h-4" />
            {t.addExpenseBtn}
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            { label: t.totalSpent, value: `$${expenses.reduce((sum, expense) => sum + parseFloat(expense.yourShare.replace("$", "")), 0).toFixed(2)}` },
            { label: t.pendingSettlement, value: `$${expenses.filter((expense) => expense.status === "Pending").reduce((sum, expense) => sum + parseFloat(expense.yourShare.replace("$", "")), 0).toFixed(2)}` },
            { label: t.expensesThisMonth, value: `${expenses.length}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#F0FAF5] rounded-2xl p-5 border border-white">
              <p className="text-[#111827]" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{value}</p>
              <p className="text-[#6B7280] text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

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
            {filters.map((currentFilter) => (
              <button
                key={currentFilter.key}
                onClick={() => setFilter(currentFilter.key)}
                className={`px-4 py-1.5 rounded-lg text-sm transition-all ${filter === currentFilter.key ? "bg-[#16A34A] text-white shadow-sm" : "text-[#6B7280] hover:text-[#111827]"}`}
                style={{ fontWeight: 500 }}
              >
                {currentFilter.label}
              </button>
            ))}
          </div>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
            {errorMessage}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          {isLoading ? (
            <div className="px-5 py-8 text-sm text-[#6B7280]">
              Loading expenses...
            </div>
          ) : filtered.length === 0 ? (
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
                  onClick={() => setShowModal(true)}
                  className="flex items-center gap-2 bg-[#16A34A] text-white px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-colors"
                  style={{ fontWeight: 600, fontSize: "0.875rem" }}
                >
                  <Plus className="w-4 h-4" />
                  Add Expense
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F3F4F6]">
                    {[t.expense, t.group, t.category, t.paidBy, "Total", t.yourShare, t.date, t.status].map((heading) => (
                      <th key={heading} className="text-left px-5 py-3 text-xs text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap" style={{ fontWeight: 600 }}>{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((expense) => {
                    const receiptPublicUrl = getReceiptPublicUrl(expense.receipt);

                    return (
                      <tr key={expense.id} className="border-b border-[#F9FAFB] hover:bg-[#FAFAFA] transition-colors align-top">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-[#F0FAF5] rounded-xl flex items-center justify-center flex-shrink-0">
                              <Receipt className="w-3.5 h-3.5 text-[#16A34A]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-[#111827] whitespace-nowrap" style={{ fontWeight: 500 }}>
                                {expense.title}
                              </p>
                              {expense.receipt && (
                                <div className="mt-2">
                                  <p className="text-xs text-[#16A34A] truncate" style={{ fontWeight: 500 }}>
                                    Receipt saved: {expense.receipt.originalFileName}
                                  </p>
                                  {expense.receipt.fileKind === "image" && canRenderReceiptPreview && receiptPublicUrl && (
                                    <a
                                      href={receiptPublicUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-2 block"
                                    >
                                      <img
                                        src={receiptPublicUrl}
                                        alt={expense.receipt.originalFileName}
                                        className="h-20 w-20 rounded-xl border border-[#D1FAE5] object-cover shadow-sm"
                                        loading="lazy"
                                      />
                                    </a>
                                  )}
                                  {expense.receipt.fileKind === "pdf" && canRenderReceiptPreview && receiptPublicUrl && (
                                    <a
                                      href={receiptPublicUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="mt-1 inline-flex text-xs text-[#16A34A] hover:text-[#15803d]"
                                      style={{ fontWeight: 600 }}
                                    >
                                      Open PDF receipt
                                    </a>
                                  )}
                                  {!canRenderReceiptPreview && (
                                    <p className="mt-1 text-xs text-[#9CA3AF]">
                                      Set `VITE_RECEIPTS_PUBLIC_BASE_URL` to preview this receipt.
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs bg-[#F0FAF5] text-[#16A34A] px-2.5 py-1 rounded-full whitespace-nowrap" style={{ fontWeight: 500 }}>{expense.groupName ?? "â€”"}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-full ${catColors[expense.category] || "bg-[#F3F4F6] text-[#6B7280]"}`} style={{ fontWeight: 500 }}>
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#374151] whitespace-nowrap" style={{ fontWeight: 500 }}>{expense.paidBy}</td>
                        <td className="px-5 py-3.5 text-sm text-[#6B7280]" style={{ fontWeight: 500 }}>{expense.amount}</td>
                        <td className="px-5 py-3.5 text-sm text-[#111827]" style={{ fontWeight: 700 }}>{expense.yourShare}</td>
                        <td className="px-5 py-3.5 text-xs text-[#9CA3AF] whitespace-nowrap">{expense.date}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2.5 py-1 rounded-full ${statusStyles[expense.status] || "bg-[#F3F4F6] text-[#6B7280]"}`} style={{ fontWeight: 500 }}>
                            {expense.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
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
          groupOptions={groupOptions}
        />,
        document.body,
      )}
    </div>
  );
}
