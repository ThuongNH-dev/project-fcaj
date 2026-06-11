import { useState } from "react";
import { Users, Receipt, Activity, Download, Shield, Search, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function AdminPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const { t } = useLanguage();

  const tabs = [
    { id: "users", label: t.users, icon: Users },
    { id: "uploads", label: t.uploads, icon: Receipt },
    { id: "rejected", label: t.rejectedTx, icon: XCircle },
    { id: "logs", label: t.activityLogs, icon: Activity },
  ];

  const EmptyState = ({ icon: Icon, title, desc }: { icon: typeof Users; title: string; desc: string }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-14 h-14 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-[#7EDDBA]" />
      </div>
      <h3 className="text-[#111827] mb-1" style={{ fontWeight: 700 }}>{title}</h3>
      <p className="text-[#6B7280] text-sm">{desc}</p>
    </div>
  );

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FEE2E2] rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#991b1b]" />
            </div>
            <div>
              <h1 className="text-[#111827]" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{t.adminTitle}</h1>
              <p className="text-[#6B7280] text-sm">{t.adminDesc}</p>
            </div>
          </div>
          <button className="flex items-center gap-2 border border-[#E5E7EB] bg-white text-[#374151] px-4 py-2.5 rounded-xl hover:bg-[#F0FAF5] hover:border-[#7EDDBA] transition-all text-sm" style={{ fontWeight: 600 }}>
            <Download className="w-4 h-4" />
            {t.exportData}
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: t.totalUsers, value: "0", icon: Users, bg: "bg-[#F0FAF5]", iconBg: "bg-[#7EDDBA]" },
            { label: t.totalGroups, value: "0", icon: Activity, bg: "bg-[#EFF6FF]", iconBg: "bg-[#93C5FD]" },
            { label: t.totalExpenses, value: "0", icon: Receipt, bg: "bg-[#FEFCE8]", iconBg: "bg-[#FCD34D]" },
            { label: t.rejectedTx, value: "0", icon: AlertCircle, bg: "bg-[#FEF2F2]", iconBg: "bg-[#FCA5A5]" },
          ].map(({ label, value, icon: Icon, bg, iconBg }) => (
            <div key={label} className={`${bg} rounded-2xl p-5 border border-white`}>
              <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-4 h-4 text-[#065f46]" />
              </div>
              <p className="text-[#111827]" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{value}</p>
              <p className="text-[#6B7280] text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1 mb-5 bg-white border border-[#E5E7EB] rounded-xl p-1 w-fit">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${activeTab === id ? "bg-[#16A34A] text-white shadow-sm" : "text-[#6B7280] hover:text-[#111827]"}`}
              style={{ fontWeight: 500 }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {activeTab === "users" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6] flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input
                  type="text"
                  placeholder={t.searchUsers}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-2 text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA]"
                />
              </div>
            </div>
            <EmptyState icon={Users} title={t.noUsersYet} desc={t.noUsersDesc} />
          </div>
        )}

        {activeTab === "uploads" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>{t.uploadHistory}</h3>
            </div>
            <EmptyState icon={Receipt} title={t.noUploads} desc={t.noUploadsDesc} />
          </div>
        )}

        {activeTab === "rejected" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>{t.rejectedTransactions}</h3>
            </div>
            <EmptyState icon={CheckCircle2} title={t.noRejectedTx} desc={t.noRejectedDesc} />
          </div>
        )}

        {activeTab === "logs" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>{t.systemLogs}</h3>
            </div>
            <EmptyState icon={Activity} title={t.noLogsYet} desc={t.noLogsDesc} />
          </div>
        )}
      </div>
    </div>
  );
}
