import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, Receipt } from "lucide-react";
import { AddExpenseModal, NewExpense } from "./AddExpenseModal";
import { useLanguage } from "../context/LanguageContext";

interface Expense {
  id: number;
  title: string;
  category: string;
  group: string;
  paidBy: string;
  amount: string;
  yourShare: string;
  date: string;
  status: string;
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
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const handleAdd = (expense: NewExpense) => {
    const splitCount = expense.splitWith.length || 1;
    const raw = parseFloat(expense.amount.replace("$", "")) || 0;
    setExpenses((prev) => [{
      id: prev.length + 1,
      title: expense.title,
      category: expense.category,
      group: expense.group ?? "—",
      paidBy: expense.paidBy,
      amount: expense.amount,
      yourShare: `$${(raw / splitCount).toFixed(2)}`,
      date: expense.date,
      status: "Pending",
    }, ...prev]);
  };

  const { t } = useLanguage();
  const filters = [
    { key: "All", label: t.all },
    { key: "Pending", label: t.pending },
    { key: "Settled", label: t.settled },
  ];

  const filtered = expenses.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.group.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "All" || e.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        {/* Header */}
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

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-7">
          {[
            { label: t.totalSpent, value: `$${expenses.reduce((s, e) => s + parseFloat(e.yourShare.replace("$", "")), 0).toFixed(2)}` },
            { label: t.pendingSettlement, value: `$${expenses.filter(e => e.status === "Pending").reduce((s, e) => s + parseFloat(e.yourShare.replace("$", "")), 0).toFixed(2)}` },
            { label: t.expensesThisMonth, value: `${expenses.length}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#F0FAF5] rounded-2xl p-5 border border-white">
              <p className="text-[#111827]" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{value}</p>
              <p className="text-[#6B7280] text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder={t.searchExpensesGroups}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA]"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-xl p-1">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-1.5 rounded-lg text-sm transition-all ${filter === f.key ? "bg-[#16A34A] text-white shadow-sm" : "text-[#6B7280] hover:text-[#111827]"}`}
                style={{ fontWeight: 500 }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table or empty state */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
          {filtered.length === 0 ? (
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
                    {[t.expense, t.group, t.category, t.paidBy, "Total", t.yourShare, t.date, t.status].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap" style={{ fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((e) => (
                    <tr key={e.id} className="border-b border-[#F9FAFB] hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-[#F0FAF5] rounded-xl flex items-center justify-center flex-shrink-0">
                            <Receipt className="w-3.5 h-3.5 text-[#16A34A]" />
                          </div>
                          <span className="text-sm text-[#111827] whitespace-nowrap" style={{ fontWeight: 500 }}>{e.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs bg-[#F0FAF5] text-[#16A34A] px-2.5 py-1 rounded-full whitespace-nowrap" style={{ fontWeight: 500 }}>{e.group}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${catColors[e.category] || "bg-[#F3F4F6] text-[#6B7280]"}`} style={{ fontWeight: 500 }}>
                          {e.category}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-[#374151] whitespace-nowrap" style={{ fontWeight: 500 }}>{e.paidBy}</td>
                      <td className="px-5 py-3.5 text-sm text-[#6B7280]" style={{ fontWeight: 500 }}>{e.amount}</td>
                      <td className="px-5 py-3.5 text-sm text-[#111827]" style={{ fontWeight: 700 }}>{e.yourShare}</td>
                      <td className="px-5 py-3.5 text-xs text-[#9CA3AF] whitespace-nowrap">{e.date}</td>
                      <td className="px-5 py-3.5">
                        <span className={`text-xs px-2.5 py-1 rounded-full ${statusStyles[e.status] || "bg-[#F3F4F6] text-[#6B7280]"}`} style={{ fontWeight: 500 }}>
                          {e.status}
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
        />,
        document.body
      )}
    </div>
  );
}
