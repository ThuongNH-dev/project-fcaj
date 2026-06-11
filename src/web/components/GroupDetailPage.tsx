import { useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Plus, Users, DollarSign, TrendingUp, Receipt } from "lucide-react";
import { AddExpenseModal, NewExpense } from "./AddExpenseModal";
import { useLanguage } from "../context/LanguageContext";

interface GroupDetailPageProps {
  onNavigate: (page: string) => void;
  onOpenModal: () => void;
}

interface Expense {
  id: number;
  title: string;
  category: string;
  paidBy: string;
  amount: string;
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

export function GroupDetailPage({ onNavigate, onOpenModal }: GroupDetailPageProps) {
  const [activeCategory, setActiveCategory] = useState("All");
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { t } = useLanguage();

  const handleAddExpense = (expense: NewExpense) => {
    setExpenses((prev) => [
      {
        id: prev.length + 1,
        title: expense.title,
        category: expense.category,
        paidBy: expense.paidBy,
        amount: expense.amount,
        date: expense.date,
        status: "Pending",
      },
      ...prev,
    ]);
  };

  const categories = ["All", "Food", "Travel", "Entertainment"];

  const filteredExpenses = activeCategory === "All"
    ? expenses
    : expenses.filter((e) => e.category === activeCategory);

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        {/* Back + header */}
        <div className="mb-6">
          <button
            onClick={() => onNavigate("groups")}
            className="flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#111827] mb-4 transition-colors"
            style={{ fontWeight: 500 }}
          >
            <ArrowLeft className="w-4 h-4" />
            {t.backToGroups}
          </button>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-[#111827] mb-1" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{t.groupsTitle}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs bg-[#D1FAE5] text-[#065f46] px-2.5 py-1 rounded-full" style={{ fontWeight: 600 }}>{t.active}</span>
              </div>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2 bg-[#16A34A] text-white px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-all shadow-sm"
              style={{ fontWeight: 600, fontSize: "0.875rem" }}
            >
              <Plus className="w-4 h-4" />
              {t.addExpense}
            </button>
          </div>
        </div>

        {/* Balance summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
          {[
            { label: t.totalExpenses, value: "$0.00", icon: DollarSign, bg: "bg-[#F0FAF5]", iconBg: "bg-[#7EDDBA]" },
            { label: t.yourShare, value: "$0.00", icon: Users, bg: "bg-[#EFF6FF]", iconBg: "bg-[#93C5FD]" },
            { label: t.youPaid, value: "$0.00", icon: TrendingUp, bg: "bg-[#FEFCE8]", iconBg: "bg-[#FCD34D]" },
            { label: t.youAreOwed, value: "$0.00", icon: TrendingUp, bg: "bg-[#F0FDF4]", iconBg: "bg-[#4ADE80]" },
          ].map(({ label, value, icon: Icon, bg, iconBg }) => (
            <div key={label} className={`${bg} rounded-2xl p-4 border border-white`}>
              <div className={`w-8 h-8 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4 text-[#065f46]" />
              </div>
              <p className="text-[#111827]" style={{ fontWeight: 700, fontSize: "1.25rem" }}>{value}</p>
              <p className="text-[#6B7280] text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Expenses table */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>{t.expenses}</h3>
                <div className="flex items-center gap-1">
                  {categories.map((c) => (
                    <button
                      key={c}
                      onClick={() => setActiveCategory(c)}
                      className={`px-3 py-1 rounded-full text-xs transition-all ${activeCategory === c ? "bg-[#16A34A] text-white" : "bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]"}`}
                      style={{ fontWeight: 500 }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {filteredExpenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                  <div className="w-12 h-12 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Receipt className="w-6 h-6 text-[#7EDDBA]" />
                  </div>
                  <p className="text-[#374151] text-sm mb-1" style={{ fontWeight: 600 }}>{t.noExpensesInGroup}</p>
                  <p className="text-[#9CA3AF] text-xs mb-4">{t.addExpensePrompt}</p>
                  <button
                    onClick={() => setShowExpenseModal(true)}
                    className="flex items-center gap-2 bg-[#16A34A] text-white px-4 py-2 rounded-xl text-sm hover:bg-[#15803d] transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t.addExpense}
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#F3F4F6]">
                        {[t.expense, t.category, t.paidBy, t.amount, t.date, t.status].map((h) => (
                          <th key={h} className="text-left px-5 py-3 text-xs text-[#9CA3AF] uppercase tracking-wider" style={{ fontWeight: 600 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredExpenses.map((e) => (
                        <tr key={e.id} className="border-b border-[#F9FAFB] hover:bg-[#FAFAFA] transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 bg-[#F0FAF5] rounded-lg flex items-center justify-center">
                                <Receipt className="w-3.5 h-3.5 text-[#16A34A]" />
                              </div>
                              <span className="text-sm text-[#111827]" style={{ fontWeight: 500 }}>{e.title}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={`text-xs px-2.5 py-1 rounded-full ${catColors[e.category] || "bg-[#F3F4F6] text-[#6B7280]"}`} style={{ fontWeight: 500 }}>
                              {e.category}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-[#374151]" style={{ fontWeight: 500 }}>{e.paidBy}</td>
                          <td className="px-5 py-3.5 text-sm text-[#111827]" style={{ fontWeight: 700 }}>{e.amount}</td>
                          <td className="px-5 py-3.5 text-xs text-[#9CA3AF]">{e.date}</td>
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

          {/* Right sidebar */}
          <div className="space-y-5">
            {/* Member balances */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB]">
              <h3 className="text-[#111827] mb-4" style={{ fontWeight: 700 }}>{t.memberBalances}</h3>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 text-[#7EDDBA]" />
                </div>
                <p className="text-[#9CA3AF] text-xs">{t.noMembersYet}</p>
              </div>
            </div>

            {/* Who owes whom */}
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB]">
              <h3 className="text-[#111827] mb-4" style={{ fontWeight: 700 }}>{t.whoOwesWhom}</h3>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-[#9CA3AF] text-xs">{t.noDebts}</p>
              </div>
              <button
                onClick={() => onNavigate("settlement")}
                className="w-full mt-2 bg-[#16A34A] text-white py-2.5 rounded-xl text-sm hover:bg-[#15803d] transition-colors"
                style={{ fontWeight: 600 }}
              >
                {t.goToSettlements}
              </button>
            </div>

            {/* Receipts */}
            <div className="bg-[#F0FAF5] rounded-2xl p-5 border border-[#D1FAE5]">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="w-4 h-4 text-[#16A34A]" />
                <h3 className="text-[#111827] text-sm" style={{ fontWeight: 700 }}>Receipts</h3>
              </div>
              <p className="text-[#6B7280] text-xs">{t.noReceiptsYet}</p>
            </div>
          </div>
        </div>
      </div>

      {createPortal(
        <AddExpenseModal isOpen={showExpenseModal} onClose={() => setShowExpenseModal(false)} onAdd={handleAddExpense} />,
        document.body
      )}
    </div>
  );
}
