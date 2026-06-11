import { useState } from "react";
import { User, Bell, Shield, CreditCard, Palette, ChevronRight, Check, Camera, Trash2, LogOut } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface SettingsPageProps {
  onNavigate: (page: string) => void;
}

export function SettingsPage({ onNavigate }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [currency, setCurrency] = useState("USD — US Dollar");
  const { t } = useLanguage();

  const [notifs, setNotifs] = useState({
    expenseAdded: false, paymentReceived: false, settlementReminder: false,
    weeklyDigest: false, groupInvites: false, marketingEmails: false,
  });

  const handleSave = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "?";

  const tabs = [
    { id: "profile", label: t.profile, icon: User },
    { id: "notifications", label: t.notifications, icon: Bell },
    { id: "security", label: t.security, icon: Shield },
    { id: "billing", label: t.billing, icon: CreditCard },
    { id: "appearance", label: t.appearance, icon: Palette },
  ];

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-5xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        <div className="mb-8">
          <h1 className="text-[#111827]" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{t.settingsTitle}</h1>
          <p className="text-[#6B7280] text-sm mt-0.5">{t.settingsDesc}</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-0.5 last:mb-0 ${activeTab === id ? "bg-[#F0FAF5] text-[#16A34A]" : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"}`}
                  style={{ fontWeight: activeTab === id ? 600 : 500 }}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${activeTab === id ? "text-[#16A34A]" : "text-[#9CA3AF]"}`} />
                  {label}
                  {activeTab === id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                </button>
              ))}
              <div className="border-t border-[#E5E7EB] mt-2 pt-2">
                <button
                  onClick={() => onNavigate("landing")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  <LogOut className="w-4 h-4" />
                  {t.signOut}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <h2 className="text-[#111827] mb-5" style={{ fontWeight: 700, fontSize: "1rem" }}>{t.profileInfo}</h2>
                <div className="flex items-center gap-5 mb-7 pb-6 border-b border-[#F3F4F6]">
                  <div className="relative">
                    <div className="rounded-2xl bg-[#7EDDBA] flex items-center justify-center text-[#065f46]" style={{ fontWeight: 800, fontSize: "1.25rem", width: "4.5rem", height: "4.5rem" }}>
                      {initials}
                    </div>
                    <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#16A34A] rounded-xl flex items-center justify-center shadow-sm">
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                  <div>
                    <p className="text-[#374151] text-sm" style={{ fontWeight: 600 }}>{firstName || lastName ? `${firstName} ${lastName}`.trim() : "—"}</p>
                    <p className="text-[#9CA3AF] text-xs mt-0.5">{email || "—"}</p>
                    <button className="text-xs text-[#EF4444] mt-1.5 hover:underline flex items-center gap-1" style={{ fontWeight: 500 }}>
                      <Trash2 className="w-3 h-3" />{t.removePhoto}
                    </button>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label className="block text-sm text-[#374151] mb-1.5" style={{ fontWeight: 600 }}>{t.firstName}</label>
                    <input type="text" placeholder={t.firstNamePlaceholder} value={firstName} onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent" />
                  </div>
                  <div>
                    <label className="block text-sm text-[#374151] mb-1.5" style={{ fontWeight: 600 }}>{t.lastName}</label>
                    <input type="text" placeholder={t.lastNamePlaceholder} value={lastName} onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent" />
                  </div>
                </div>

                <div className="mb-5">
                  <label className="block text-sm text-[#374151] mb-1.5" style={{ fontWeight: 600 }}>{t.emailAddress}</label>
                  <input type="email" placeholder={t.emailPlaceholder} value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent" />
                </div>

                <div className="mb-5">
                  <label className="block text-sm text-[#374151] mb-1.5" style={{ fontWeight: 600 }}>{t.bio}</label>
                  <textarea rows={3} placeholder={t.bioPaceholder} value={bio} onChange={(e) => setBio(e.target.value)}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent resize-none" />
                </div>

                <div className="mb-6">
                  <label className="block text-sm text-[#374151] mb-1.5" style={{ fontWeight: 600 }}>{t.defaultCurrency}</label>
                  <select value={currency} onChange={(e) => setCurrency(e.target.value)}
                    className="w-full sm:w-56 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] appearance-none">
                    <option>USD — US Dollar</option>
                    <option>VND — Vietnamese Dong</option>
                  </select>
                </div>

                <button onClick={handleSave}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm ${saved ? "bg-[#D1FAE5] text-[#16A34A]" : "bg-[#16A34A] text-white hover:bg-[#15803d]"}`}
                  style={{ fontWeight: 600 }}>
                  {saved ? <><Check className="w-4 h-4" />{t.saved}</> : t.saveChanges}
                </button>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <h2 className="text-[#111827] mb-5" style={{ fontWeight: 700, fontSize: "1rem" }}>{t.notificationPrefs}</h2>
                <div>
                  {([
                    { key: "expenseAdded", label: t.expenseAdded, desc: t.expenseAddedDesc },
                    { key: "paymentReceived", label: t.paymentReceived, desc: t.paymentReceivedDesc },
                    { key: "settlementReminder", label: t.settlementReminder, desc: t.settlementReminderDesc },
                    { key: "weeklyDigest", label: t.weeklyDigest, desc: t.weeklyDigestDesc },
                    { key: "groupInvites", label: t.groupInvitesLabel, desc: t.groupInvitesDesc },
                    { key: "marketingEmails", label: t.marketingEmails, desc: t.marketingEmailsDesc },
                  ] as { key: keyof typeof notifs; label: string; desc: string }[]).map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-4 border-b border-[#F3F4F6] last:border-0">
                      <div>
                        <p className="text-sm text-[#111827]" style={{ fontWeight: 600 }}>{label}</p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">{desc}</p>
                      </div>
                      <button
                        onClick={() => setNotifs((prev) => ({ ...prev, [key]: !prev[key] }))}
                        className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${notifs[key] ? "bg-[#16A34A]" : "bg-[#D1D5DB]"}`}
                      >
                        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifs[key] ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                  <h2 className="text-[#111827] mb-5" style={{ fontWeight: 700, fontSize: "1rem" }}>{t.changePassword}</h2>
                  <div className="space-y-4 max-w-sm">
                    {[t.currentPassword, t.newPassword, t.confirmNewPassword].map((label) => (
                      <div key={label}>
                        <label className="block text-sm text-[#374151] mb-1.5" style={{ fontWeight: 600 }}>{label}</label>
                        <input type="password" placeholder="••••••••"
                          className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent" />
                      </div>
                    ))}
                    <button className="bg-[#16A34A] text-white px-6 py-2.5 rounded-xl text-sm hover:bg-[#15803d] transition-colors" style={{ fontWeight: 600 }}>
                      {t.updatePassword}
                    </button>
                  </div>
                </div>
                <div className="bg-[#FEF2F2] rounded-2xl border border-[#FEE2E2] p-6">
                  <h2 className="text-[#991b1b] mb-1" style={{ fontWeight: 700, fontSize: "1rem" }}>{t.dangerZone}</h2>
                  <p className="text-[#6B7280] text-sm mb-4">{t.dangerZoneDesc}</p>
                  <button className="flex items-center gap-2 bg-white text-[#EF4444] border border-[#FCA5A5] px-4 py-2.5 rounded-xl text-sm hover:bg-[#FEF2F2] transition-colors" style={{ fontWeight: 600 }}>
                    <Trash2 className="w-4 h-4" />{t.deleteAccount}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h2 className="text-[#111827]" style={{ fontWeight: 700, fontSize: "1rem" }}>{t.currentPlan}</h2>
                      <p className="text-[#6B7280] text-sm mt-0.5">{t.onFreePlan}</p>
                    </div>
                    <span className="bg-[#F3F4F6] text-[#6B7280] text-xs px-3 py-1.5 rounded-full" style={{ fontWeight: 600 }}>{t.free}</span>
                  </div>
                  <div className="bg-[#F6FBF8] rounded-xl p-4 border border-[#E5E7EB] mb-5">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {[
                        { label: t.groupsUsed, used: `0 / 3 ${t.groupsUsed}` },
                        { label: t.expensesUsed, used: `0 / 10` },
                        { label: t.membersLabel, used: t.unlimited },
                        { label: t.receiptScan, used: t.notIncluded },
                      ].map(({ label, used }) => (
                        <div key={label}>
                          <p className="text-[#9CA3AF] text-xs">{label}</p>
                          <p className="text-[#111827] mt-0.5" style={{ fontWeight: 600 }}>{used}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button className="bg-[#16A34A] text-white px-6 py-2.5 rounded-xl text-sm hover:bg-[#15803d] transition-colors shadow-sm" style={{ fontWeight: 600 }}>
                    {t.upgradePro}
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                  <h2 className="text-[#111827] mb-4" style={{ fontWeight: 700, fontSize: "1rem" }}>{t.paymentMethod}</h2>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-6 h-6 text-[#7EDDBA]" />
                    </div>
                    <p className="text-[#374151] text-sm mb-1" style={{ fontWeight: 600 }}>{t.noPaymentMethod}</p>
                    <p className="text-[#9CA3AF] text-xs mb-4">{t.noPaymentDesc}</p>
                    <button className="text-sm text-[#16A34A] hover:underline" style={{ fontWeight: 600 }}>{t.addPaymentMethod}</button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <h2 className="text-[#111827] mb-5" style={{ fontWeight: 700, fontSize: "1rem" }}>{t.appearanceTitle}</h2>
                <div className="mb-6">
                  <p className="text-sm text-[#374151] mb-3" style={{ fontWeight: 600 }}>{t.theme}</p>
                  <div className="grid grid-cols-3 gap-3 max-w-xs">
                    {[
                      { label: t.light, bg: "#F6FBF8", selected: true },
                      { label: t.dark, bg: "#111827", selected: false },
                      { label: t.system, bg: "linear-gradient(135deg, #F6FBF8 50%, #111827 50%)", selected: false },
                    ].map(({ label, bg, selected }) => (
                      <button key={label} className={`rounded-xl border-2 p-3 text-center transition-all ${selected ? "border-[#16A34A]" : "border-[#E5E7EB] hover:border-[#7EDDBA]"}`}>
                        <div className="w-full h-10 rounded-lg mb-2" style={{ background: bg }} />
                        <p className="text-xs text-[#374151]" style={{ fontWeight: 500 }}>{label}</p>
                        {selected && <Check className="w-3.5 h-3.5 text-[#16A34A] mx-auto mt-1" />}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <p className="text-sm text-[#374151] mb-3" style={{ fontWeight: 600 }}>{t.accentColor}</p>
                  <div className="flex items-center gap-3">
                    {["#16A34A", "#2563EB", "#7C3AED", "#DB2777", "#D97706", "#DC2626"].map((color) => (
                      <button key={color} className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${color === "#16A34A" ? "ring-2 ring-offset-2 ring-[#16A34A]" : ""}`} style={{ background: color }} />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[#374151] mb-3" style={{ fontWeight: 600 }}>{t.density}</p>
                  <div className="flex items-center gap-2">
                    {[t.compact, t.default, t.comfortable].map((d) => (
                      <button key={d} className={`px-4 py-2 rounded-xl border text-sm transition-all ${d === t.default ? "bg-[#F0FAF5] border-[#7EDDBA] text-[#16A34A]" : "border-[#E5E7EB] text-[#6B7280] hover:border-[#7EDDBA]"}`} style={{ fontWeight: 500 }}>{d}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
