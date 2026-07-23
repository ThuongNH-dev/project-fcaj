import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { ChevronRight, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../../shared/ui/avatar";
import { useStoredUser } from "../../auth";
import { useFeedback } from "../../../shared/providers/FeedbackProvider";
import {
  formatCurrency,
  formatLocalDate,
} from "../../../shared/lib/formatters";
import { getExpenses, type Expense } from "../../expenses";
import { GroupFormDialog } from "../components/GroupFormDialog";
import { canManageGroup, deleteGroup, getGroups, type Group } from "..";
import { formatCurrencyBreakdown } from "../../settlements/lib/settlement.utils";

type GroupStatus = "Active" | "Pending" | "Settled";

interface GroupExpenseSummary {
  totalExpenses: Map<string, number>;
  yourBalance: Map<string, number>;
  status: GroupStatus;
}

function addCurrencyAmount(totals: Map<string, number>, currency: string, amount: number) {
  totals.set(currency, Number(((totals.get(currency) ?? 0) + amount).toFixed(2)));
}

export function MyGroupsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [groupToEdit, setGroupToEdit] = useState<Group | null>(null);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { t } = useLanguage();
  const { confirm, showToast } = useFeedback();
  const navigate = useNavigate();
  const currentUser = useStoredUser();

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

      const [groupsResponse, expensesResponse] = await Promise.all([
        getGroups(),
        getExpenses(),
      ]);

      setGroups(groupsResponse.groups ?? []);
      setExpenses(expensesResponse.expenses ?? []);
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

  const groupExpenseSummaries = useMemo(() => {
    const summaries = new Map<string, GroupExpenseSummary>();

    groups.forEach((group) => {
      summaries.set(group.id, {
        totalExpenses: new Map<string, number>(),
        yourBalance: new Map<string, number>(),
        status: "Active",
      });
    });

    expenses.forEach((expense) => {
      const summary = summaries.get(expense.groupId);

      if (!summary) {
        return;
      }

      addCurrencyAmount(summary.totalExpenses, expense.currency, expense.amount);

      const yourShare =
        expense.participants.find((participant) => participant.userId === currentUser?.id)
          ?.shareAmount ?? 0;
      const yourPaidAmount = expense.paidByUserId === currentUser?.id ? expense.amount : 0;

      addCurrencyAmount(summary.yourBalance, expense.currency, yourPaidAmount - yourShare);

      if (expense.settlementStatus === "pending") {
        summary.status = "Pending";
      } else if (summary.status === "Active") {
        summary.status = "Settled";
      }
    });

    return summaries;
  }, [currentUser?.defaultCurrency, currentUser?.id, expenses, groups]);

  const filteredGroups = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return groups.filter((group) => {
      if (normalizedSearch && !group.name.toLowerCase().includes(normalizedSearch)) {
        return false;
      }

      const groupStatus = groupExpenseSummaries.get(group.id)?.status.toLowerCase() ?? "active";

      return filter === "all" || filter === groupStatus;
    });
  }, [filter, groupExpenseSummaries, groups, search]);

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

    return formatLocalDate(value);
  };

  const buildMemberBadges = (group: Group) => {
    return group.members.slice(0, 4).map((member, index) => ({
      key: `${group.id}-${member.name}-${index}`,
      avatarUrl: member.avatarUrl?.trim() ?? "",
      initials:
        member.name
          .split(" ")
          .map((part) => part.charAt(0))
          .join("")
          .slice(0, 2)
          .toUpperCase() || (member.role === "owner" ? "OW" : "MB"),
    }));
  };

  const handleDeleteGroup = async (group: Group) => {
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
      const response = await deleteGroup(group.id);
      setGroups((currentGroups) =>
        currentGroups.filter((currentGroup) => currentGroup.id !== group.id),
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
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA]"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-[#E5E7EB] rounded-xl p-1">
            {filters.map((filterOption) => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key)}
                className={`px-4 py-1.5 rounded-lg text-sm transition-all ${filter === filterOption.key ? "bg-[#16A34A] text-white shadow-sm" : "text-[#6B7280] hover:text-[#111827]"}`}
                style={{ fontWeight: 500 }}
              >
                {filterOption.label}
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
              const summary = groupExpenseSummaries.get(group.id) ?? {
                totalExpenses: new Map<string, number>(),
                yourBalance: new Map<string, number>(),
                status: "Active" as GroupStatus,
              };
              const formattedTotalExpenses = formatCurrencyBreakdown(summary.totalExpenses, {
                emptyCurrency: group.currency,
              });
              const yourBalance = formatCurrencyBreakdown(summary.yourBalance, {
                signed: true,
                emptyCurrency: group.currency,
              });
              const balanceValues = Array.from(summary.yourBalance.values());
              const isPositive = balanceValues.some((amount) => amount > 0);
              const isZero = balanceValues.every((amount) => amount === 0);
              const status = summary.status;
              const userCanManageGroup = canManageGroup(currentUser, group);

              return (
                <article
                  key={group.id}
                  className="bg-white rounded-2xl border border-[#E5E7EB] p-5 transition-all hover:shadow-md hover:-translate-y-0.5 group"
                >
                  {userCanManageGroup && (
                    <div className="mb-4 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setGroupToEdit(group);
                          setShowCreateModal(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-1.5 text-xs text-[#374151] hover:bg-[#F3F4F6] transition-colors"
                        style={{ fontWeight: 600 }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        {t.editGroup}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleDeleteGroup(group);
                        }}
                        disabled={deletingGroupId === group.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-[#FECACA] bg-[#FEF2F2] px-3 py-1.5 text-xs text-[#B91C1C] hover:bg-[#FEE2E2] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ fontWeight: 600 }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingGroupId === group.id ? t.deleting : t.deleteGroup}
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      navigate(`/groups/${group.id}`);
                    }}
                    className="w-full text-left"
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
                          <Avatar
                            key={member.key}
                            className="w-7 h-7 rounded-full border-2 border-white bg-[#D1FAE5] text-[#065f46]"
                            style={{ zIndex: 4 - index }}
                          >
                            {member.avatarUrl ? (
                              <AvatarImage
                                src={member.avatarUrl}
                                alt={member.initials}
                                className="object-cover"
                              />
                            ) : null}
                            <AvatarFallback
                              className="rounded-full bg-[#D1FAE5] text-[#065f46] text-[10px]"
                              style={{ fontWeight: 700 }}
                            >
                              {member.initials}
                            </AvatarFallback>
                          </Avatar>
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
                        <p className="text-[#111827] whitespace-pre-line" style={{ fontWeight: 700 }}>
                          {formattedTotalExpenses}
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
                              ? "text-[#6B7280] whitespace-pre-line"
                              : isPositive
                                ? "text-[#16A34A] whitespace-pre-line"
                                : "text-[#EF4444] whitespace-pre-line"
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
                </article>
              );
            })}
          </div>
        )}

        {createPortal(
          <GroupFormDialog
            isOpen={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setGroupToEdit(null);
            }}
            onCreated={loadGroups}
            groupToEdit={groupToEdit}
          />,
          document.body,
        )}
      </div>
    </div>
  );
}
