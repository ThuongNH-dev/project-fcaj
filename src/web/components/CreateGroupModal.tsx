import { useState } from "react";
import { X, Users, Plus, Trash2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const colorOptions = ["#7EDDBA", "#93C5FD", "#FCA5A5", "#FCD34D", "#C4B5FD", "#F9A8D4"];
const iconOptions = ["✈️", "🏠", "🍕", "🛒", "🎉", "🏋️", "🎵", "🌴"];

export function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [selectedIcon, setSelectedIcon] = useState(iconOptions[0]);
  const [emails, setEmails] = useState<string[]>([""]);
  const { t } = useLanguage();

  if (!isOpen) return null;

  const addEmail = () => setEmails((prev) => [...prev, ""]);
  const removeEmail = (i: number) => setEmails((prev) => prev.filter((_, idx) => idx !== i));
  const updateEmail = (i: number, val: string) => setEmails((prev) => prev.map((e, idx) => (idx === i ? val : e)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E7EB]">
          <div>
            <h2 className="text-[#111827]" style={{ fontWeight: 800, fontSize: "1.125rem" }}>{t.createGroup}</h2>
            <p className="text-[#9CA3AF] text-xs mt-0.5">{t.createGroupDesc}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-[#F9FAFB] flex items-center justify-center text-[#9CA3AF] hover:bg-[#F3F4F6] hover:text-[#374151] transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-sm text-[#374151] mb-1.5" style={{ fontWeight: 600 }}>{t.groupName}</label>
            <input type="text" placeholder={t.groupNamePlaceholder} value={groupName} onChange={(e) => setGroupName(e.target.value)}
              className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent" />
          </div>

          <div>
            <label className="block text-sm text-[#374151] mb-2" style={{ fontWeight: 600 }}>{t.groupIcon}</label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map((icon) => (
                <button key={icon} onClick={() => setSelectedIcon(icon)}
                  className={`w-10 h-10 rounded-xl text-lg transition-all ${selectedIcon === icon ? "bg-[#F0FAF5] ring-2 ring-[#16A34A]" : "bg-[#F9FAFB] hover:bg-[#F0FAF5]"}`}>
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#374151] mb-2" style={{ fontWeight: 600 }}>{t.color}</label>
            <div className="flex gap-2">
              {colorOptions.map((c) => (
                <button key={c} onClick={() => setSelectedColor(c)}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${selectedColor === c ? "ring-2 ring-offset-2 ring-[#16A34A]" : ""}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          {groupName && (
            <div className="bg-[#F6FBF8] rounded-xl p-4 border border-[#E5E7EB] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ background: selectedColor }}>
                {selectedIcon}
              </div>
              <div>
                <p className="text-sm text-[#111827]" style={{ fontWeight: 700 }}>{groupName}</p>
                <p className="text-xs text-[#9CA3AF]">{t.justCreated}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-[#374151] mb-2" style={{ fontWeight: 600 }}>
              <Users className="inline w-3.5 h-3.5 mr-1.5 text-[#9CA3AF]" />
              {t.inviteMembers}
            </label>
            <div className="space-y-2">
              {emails.map((email, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="email" placeholder={`friend${i + 1}@email.com`} value={email} onChange={(e) => updateEmail(i, e.target.value)}
                    className="flex-1 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent" />
                  {emails.length > 1 && (
                    <button onClick={() => removeEmail(i)} className="w-8 h-8 rounded-xl bg-[#FEF2F2] flex items-center justify-center text-[#EF4444] hover:bg-[#FEE2E2] transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button onClick={addEmail} className="mt-2 flex items-center gap-1.5 text-sm text-[#16A34A] hover:underline" style={{ fontWeight: 500 }}>
              <Plus className="w-3.5 h-3.5" />{t.addAnother}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-[#E5E7EB] text-[#374151] text-sm hover:bg-[#F9FAFB] transition-colors" style={{ fontWeight: 600 }}>
            {t.cancel}
          </button>
          <button onClick={onClose} disabled={!groupName.trim()}
            className="flex-1 py-3 rounded-xl bg-[#16A34A] text-white text-sm hover:bg-[#15803d] transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ fontWeight: 600 }}>
            {t.createGroup}
          </button>
        </div>
      </div>
    </div>
  );
}
