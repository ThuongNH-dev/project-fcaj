import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Search, Users } from "lucide-react";
import { CreateGroupModal } from "./CreateGroupModal";
import { useLanguage } from "../context/LanguageContext";

interface GroupsPageProps {
  onNavigate: (page: string) => void;
}

export function GroupsPage({ onNavigate }: GroupsPageProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { t } = useLanguage();

  const filters = [
    { key: "all", label: t.all },
    { key: "active", label: t.active },
    { key: "settled", label: t.settled },
    { key: "pending", label: t.pending },
  ];

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-[#111827]" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{t.groupsTitle}</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">0 {t.groupsTotal}</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#16A34A] text-white px-5 py-2.5 rounded-xl hover:bg-[#15803d] transition-all shadow-sm"
            style={{ fontWeight: 600, fontSize: "0.875rem" }}
          >
            <Plus className="w-4 h-4" />
            {t.newGroup}
          </button>
        </div>

        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder={t.searchGroups}
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

        <div className="flex flex-col items-center justify-center py-28 text-center">
          <div className="w-20 h-20 bg-[#F0FAF5] rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Users className="w-10 h-10 text-[#7EDDBA]" />
          </div>
          <h3 className="text-[#111827] mb-2" style={{ fontWeight: 700, fontSize: "1.125rem" }}>{t.noGroupsYet}</h3>
          <p className="text-[#6B7280] text-sm mb-8 max-w-xs">{t.noGroupsDesc}</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-[#16A34A] text-white px-6 py-3 rounded-xl hover:bg-[#15803d] transition-colors shadow-sm"
            style={{ fontWeight: 600 }}
          >
            <Plus className="w-4 h-4" />
            {t.createFirstGroup}
          </button>
        </div>

        {createPortal(
          <CreateGroupModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />,
          document.body
        )}
      </div>
    </div>
  );
}
