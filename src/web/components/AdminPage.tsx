import { useEffect, useState } from "react";
import {
  Users,
  Receipt,
  Activity,
  Download,
  Shield,
  Search,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  deleteAdminGroup,
  getAdminDashboard,
  getAdminGroup,
  getAdminGroups,
  type AdminDashboardStats,
} from "../api/admin";
import type { Group } from "../api/groups";
import { useFeedback } from "./ui/FeedbackProvider";

export function AdminPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingGroupDetail, setIsLoadingGroupDetail] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { t } = useLanguage();
  const { confirm, showToast } = useFeedback();

  const tabs = [
    { id: "users", label: t.users, icon: Users },
    { id: "groups", label: t.groups, icon: Activity },
    { id: "uploads", label: t.uploads, icon: Receipt },
    { id: "rejected", label: t.rejectedTx, icon: XCircle },
    { id: "logs", label: t.activityLogs, icon: Activity },
  ];

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setIsLoadingDashboard(true);
        setErrorMessage("");
        const response = await getAdminDashboard();

        if (isMounted) {
          setStats(response.stats ?? null);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load admin dashboard.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingDashboard(false);
        }
      }
    }

    async function loadGroups() {
      try {
        setIsLoadingGroups(true);
        const response = await getAdminGroups();

        if (isMounted) {
          const loadedGroups = response.groups ?? [];
          setGroups(loadedGroups);
          if (loadedGroups.length > 0) {
            setSelectedGroupId((currentSelectedGroupId) =>
              currentSelectedGroupId ?? loadedGroups[0].id,
            );
          } else {
            setSelectedGroupId(null);
            setSelectedGroup(null);
          }
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load admin groups.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingGroups(false);
        }
      }
    }

    void Promise.all([loadDashboard(), loadGroups()]);

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedGroupId || activeTab !== "groups") {
      return;
    }

    let isMounted = true;

    async function loadGroupDetail() {
      try {
        setIsLoadingGroupDetail(true);
        const response = await getAdminGroup(selectedGroupId);

        if (isMounted) {
          setSelectedGroup(response.group ?? null);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load admin group detail.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingGroupDetail(false);
        }
      }
    }

    void loadGroupDetail();

    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedGroupId]);

  const filteredUsers = (stats?.recentUsers ?? []).filter((user) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword)
    );
  });

  const filteredGroups = groups.filter((group) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    const owner = group.members.find((member) => member.role === "owner");

    return (
      group.name.toLowerCase().includes(keyword) ||
      owner?.name.toLowerCase().includes(keyword) === true ||
      owner?.email.toLowerCase().includes(keyword) === true ||
      group.members.some(
        (member) =>
          member.name.toLowerCase().includes(keyword) ||
          member.email.toLowerCase().includes(keyword),
      )
    );
  });

  async function handleDeleteGroup(group: Group) {
    const confirmed = await confirm({
      title: t.deleteGroup,
      message: `${t.deleteGroupConfirm} "${group.name}"?`,
      cancelLabel: t.cancel,
      confirmLabel: t.deleteGroup,
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingGroupId(group.id);
      const response = await deleteAdminGroup(group.id);
      const groupsResponse = await getAdminGroups();
      const refreshedGroups = groupsResponse.groups ?? [];

      setGroups(refreshedGroups);
      setSelectedGroup((currentSelectedGroup) =>
        currentSelectedGroup && refreshedGroups.some((currentGroup) => currentGroup.id === currentSelectedGroup.id)
          ? currentSelectedGroup.id === group.id
            ? null
            : currentSelectedGroup
          : null,
      );
      setSelectedGroupId((currentSelectedGroupId) => {
        if (
          currentSelectedGroupId &&
          currentSelectedGroupId !== group.id &&
          refreshedGroups.some((currentGroup) => currentGroup.id === currentSelectedGroupId)
        ) {
          return currentSelectedGroupId;
        }

        return refreshedGroups[0]?.id ?? null;
      });
      setStats((currentStats) =>
        currentStats
          ? {
              ...currentStats,
              totalGroups: refreshedGroups.length,
            }
          : currentStats,
      );
      showToast({
        variant: "success",
        message: response.message,
      });
    } catch (error) {
      showToast({
        variant: "error",
        message:
          error instanceof Error ? error.message : "Unable to delete group.",
      });
    } finally {
      setDeletingGroupId(null);
    }
  }

  const statCards = [
    {
      label: t.totalUsers,
      value: stats?.totalUsers.toString() ?? "--",
      icon: Users,
      bg: "bg-[#F0FAF5]",
      iconBg: "bg-[#7EDDBA]",
    },
    {
      label: t.totalGroups,
      value: stats?.totalGroups.toString() ?? "--",
      icon: Activity,
      bg: "bg-[#EFF6FF]",
      iconBg: "bg-[#93C5FD]",
    },
    {
      label: "Admin Accounts",
      value: stats?.totalAdmins.toString() ?? "--",
      icon: Shield,
      bg: "bg-[#FEFCE8]",
      iconBg: "bg-[#FCD34D]",
    },
    {
      label: "New Users (7 Days)",
      value: stats?.newUsersLast7Days.toString() ?? "--",
      icon: AlertCircle,
      bg: "bg-[#FEF2F2]",
      iconBg: "bg-[#FCA5A5]",
    },
  ];

  const EmptyState = ({
    icon: Icon,
    title,
    desc,
  }: {
    icon: typeof Users;
    title: string;
    desc: string;
  }) => (
    <div className="flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="w-14 h-14 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Icon className="w-7 h-7 text-[#7EDDBA]" />
      </div>
      <h3 className="text-[#111827] mb-1" style={{ fontWeight: 700 }}>
        {title}
      </h3>
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
              <h1
                className="text-[#111827]"
                style={{ fontSize: "1.5rem", fontWeight: 800 }}
              >
                {t.adminTitle}
              </h1>
              <p className="text-[#6B7280] text-sm">{t.adminDesc}</p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 border border-[#E5E7EB] bg-white text-[#374151] px-4 py-2.5 rounded-xl hover:bg-[#F0FAF5] hover:border-[#7EDDBA] transition-all text-sm"
            style={{ fontWeight: 600 }}
          >
            <Download className="w-4 h-4" />
            {t.exportData}
          </button>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
            {errorMessage}
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, bg, iconBg }) => (
            <div key={label} className={`${bg} rounded-2xl p-5 border border-white`}>
              <div
                className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center mb-3`}
              >
                <Icon className="w-4 h-4 text-[#065f46]" />
              </div>
              <p
                className="text-[#111827]"
                style={{ fontSize: "1.5rem", fontWeight: 800 }}
              >
                {value}
              </p>
              <p className="text-[#6B7280] text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1 mb-5 bg-white border border-[#E5E7EB] rounded-xl p-1 w-fit flex-wrap">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
                activeTab === id
                  ? "bg-[#16A34A] text-white shadow-sm"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
              style={{ fontWeight: 500 }}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {(activeTab === "users" || activeTab === "groups") && (
          <div className="mb-5 max-w-xs">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder={activeTab === "groups" ? t.searchGroups : t.searchUsers}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-2 text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA]"
              />
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            {isLoadingDashboard ? (
              <div className="px-5 py-8 text-sm text-[#6B7280]">
                Loading admin dashboard...
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="divide-y divide-[#F3F4F6]">
                <div className="px-5 py-4">
                  <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                    Recent Users
                  </h3>
                  <p className="text-sm text-[#6B7280] mt-1">
                    Newest accounts in the system.
                  </p>
                </div>
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="px-5 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="text-[#111827]" style={{ fontWeight: 600 }}>
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-[#6B7280] truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p
                        className="text-xs uppercase text-[#16A34A]"
                        style={{ fontWeight: 700 }}
                      >
                        {user.role}
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        Joined {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Users} title={t.noUsersYet} desc={t.noUsersDesc} />
            )}
          </div>
        )}

        {activeTab === "groups" && (
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
              {isLoadingGroups ? (
                <div className="px-5 py-8 text-sm text-[#6B7280]">
                  Loading admin groups...
                </div>
              ) : filteredGroups.length > 0 ? (
                <div className="divide-y divide-[#F3F4F6]">
                  <div className="px-5 py-4">
                    <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                      All Groups
                    </h3>
                    <p className="text-sm text-[#6B7280] mt-1">
                      Groups across the whole system.
                    </p>
                  </div>
                  {filteredGroups.map((group) => {
                    const owner =
                      group.members.find((member) => member.role === "owner") ??
                      group.members[0];
                    const isSelected = selectedGroupId === group.id;

                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => setSelectedGroupId(group.id)}
                        className={`w-full px-5 py-4 text-left transition-colors ${
                          isSelected ? "bg-[#F0FAF5]" : "hover:bg-[#FAFAFA]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                              style={{ background: group.color }}
                            >
                              {group.icon}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[#111827]" style={{ fontWeight: 600 }}>
                                {group.name}
                              </p>
                              <p className="text-sm text-[#6B7280] truncate">
                                Owner: {owner?.name ?? "Unknown"} · {group.members.length}{" "}
                                {t.members}
                              </p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs text-[#166534] border border-[#D1FAE5]" style={{ fontWeight: 600 }}>
                              <Eye className="h-3.5 w-3.5" />
                              View
                            </div>
                            <p className="text-xs text-[#9CA3AF] mt-2">
                              Updated {new Date(group.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <EmptyState icon={Users} title={t.noGroupsYet} desc={t.noGroupsDesc} />
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                  Group Detail
                </h3>
                {selectedGroup && (
                  <button
                    type="button"
                    onClick={() => void handleDeleteGroup(selectedGroup)}
                    disabled={deletingGroupId === selectedGroup.id}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ fontWeight: 600 }}
                  >
                    <Trash2 className="h-4 w-4" />
                    {deletingGroupId === selectedGroup.id ? t.deleting : t.deleteGroup}
                  </button>
                )}
              </div>
              {isLoadingGroupDetail ? (
                <p className="text-sm text-[#6B7280]">Loading group detail...</p>
              ) : selectedGroup ? (
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: selectedGroup.color }}
                    >
                      {selectedGroup.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                        {selectedGroup.name}
                      </p>
                      <p className="text-sm text-[#6B7280]">
                        {selectedGroup.members.length} {t.members}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-[#F9FAFB] px-4 py-3">
                      <p className="text-xs text-[#9CA3AF] uppercase">Created</p>
                      <p className="text-sm text-[#111827] mt-1" style={{ fontWeight: 600 }}>
                        {new Date(selectedGroup.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#F9FAFB] px-4 py-3">
                      <p className="text-xs text-[#9CA3AF] uppercase">Updated</p>
                      <p className="text-sm text-[#111827] mt-1" style={{ fontWeight: 600 }}>
                        {new Date(selectedGroup.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-[#111827] mb-3" style={{ fontWeight: 700 }}>
                      Members
                    </p>
                    <div className="space-y-3">
                      {selectedGroup.members.map((member) => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-[#F9FAFB] px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-[#111827]" style={{ fontWeight: 600 }}>
                              {member.name}
                            </p>
                            <p className="text-sm text-[#6B7280] truncate">
                              {member.email}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs ${
                              member.role === "owner"
                                ? "bg-[#FEF3C7] text-[#92400e]"
                                : "bg-[#EFF6FF] text-[#1e40af]"
                            }`}
                            style={{ fontWeight: 600 }}
                          >
                            {member.role}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#6B7280]">
                  Select a group to see details.
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === "uploads" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                {t.uploadHistory}
              </h3>
            </div>
            <EmptyState
              icon={Receipt}
              title={t.noUploads}
              desc="This admin section will be connected in a later step."
            />
          </div>
        )}

        {activeTab === "rejected" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                {t.rejectedTransactions}
              </h3>
            </div>
            <EmptyState
              icon={CheckCircle2}
              title={t.noRejectedTx}
              desc="This admin section will be connected in a later step."
            />
          </div>
        )}

        {activeTab === "logs" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#F3F4F6]">
              <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                {t.systemLogs}
              </h3>
            </div>
            <EmptyState
              icon={Activity}
              title={t.noLogsYet}
              desc="This admin section will be connected in a later step."
            />
          </div>
        )}
      </div>
    </div>
  );
}
