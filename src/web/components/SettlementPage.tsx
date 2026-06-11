import { CheckCircle2, TrendingUp, DollarSign, Users } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export function SettlementPage() {
  const { t } = useLanguage();
  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-[#111827]" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{t.settlementsTitle}</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">{t.settlementsDesc}</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: t.youAreOwedLabel, value: "$0.00", icon: TrendingUp, bg: "bg-[#F0FAF5]", iconBg: "bg-[#7EDDBA]" },
            { label: t.youOweLabel, value: "$0.00", icon: DollarSign, bg: "bg-[#FEF2F2]", iconBg: "bg-[#FCA5A5]" },
            { label: t.settledThisMonth, value: "$0.00", icon: CheckCircle2, bg: "bg-[#EFF6FF]", iconBg: "bg-[#93C5FD]" },
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

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-5 py-4 border-b border-[#F3F4F6]">
                <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>{t.pendingSettlements}</h3>
              </div>
              <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                <div className="w-16 h-16 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-[#7EDDBA]" />
                </div>
                <h3 className="text-[#111827] mb-1" style={{ fontWeight: 700 }}>{t.allClear}</h3>
                <p className="text-[#6B7280] text-sm">{t.noSettlementsDesc}</p>
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-5 border border-[#E5E7EB]">
              <h3 className="text-[#111827] mb-4" style={{ fontWeight: 700 }}>{t.settlementTimeline}</h3>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-10 h-10 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Users className="w-5 h-5 text-[#7EDDBA]" />
                </div>
                <p className="text-[#9CA3AF] text-xs">{t.noActivityLogged}</p>
              </div>
            </div>

            <div className="bg-[#16A34A] rounded-2xl p-5 text-white">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-[#A7F3D0]" />
                <span className="text-[#A7F3D0] text-sm" style={{ fontWeight: 600 }}>{t.netPosition}</span>
              </div>
              <p className="text-white mb-1" style={{ fontSize: "1.75rem", fontWeight: 800 }}>$0.00</p>
              <p className="text-[#A7F3D0] text-xs">{t.addExpensesToSeeBalance}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
