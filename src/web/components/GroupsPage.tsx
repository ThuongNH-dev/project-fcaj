import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Plus, Search, Users } from "lucide-react";
import { CreateGroupModal } from "./CreateGroupModal";
import { useLanguage } from "../context/LanguageContext";
import { getGroups, type Group } from "../api/groups";
import { getStoredUser } from "../api/auth";

interface GroupsPageProps {
  onNavigate: (page: string) => void;
  onSelectGroup: (groupId: string) => void;
}

export function GroupsPage({ onNavigate, onSelectGroup }: GroupsPageProps) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { t } = useLanguage();

  const filters = [
    { key: "all", label: t.all },
    { key: "active", label: t.active },
    { key: "settled", label: t.settled },
    { key: "pending", label: t.pending },
  ];

  const loadGroups = async () => {
    try {
      setErrorMessage("");
      setIsLoadingGroups(true);

      const response = await getGroups();
      setGroups(response.groups ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load groups.",
      );
    } finally {
      setIsLoadingGroups(false);
    }
  };

  useEffect(() => {
    void loadGroups();
  }, []);

  const filteredGroups = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return groups.filter((group) => {
      if (normalizedSearch && !group.name.toLowerCase().includes(normalizedSearch)) {
        return false;
      }

      if (filter === "all" || filter === "active") {
        return true;
      }

      return false;
    });
  }, [filter, groups, search]);

  const formatRelativeTime = (value: string) => {
    const now = Date.now();
    const timestamp = new Date(value).getTime();
    const diffMs = Math.max(now - timestamp, 0);
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return "Just now";
    }

    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }

    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return new Date(value).toLocaleDateString();
  };

  const avatarPalette = ["#7EDDBA", "#93C5FD", "#FCA5A5", "#FCD34D", "#C4B5FD"];

  const currentUser = getStoredUser();

  const buildMemberBadges = (group: Group) => {
    return group.members.slice(0, 4).map((member, index) => ({
      key: `${group.id}-${member.name}-${index}`,
      label:
        member.name
          .split(" ")
          .map((part) => part.charAt(0))
          .join("")
          .slice(0, 2)
          .toUpperCase() || (member.role === "owner" ? "OW" : "MB"),
      color: avatarPalette[index % avatarPalette.length],
    }));
  };

  const statusStyles: Record<string, string> = {
    Active: "bg-[#D1FAE5] text-[#065f46]",
    Settled: "bg-[#F3F4F6] text-[#6B7280]",
    Pending: "bg-[#FEF3C7] text-[#92400e]",
  };

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-7xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-[#111827]" style={{ fontSize: "1.5rem", fontWeight: 800 }}>{t.groupsTitle}</h1>
            <p className="text-[#6B7280] text-sm mt-0.5">{groups.length} {t.groupsTotal}</p>
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

        {errorMessage && (
          <div className="rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-5 py-4 text-sm text-[#B91C1C] mb-6">
            {errorMessage}
          </div>
        )}

        {isLoadingGroups ? (
          <div className="flex flex-col items-center justify-center py-28 text-center">
            <div className="w-20 h-20 bg-[#F0FAF5] rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-[#7EDDBA]" />
            </div>
            <p className="text-[#6B7280] text-sm">Loading groups...</p>
          </div>
        ) : filteredGroups.length === 0 ? (
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
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredGroups.map((group) => {
              const yourBalance = "+$0.00";
              const isPositive = yourBalance.startsWith("+");
              const isZero = yourBalance === "$0.00";
              const status = "Active";

              return (
                <button
                  key={group.id}
                  onClick={() => {
                    onSelectGroup(group.id);
                    onNavigate("group-detail");
                  }}
                  className="bg-white rounded-2xl p-5 border border-[#E5E7EB] hover:shadow-md hover:-translate-y-0.5 transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ background: group.color }}
                      >
                        {group.icon}
                      </div>
                      <div className="min-w-0">
                        <h3
                          className="text-[#111827] leading-tight truncate"
                          style={{ fontWeight: 700 }}
                        >
                          {group.name}
                        </h3>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">
                          {formatRelativeTime(group.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full ${statusStyles[status]}`}
                      style={{ fontWeight: 600 }}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex -space-x-2">
                      {buildMemberBadges(group).map((member, index) => (
                        <div
                          key={member.key}
                          className="w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px]"
                          style={{
                            background: member.color,
                            color: "#065f46",
                            fontWeight: 700,
                            zIndex: 4 - index,
                          }}
                        >
                          {member.label[0]}
                        </div>
                      ))}
                    </div>
                    <span className="text-xs text-[#9CA3AF]">
                      {group.members.length} {t.members}
                    </span>
                  </div>

                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-[#9CA3AF] mb-0.5">
                        {t.totalExpensesLabel}
                      </p>
                      <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                        $0.00
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#9CA3AF] mb-0.5">
                        {t.yourBalance}
                      </p>
                      <p
                        style={{ fontWeight: 700 }}
                        className={
                          isZero
                            ? "text-[#6B7280]"
                            : isPositive
                              ? "text-[#16A34A]"
                              : "text-[#EF4444]"
                        }
                      >
                        {yourBalance}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#F3F4F6] flex items-center justify-between">
                    <span className="text-xs text-[#9CA3AF]" style={{ fontWeight: 500 }}>
                      {t.viewExpenses}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#16A34A] transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {createPortal(
          <CreateGroupModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreated={loadGroups}
          />,
          document.body
        )}
      </div>
    </div>
  );
}
