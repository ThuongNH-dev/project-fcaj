import { useEffect, useMemo, useState } from "react";
import {
  Users,
  Receipt,
  Activity,
  TrendingUp,
  Download,
  Shield,
  Search,
  AlertCircle,
  Eye,
  Trash2,
  XCircle,
} from "lucide-react";
import { useLanguage } from "../shared/providers/LanguageProvider";
import {
  deleteAdminGroup,
  getAdminActivityLogs,
  getAdminDashboard,
  getAdminGroup,
  getAdminGroups,
  getAdminRejected,
  getAdminSettlement,
  getAdminSettlements,
  getAdminUploads,
  type AdminActivityLog,
  type AdminDashboardStats,
  type AdminRejectedRecord,
  type AdminSettlementDetail,
  type AdminSettlementRecord,
  type AdminUploadRecord,
} from "../api/admin";
import type { Group } from "../domains/groups";
import { useFeedback } from "../shared/providers/FeedbackProvider";

function formatFileSize(sizeInBytes: number) {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`;
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDateTime(dateValue: string) {
  return new Date(dateValue).toLocaleString();
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getSearchPlaceholder(activeTab: string, t: ReturnType<typeof useLanguage>["t"]) {
  switch (activeTab) {
    case "groups":
      return t.searchGroups;
    case "settlements":
      return "Search settlements...";
    case "uploads":
      return "Search uploads...";
    case "rejected":
      return "Search rejected items...";
    case "logs":
      return "Search activity logs...";
    default:
      return t.searchUsers;
  }
}

function getUploadStatusLabel(upload: AdminUploadRecord, t: ReturnType<typeof useLanguage>["t"]) {
  if (upload.processingStatus === "processed") {
    return t.processed;
  }

  if (upload.processingStatus === "failed") {
    return t.failedErrors;
  }

  return t.pendingReview;
}

function getSettlementStatusLabel(status: AdminSettlementRecord["settlementStatus"]) {
  return status === "settled" ? "Settled" : "Pending";
}

function getLogTypeLabel(eventType: AdminActivityLog["eventType"]) {
  switch (eventType) {
    case "user_registered":
      return "User";
    case "group_created":
      return "Group";
    case "expense_created":
      return "Expense";
    case "expense_settled":
      return "Settlement";
    case "receipt_uploaded":
      return "Receipt";
    default:
      return "Activity";
  }
}

export function AdminPage() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("users");
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<AdminUploadRecord[]>([]);
  const [rejectedItems, setRejectedItems] = useState<AdminRejectedRecord[]>([]);
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([]);
  const [settlementFilter, setSettlementFilter] = useState<"all" | "pending" | "settled">(
    "all",
  );
  const [settlements, setSettlements] = useState<AdminSettlementRecord[]>([]);
  const [selectedSettlement, setSelectedSettlement] =
    useState<AdminSettlementDetail | null>(null);
  const [selectedSettlementId, setSelectedSettlementId] = useState<string | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingGroupDetail, setIsLoadingGroupDetail] = useState(false);
  const [isLoadingUploads, setIsLoadingUploads] = useState(true);
  const [isLoadingRejected, setIsLoadingRejected] = useState(true);
  const [isLoadingActivity, setIsLoadingActivity] = useState(true);
  const [isLoadingSettlements, setIsLoadingSettlements] = useState(true);
  const [isLoadingSettlementDetail, setIsLoadingSettlementDetail] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const { t } = useLanguage();
  const { confirm, showToast } = useFeedback();

  const tabs = [
    { id: "users", label: t.users, icon: Users },
    { id: "groups", label: t.groups, icon: Activity },
    { id: "settlements", label: t.settlements, icon: TrendingUp },
    { id: "uploads", label: t.uploads, icon: Receipt },
    { id: "rejected", label: t.rejectedTx, icon: XCircle },
    { id: "logs", label: t.activityLogs, icon: Activity },
  ];

  async function loadDashboard() {
    try {
      setIsLoadingDashboard(true);
      const response = await getAdminDashboard();
      setStats(response.stats ?? null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load admin dashboard.",
      );
    } finally {
      setIsLoadingDashboard(false);
    }
  }

  async function loadGroups() {
    try {
      setIsLoadingGroups(true);
      const response = await getAdminGroups();
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
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load admin groups.",
      );
    } finally {
      setIsLoadingGroups(false);
    }
  }

  async function loadUploads() {
    try {
      setIsLoadingUploads(true);
      const response = await getAdminUploads();
      setUploads(response.uploads ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load admin uploads.",
      );
    } finally {
      setIsLoadingUploads(false);
    }
  }

  async function loadRejected() {
    try {
      setIsLoadingRejected(true);
      const response = await getAdminRejected();
      setRejectedItems(response.rejectedItems ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load rejected items.",
      );
    } finally {
      setIsLoadingRejected(false);
    }
  }

  async function loadActivity() {
    try {
      setIsLoadingActivity(true);
      const response = await getAdminActivityLogs();
      setActivityLogs(response.activityLogs ?? []);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load activity logs.",
      );
    } finally {
      setIsLoadingActivity(false);
    }
  }

  async function loadSettlements(nextFilter: "all" | "pending" | "settled") {
    try {
      setIsLoadingSettlements(true);
      const response = await getAdminSettlements({
        status: nextFilter === "all" ? undefined : nextFilter,
      });
      const loadedSettlements = response.settlements ?? [];

      setSettlements(loadedSettlements);
      if (loadedSettlements.length > 0) {
        setSelectedSettlementId((currentSelectedSettlementId) =>
          currentSelectedSettlementId &&
          loadedSettlements.some(
            (currentSettlement) => currentSettlement.id === currentSelectedSettlementId,
          )
            ? currentSelectedSettlementId
            : loadedSettlements[0].id,
        );
      } else {
        setSelectedSettlementId(null);
        setSelectedSettlement(null);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load settlements.",
      );
    } finally {
      setIsLoadingSettlements(false);
    }
  }

  useEffect(() => {
    setErrorMessage("");
    void Promise.all([
      loadDashboard(),
      loadGroups(),
      loadUploads(),
      loadRejected(),
      loadActivity(),
    ]);
  }, []);

  useEffect(() => {
    void loadSettlements(settlementFilter);
  }, [settlementFilter]);

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

  useEffect(() => {
    if (!selectedSettlementId || activeTab !== "settlements") {
      return;
    }

    let isMounted = true;

    async function loadSettlementDetail() {
      try {
        setIsLoadingSettlementDetail(true);
        const response = await getAdminSettlement(selectedSettlementId);

        if (isMounted) {
          setSelectedSettlement(response.settlement ?? null);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load settlement detail.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingSettlementDetail(false);
        }
      }
    }

    void loadSettlementDetail();

    return () => {
      isMounted = false;
    };
  }, [activeTab, selectedSettlementId]);

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

  const filteredUploads = uploads.filter((upload) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      upload.originalFileName.toLowerCase().includes(keyword) ||
      upload.uploadedByName.toLowerCase().includes(keyword) ||
      upload.uploadedByEmail.toLowerCase().includes(keyword) ||
      upload.groupName?.toLowerCase().includes(keyword) === true ||
      upload.expenseTitle?.toLowerCase().includes(keyword) === true
    );
  });

  const filteredRejectedItems = rejectedItems.filter((item) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      item.title.toLowerCase().includes(keyword) ||
      item.actorName.toLowerCase().includes(keyword) ||
      item.groupName?.toLowerCase().includes(keyword) === true ||
      item.reason.toLowerCase().includes(keyword)
    );
  });

  const filteredActivityLogs = activityLogs.filter((activityLog) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      activityLog.title.toLowerCase().includes(keyword) ||
      activityLog.description.toLowerCase().includes(keyword)
    );
  });

  const filteredSettlements = settlements.filter((settlement) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return true;
    }

    return (
      settlement.title.toLowerCase().includes(keyword) ||
      settlement.groupName?.toLowerCase().includes(keyword) === true ||
      settlement.createdByName.toLowerCase().includes(keyword) ||
      settlement.paidByName.toLowerCase().includes(keyword) ||
      settlement.settledByName?.toLowerCase().includes(keyword) === true ||
      getSettlementStatusLabel(settlement.settlementStatus).toLowerCase().includes(keyword)
    );
  });

  const settlementSummary = useMemo(() => {
    return filteredSettlements.reduce(
      (summary, settlement) => {
        summary.totalAmount += settlement.amount;

        if (settlement.settlementStatus === "pending") {
          summary.pendingCount += 1;
          summary.pendingAmount += settlement.amount;
          summary.pendingAmountsByCurrency.set(
            settlement.currency,
            (summary.pendingAmountsByCurrency.get(settlement.currency) ?? 0) +
              settlement.amount,
          );
        } else {
          summary.settledCount += 1;
        }

        return summary;
      },
      {
        totalAmount: 0,
        pendingAmount: 0,
        pendingCount: 0,
        pendingAmountsByCurrency: new Map<string, number>(),
        settledCount: 0,
      },
    );
  }, [filteredSettlements]);

  const pendingAmountSummaryLabel = useMemo(() => {
    if (settlementSummary.pendingAmountsByCurrency.size === 0) {
      return "--";
    }

    return Array.from(settlementSummary.pendingAmountsByCurrency.entries())
      .map(([currency, amount]) => formatCurrency(amount, currency))
      .join(" · ");
  }, [settlementSummary.pendingAmountsByCurrency]);

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
        currentSelectedGroup &&
        refreshedGroups.some((currentGroup) => currentGroup.id === currentSelectedGroup.id)
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
      label: "Expenses",
      value: stats?.totalExpenses.toString() ?? "--",
      icon: Receipt,
      bg: "bg-[#FFF7ED]",
      iconBg: "bg-[#FDBA74]",
    },
    {
      label: "Uploads",
      value: stats?.totalReceiptUploads.toString() ?? "--",
      icon: Receipt,
      bg: "bg-[#F0FDF4]",
      iconBg: "bg-[#86EFAC]",
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

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
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

        <div className="mb-5 max-w-xs">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder={getSearchPlaceholder(activeTab, t)}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-9 pr-4 py-2 text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA]"
            />
          </div>
        </div>

        {activeTab === "settlements" && (
          <div className="mb-5 flex items-center gap-2 flex-wrap">
            {[
              { key: "all", label: "All" },
              { key: "pending", label: "Pending" },
              { key: "settled", label: "Settled" },
            ].map((filterOption) => (
              <button
                key={filterOption.key}
                type="button"
                onClick={() =>
                  setSettlementFilter(
                    filterOption.key as "all" | "pending" | "settled",
                  )
                }
                className={`rounded-xl px-4 py-2 text-sm transition-all ${
                  settlementFilter === filterOption.key
                    ? "bg-[#16A34A] text-white shadow-sm"
                    : "bg-white border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827]"
                }`}
                style={{ fontWeight: 600 }}
              >
                {filterOption.label}
              </button>
            ))}
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
                            <div
                              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs text-[#166534] border border-[#D1FAE5]"
                              style={{ fontWeight: 600 }}
                            >
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
                        {formatDateTime(selectedGroup.createdAt)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[#F9FAFB] px-4 py-3">
                      <p className="text-xs text-[#9CA3AF] uppercase">Updated</p>
                      <p className="text-sm text-[#111827] mt-1" style={{ fontWeight: 600 }}>
                        {formatDateTime(selectedGroup.updatedAt)}
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
                <p className="text-sm text-[#6B7280]">Select a group to see details.</p>
              )}
            </div>
          </div>
        )}

        {activeTab === "settlements" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: "Visible Settlements",
                  value: filteredSettlements.length.toString(),
                  bg: "bg-[#F0FAF5]",
                  valueClassName: "text-[#166534]",
                },
                {
                  label: "Pending Items",
                  value: settlementSummary.pendingCount.toString(),
                  bg: "bg-[#FEF3C7]",
                  valueClassName: "text-[#92400e]",
                },
                {
                  label: "Pending Amount",
                  value: pendingAmountSummaryLabel,
                  bg: "bg-[#FEF2F2]",
                  valueClassName: "text-[#B91C1C]",
                },
                {
                  label: "Settled Items",
                  value: settlementSummary.settledCount.toString(),
                  bg: "bg-[#EFF6FF]",
                  valueClassName: "text-[#1d4ed8]",
                },
              ].map((item) => (
                <div key={item.label} className={`${item.bg} rounded-2xl p-5 border border-white`}>
                  <p className={`text-2xl ${item.valueClassName}`} style={{ fontWeight: 800 }}>
                    {item.value}
                  </p>
                  <p className="text-[#6B7280] text-xs mt-1">{item.label}</p>
                </div>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
                {isLoadingSettlements ? (
                  <div className="px-5 py-8 text-sm text-[#6B7280]">
                    Loading settlements...
                  </div>
                ) : filteredSettlements.length > 0 ? (
                  <div className="divide-y divide-[#F3F4F6]">
                    <div className="px-5 py-4">
                      <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                        Settlement Queue
                      </h3>
                      <p className="text-sm text-[#6B7280] mt-1">
                        Review pending and settled expenses across all groups.
                      </p>
                    </div>
                    {filteredSettlements.map((settlement) => {
                      const isSelected = selectedSettlementId === settlement.id;
                      const statusClassName =
                        settlement.settlementStatus === "settled"
                          ? "bg-[#D1FAE5] text-[#065f46]"
                          : "bg-[#FEF3C7] text-[#92400e]";

                      return (
                        <button
                          key={settlement.id}
                          type="button"
                          onClick={() => setSelectedSettlementId(settlement.id)}
                          className={`w-full px-5 py-4 text-left transition-colors ${
                            isSelected ? "bg-[#F0FAF5]" : "hover:bg-[#FAFAFA]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                                  {settlement.title}
                                </p>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs ${statusClassName}`}
                                  style={{ fontWeight: 600 }}
                                >
                                  {getSettlementStatusLabel(settlement.settlementStatus)}
                                </span>
                              </div>
                              <p className="text-sm text-[#6B7280] mt-1">
                                {settlement.groupName ?? "Unknown group"} · Paid by{" "}
                                {settlement.paidByName}
                              </p>
                              <p className="text-xs text-[#9CA3AF] mt-2">
                                {settlement.participantCount} participants ·{" "}
                                {formatCurrency(settlement.amount, settlement.currency)}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-[#9CA3AF]">
                                Expense date
                              </p>
                              <p className="text-sm text-[#111827]" style={{ fontWeight: 600 }}>
                                {new Date(settlement.expenseDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    icon={TrendingUp}
                    title={t.allClear}
                    desc={t.noSettlementsDesc}
                  />
                )}
              </div>

              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-5">
                <div className="mb-4">
                  <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                    Settlement Detail
                  </h3>
                  <p className="text-sm text-[#6B7280] mt-1">
                    Inspect allocation, notes, and settlement history.
                  </p>
                </div>

                {isLoadingSettlementDetail ? (
                  <p className="text-sm text-[#6B7280]">Loading settlement detail...</p>
                ) : selectedSettlement ? (
                  <div className="space-y-5">
                    <div className="rounded-2xl bg-[#F9FAFB] px-4 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                            {selectedSettlement.title}
                          </p>
                          <p className="text-sm text-[#6B7280] mt-1">
                            {selectedSettlement.groupName ?? "Unknown group"}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            selectedSettlement.settlementStatus === "settled"
                              ? "bg-[#D1FAE5] text-[#065f46]"
                              : "bg-[#FEF3C7] text-[#92400e]"
                          }`}
                          style={{ fontWeight: 700 }}
                        >
                          {getSettlementStatusLabel(selectedSettlement.settlementStatus)}
                        </span>
                      </div>
                      <p className="text-2xl text-[#111827] mt-4" style={{ fontWeight: 800 }}>
                        {formatCurrency(
                          selectedSettlement.amount,
                          selectedSettlement.currency,
                        )}
                      </p>
                      <p className="text-xs text-[#9CA3AF] mt-1">
                        Created by {selectedSettlement.createdByName}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-[#F9FAFB] px-4 py-3">
                        <p className="text-xs text-[#9CA3AF] uppercase">Paid By</p>
                        <p className="text-sm text-[#111827] mt-1" style={{ fontWeight: 600 }}>
                          {selectedSettlement.paidByName}
                        </p>
                      </div>
                      <div className="rounded-xl bg-[#F9FAFB] px-4 py-3">
                        <p className="text-xs text-[#9CA3AF] uppercase">Review Status</p>
                        <p className="text-sm text-[#111827] mt-1" style={{ fontWeight: 600 }}>
                          {selectedSettlement.reviewStatus}
                        </p>
                      </div>
                      <div className="rounded-xl bg-[#F9FAFB] px-4 py-3">
                        <p className="text-xs text-[#9CA3AF] uppercase">Expense Date</p>
                        <p className="text-sm text-[#111827] mt-1" style={{ fontWeight: 600 }}>
                          {formatDateTime(selectedSettlement.expenseDate)}
                        </p>
                      </div>
                      <div className="rounded-xl bg-[#F9FAFB] px-4 py-3">
                        <p className="text-xs text-[#9CA3AF] uppercase">Receipt Link</p>
                        <p className="text-sm text-[#111827] mt-1 break-all" style={{ fontWeight: 600 }}>
                          {selectedSettlement.receiptId ?? "Not linked"}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-[#111827] mb-2" style={{ fontWeight: 700 }}>
                        Description
                      </p>
                      <p className="text-sm text-[#6B7280]">
                        {selectedSettlement.description || "No description provided."}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-[#111827] mb-3" style={{ fontWeight: 700 }}>
                        Participants
                      </p>
                      <div className="space-y-3">
                        {selectedSettlement.participants.map((participant) => (
                          <div
                            key={`${selectedSettlement.id}-${participant.userId}`}
                            className="flex items-center justify-between gap-3 rounded-xl bg-[#F9FAFB] px-4 py-3"
                          >
                            <div className="min-w-0">
                              <p className="text-[#111827]" style={{ fontWeight: 600 }}>
                                {participant.name}
                              </p>
                              <p className="text-sm text-[#6B7280] truncate">
                                {participant.email}
                              </p>
                            </div>
                            <span className="text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                              {formatCurrency(
                                participant.shareAmount,
                                selectedSettlement.currency,
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#E5E7EB] px-4 py-4">
                      <p className="text-sm text-[#111827] mb-3" style={{ fontWeight: 700 }}>
                        Settlement History
                      </p>
                      <div className="space-y-2 text-sm text-[#6B7280]">
                        <p>
                          Note: {selectedSettlement.settlementNote ?? "No settlement note."}
                        </p>
                        <p>
                          Settled at:{" "}
                          {selectedSettlement.settledAt
                            ? formatDateTime(selectedSettlement.settledAt)
                            : "Not settled yet"}
                        </p>
                        <p>
                          Settled by: {selectedSettlement.settledByName ?? "Not settled yet"}
                        </p>
                        <p>Last updated: {formatDateTime(selectedSettlement.updatedAt)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[#6B7280]">
                    Select a settlement to see details.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "uploads" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            {isLoadingUploads ? (
              <div className="px-5 py-8 text-sm text-[#6B7280]">
                Loading uploads...
              </div>
            ) : filteredUploads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F3F4F6]">
                      {["File", "Uploader", "Group", "Expense", "Status", "Uploaded"].map(
                        (heading) => (
                          <th
                            key={heading}
                            className="text-left px-5 py-3 text-xs text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap"
                            style={{ fontWeight: 600 }}
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUploads.map((upload) => (
                      <tr
                        key={upload.id}
                        className="border-b border-[#F9FAFB] hover:bg-[#FAFAFA] transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 bg-[#F0FAF5] rounded-xl flex items-center justify-center flex-shrink-0">
                              <Receipt className="w-3.5 h-3.5 text-[#16A34A]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm text-[#111827]" style={{ fontWeight: 600 }}>
                                {upload.originalFileName}
                              </p>
                              <p className="text-xs text-[#9CA3AF] truncate">
                                {upload.fileKind.toUpperCase()} · {formatFileSize(upload.sizeInBytes)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm text-[#111827]" style={{ fontWeight: 600 }}>
                            {upload.uploadedByName}
                          </p>
                          <p className="text-xs text-[#9CA3AF] truncate">
                            {upload.uploadedByEmail}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#374151] whitespace-nowrap">
                          {upload.groupName ?? "Unassigned"}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#374151] whitespace-nowrap">
                          {upload.expenseTitle ?? "Not linked"}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full ${
                              upload.processingStatus === "processed"
                                ? "bg-[#D1FAE5] text-[#065f46]"
                                : upload.processingStatus === "failed"
                                  ? "bg-[#FEE2E2] text-[#991b1b]"
                                  : "bg-[#FEF3C7] text-[#92400e]"
                            }`}
                            style={{ fontWeight: 600 }}
                          >
                            {getUploadStatusLabel(upload, t)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-[#9CA3AF] whitespace-nowrap">
                          {formatDateTime(upload.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={Receipt} title={t.noUploads} desc={t.noUploadsDesc} />
            )}
          </div>
        )}

        {activeTab === "rejected" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            {isLoadingRejected ? (
              <div className="px-5 py-8 text-sm text-[#6B7280]">
                Loading rejected items...
              </div>
            ) : filteredRejectedItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#F3F4F6]">
                      {["Type", "Title", "Group", "Actor", "Reason", "Date"].map(
                        (heading) => (
                          <th
                            key={heading}
                            className="text-left px-5 py-3 text-xs text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap"
                            style={{ fontWeight: 600 }}
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRejectedItems.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-[#F9FAFB] hover:bg-[#FAFAFA] transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <span
                            className={`text-xs px-2.5 py-1 rounded-full ${
                              item.entityType === "receipt"
                                ? "bg-[#EFF6FF] text-[#1e40af]"
                                : "bg-[#FEF3C7] text-[#92400e]"
                            }`}
                            style={{ fontWeight: 600 }}
                          >
                            {item.entityType}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#111827]" style={{ fontWeight: 600 }}>
                          {item.title}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#374151] whitespace-nowrap">
                          {item.groupName ?? "Unassigned"}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#374151] whitespace-nowrap">
                          {item.actorName}
                        </td>
                        <td className="px-5 py-3.5 text-sm text-[#6B7280]">
                          {item.reason}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-[#9CA3AF] whitespace-nowrap">
                          {formatDateTime(item.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState icon={XCircle} title={t.noRejectedTx} desc={t.noRejectedDesc} />
            )}
          </div>
        )}

        {activeTab === "logs" && (
          <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden">
            {isLoadingActivity ? (
              <div className="px-5 py-8 text-sm text-[#6B7280]">
                Loading activity logs...
              </div>
            ) : filteredActivityLogs.length > 0 ? (
              <div className="divide-y divide-[#F3F4F6]">
                {filteredActivityLogs.map((activityLog) => (
                  <div
                    key={activityLog.id}
                    className="px-5 py-4 flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="inline-flex rounded-full bg-[#F0FAF5] px-2.5 py-1 text-xs text-[#166534]"
                          style={{ fontWeight: 700 }}
                        >
                          {getLogTypeLabel(activityLog.eventType)}
                        </span>
                        <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                          {activityLog.title}
                        </p>
                      </div>
                      <p className="text-sm text-[#6B7280]">{activityLog.description}</p>
                    </div>
                    <p className="text-xs text-[#9CA3AF] whitespace-nowrap">
                      {formatDateTime(activityLog.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={Activity} title={t.noLogsYet} desc={t.noLogsDesc} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

