import { useState } from "react";
import { TrendingUp, TrendingDown, Users, DollarSign, Bell, Search, Plus, ArrowUpRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function Dashboard() {
  const [search, setSearch] = useState("");
  const { t } = useLanguage();

  const summaryCards = [
    { label: t.totalExpenses, value: "$0.00", icon: DollarSign, bg: "bg-[#F0FAF5]", iconBg: "bg-[#7EDDBA]", iconColor: "text-[#065f46]" },
    { label: t.youOwe, value: "$0.00", icon: TrendingDown, bg: "bg-[#FEF2F2]", iconBg: "bg-[#FCA5A5]", iconColor: "text-[#991b1b]" },
    { label: t.youAreOwed, value: "$0.00", icon: TrendingUp, bg: "bg-[#EFF6FF]", iconBg: "bg-[#93C5FD]", iconColor: "text-[#1e40af]" },
    { label: t.activeGroups, value: "0", icon: Users, bg: "bg-[#FEFCE8]", iconBg: "bg-[#FCD34D]", iconColor: "text-[#92400e]" },
  ];

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        <div className="flex items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-[#111827]" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{t.dashboard}</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">{t.welcomeMsg}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder={t.searchExpenses}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-white border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] w-56"
              />
            </div>
            <button className="relative w-9 h-9 bg-white rounded-xl border border-[#E5E7EB] flex items-center justify-center hover:bg-[#F0FAF5] transition-colors">
              <Bell className="w-4 h-4 text-[#6B7280]" />
            </button>
            <div className="w-9 h-9 rounded-xl bg-[#7EDDBA] flex items-center justify-center text-[#065f46] text-xs" style={{ fontWeight: 700 }}>Me</div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {summaryCards.map(({ label, value, icon: Icon, bg, iconBg, iconColor }) => (
            <div key={label} className={`${bg} rounded-2xl p-5 border border-white`}>
              <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${iconColor}`} />
              </div>
              <p className="text-[#111827]" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{value}</p>
              <p className="text-[#6B7280] text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-[#E5E7EB]">
            <h3 className="text-[#111827] mb-1" style={{ fontWeight: 700 }}>{t.expenseChart}</h3>
            <p className="text-[#9CA3AF] text-xs mb-4">{t.monthlyOverview}</p>
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="w-12 h-12 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ArrowUpRight className="w-6 h-6 text-[#7EDDBA]" />
              </div>
              <p className="text-[#374151] text-sm" style={{ fontWeight: 600 }}>{t.noExpensesYet}</p>
              <p className="text-[#9CA3AF] text-xs mt-1">{t.activityDesc}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-[#E5E7EB]">
            <h3 className="text-[#111827] mb-1" style={{ fontWeight: 700 }}>{t.byCategory}</h3>
            <p className="text-[#9CA3AF] text-xs mb-4">{t.thisMonth}</p>
            <div className="flex flex-col items-center justify-center h-36 text-center">
              <div className="w-10 h-10 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-2">
                <DollarSign className="w-5 h-5 text-[#7EDDBA]" />
              </div>
              <p className="text-[#9CA3AF] text-xs">{t.noCategoryData}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 bg-white rounded-2xl p-6 border border-[#E5E7EB]">
            <h3 className="text-[#111827] mb-5" style={{ fontWeight: 700 }}>{t.recentActivity}</h3>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-7 h-7 text-[#7EDDBA]" />
              </div>
              <p className="text-[#374151] text-sm mb-1" style={{ fontWeight: 600 }}>{t.noActivityYet}</p>
              <p className="text-[#9CA3AF] text-xs">{t.activityDesc}</p>
            </div>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB]">
              <h3 className="text-[#111827] mb-4" style={{ fontWeight: 700 }}>{t.quickDebts}</h3>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-[#7EDDBA]" />
                </div>
                <p className="text-[#9CA3AF] text-xs">{t.noOutstandingDebts}</p>
              </div>
            </div>

            <div className="bg-[#16A34A] rounded-2xl p-5 text-white">
              <p className="text-[#A7F3D0] text-sm mb-2" style={{ fontWeight: 600 }}>{t.getStarted}</p>
              <p className="text-white mb-4" style={{ fontSize: "1rem", fontWeight: 700 }}>{t.heroDesc}</p>
              <div className="flex items-center gap-1.5 text-[#A7F3D0] text-xs">
                <Plus className="w-3.5 h-3.5" />
                <span>{t.goToGroups}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
