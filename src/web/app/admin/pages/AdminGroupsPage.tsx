import { Eye, Search, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  deleteAdminGroup,
  getAdminGroup,
  getAdminGroups,
  getAdminSettlements,
  type AdminSettlementRecord,
} from "../../../domains/admin-reporting";
import type { Group } from "../../../domains/groups";
import { formatLocalDate } from "../../../shared/lib/formatters";
import { useFeedback } from "../../../shared/providers/FeedbackProvider";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../../shared/ui/dialog";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { AdminPagination } from "../components/AdminPagination";
import { useAdminLayoutContext } from "../layout/AdminLayout";
import {
  formatCurrency,
  formatDateTime,
  getSettlementStatusLabel,
  useAdminPagination,
} from "../lib/admin.utils";

export function AdminGroupsPage() {
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLoadingGroupDetail, setIsLoadingGroupDetail] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [isLoadingGroupTransactions, setIsLoadingGroupTransactions] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroupTransactions, setSelectedGroupTransactions] = useState<
    AdminSettlementRecord[]
  >([]);
  const { confirm, showToast } = useFeedback();
  const { refreshDashboard } = useAdminLayoutContext();
  const { t } = useLanguage();

  useEffect(() => {
    let isMounted = true;

    async function loadGroups() {
      try {
        setIsLoadingGroups(true);
        setErrorMessage("");
        const response = await getAdminGroups();
        const loadedGroups = response.groups ?? [];

        if (!isMounted) {
          return;
        }

        setGroups(loadedGroups);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load admin groups.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingGroups(false);
        }
      }
    }

    void loadGroups();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedGroupId) {
      setSelectedGroup(null);
      setSelectedGroupTransactions([]);
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
            error instanceof Error ? error.message : "Unable to load admin group detail.",
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
  }, [selectedGroupId]);

  useEffect(() => {
    if (!selectedGroupId) {
      setSelectedGroupTransactions([]);
      return;
    }

    let isMounted = true;

    async function loadGroupTransactions() {
      try {
        setIsLoadingGroupTransactions(true);
        const response = await getAdminSettlements({ groupId: selectedGroupId });

        if (isMounted) {
          setSelectedGroupTransactions(response.settlements ?? []);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load group transactions.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingGroupTransactions(false);
        }
      }
    }

    void loadGroupTransactions();

    return () => {
      isMounted = false;
    };
  }, [selectedGroupId]);

  const filteredGroups = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return groups.filter((group) => {
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
  }, [groups, search]);

  const {
    page: groupsPage,
    pageItems: pagedGroups,
    setPage: setGroupsPage,
    totalPages: groupsTotalPages,
  } = useAdminPagination(filteredGroups);

  const {
    page: groupTransactionsPage,
    pageItems: pagedGroupTransactions,
    setPage: setGroupTransactionsPage,
    totalPages: groupTransactionsTotalPages,
  } = useAdminPagination(selectedGroupTransactions);

  const selectedGroupTransactionSummary = useMemo(() => {
    return selectedGroupTransactions.reduce(
      (summary, transaction) => {
        summary.totalCount += 1;
        summary.amountsByCurrency.set(
          transaction.currency,
          (summary.amountsByCurrency.get(transaction.currency) ?? 0) + transaction.amount,
        );

        if (transaction.settlementStatus === "pending") {
          summary.pendingCount += 1;
        } else {
          summary.settledCount += 1;
        }

        return summary;
      },
      {
        amountsByCurrency: new Map<string, number>(),
        pendingCount: 0,
        settledCount: 0,
        totalCount: 0,
      },
    );
  }, [selectedGroupTransactions]);

  const selectedGroupTransactionAmountLabel = useMemo(() => {
    if (selectedGroupTransactionSummary.amountsByCurrency.size === 0) {
      return "--";
    }

    return Array.from(selectedGroupTransactionSummary.amountsByCurrency.entries())
      .map(([currency, amount]) => formatCurrency(amount, currency))
      .join(", ");
  }, [selectedGroupTransactionSummary]);

  function handleViewGroup(groupId: string) {
    setSelectedGroupId(groupId);
    setGroupTransactionsPage(1);
    setIsDetailOpen(true);
  }

  async function handleDeleteGroup(group: { id: string; name: string }) {
    const confirmed = await confirm({
      cancelLabel: t.cancel,
      confirmLabel: t.deleteGroup,
      message: `${t.deleteGroupConfirm} "${group.name}"?`,
      title: t.deleteGroup,
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
      if (selectedGroupId === group.id) {
        setIsDetailOpen(false);
        setSelectedGroup(null);
        setSelectedGroupTransactions([]);
        setSelectedGroupId(null);
      }
      showToast({
        message: response.message,
        variant: "success",
      });
      await refreshDashboard();
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : "Unable to delete group.",
        variant: "error",
      });
    } finally {
      setDeletingGroupId(null);
    }
  }

  return (
    <>
      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {errorMessage}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F3F4F6] px-5 py-4">
          <div>
            <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
              All Groups
            </h3>
            <p className="mt-1 text-sm text-[#6B7280]">
              Groups across the whole system.
            </p>
          </div>
          <div className="relative h-9 w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <input
              type="text"
              placeholder={t.searchGroups}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="box-border h-9 w-full rounded-xl border border-[#E5E7EB] bg-white pl-9 pr-4 text-sm leading-9 text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA]"
            />
          </div>
        </div>

        {isLoadingGroups ? (
          <div className="space-y-3 p-5">
            <div className="h-14 animate-pulse rounded-xl bg-[#F3F4F6]" />
            <div className="h-14 animate-pulse rounded-xl bg-[#F3F4F6]" />
            <div className="h-14 animate-pulse rounded-xl bg-[#F3F4F6]" />
            <div className="h-14 animate-pulse rounded-xl bg-[#F3F4F6]" />
            <div className="h-14 animate-pulse rounded-xl bg-[#F3F4F6]" />
          </div>
        ) : filteredGroups.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#F3F4F6] bg-[#FAFAFA]">
                    {["Group", "Owner", "Members", "Updated", "Actions"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-5 py-3 text-left text-xs uppercase tracking-wider text-[#9CA3AF]"
                          style={{ fontWeight: 700 }}
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {pagedGroups.map((group) => {
                    const owner =
                      group.members.find((member) => member.role === "owner") ??
                      group.members[0];

                    return (
                      <tr
                        key={group.id}
                        onClick={() => handleViewGroup(group.id)}
                        className="cursor-pointer border-b border-[#F9FAFB] transition-colors hover:bg-[#F0FAF5]"
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base shadow-sm"
                              style={{ background: group.color }}
                            >
                              {group.icon}
                            </div>
                            <p
                              className="text-sm text-[#111827]"
                              style={{ fontWeight: 700 }}
                            >
                              {group.name}
                            </p>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-[#374151]">
                          {owner?.name ?? "Unknown"}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-[#374151]">
                          {group.members.length} {t.members}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5 text-sm text-[#374151]">
                          {formatLocalDate(group.updatedAt)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3.5">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleViewGroup(group.id);
                              }}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F0FAF5] hover:text-[#16A34A]"
                              title="View group detail"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleDeleteGroup(group);
                              }}
                              disabled={deletingGroupId === group.id}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#FEF2F2] hover:text-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-40"
                              title={t.deleteGroup}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <AdminPagination
              page={groupsPage}
              totalPages={groupsTotalPages}
              onPageChange={setGroupsPage}
            />
          </>
        ) : (
          <AdminEmptyState
            icon={Users}
            title={t.noGroupsYet}
            description={t.noGroupsDesc}
          />
        )}
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-3 pr-6">
              <DialogTitle>Group Detail</DialogTitle>
              {selectedGroup && (
                <button
                  type="button"
                  onClick={() => void handleDeleteGroup(selectedGroup)}
                  disabled={deletingGroupId === selectedGroup.id}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#FEF2F2] px-3 py-1.5 text-xs text-[#B91C1C] transition-colors hover:bg-[#FEE2E2] disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ fontWeight: 600 }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {deletingGroupId === selectedGroup.id ? t.deleting : t.deleteGroup}
                </button>
              )}
            </div>
          </DialogHeader>

          {isLoadingGroupDetail ? (
            <div className="space-y-3">
              <div className="h-16 animate-pulse rounded-2xl bg-[#F3F4F6]" />
              <div className="h-20 animate-pulse rounded-2xl bg-[#F3F4F6]" />
              <div className="h-28 animate-pulse rounded-2xl bg-[#F3F4F6]" />
            </div>
          ) : selectedGroup ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-xl"
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
                  <p className="text-xs uppercase text-[#9CA3AF]">Created</p>
                  <p className="mt-1 text-sm text-[#111827]" style={{ fontWeight: 600 }}>
                    {formatDateTime(selectedGroup.createdAt)}
                  </p>
                </div>
                <div className="rounded-xl bg-[#F9FAFB] px-4 py-3">
                  <p className="text-xs uppercase text-[#9CA3AF]">Updated</p>
                  <p className="mt-1 text-sm text-[#111827]" style={{ fontWeight: 600 }}>
                    {formatDateTime(selectedGroup.updatedAt)}
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-3 text-sm text-[#111827]" style={{ fontWeight: 700 }}>
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
                        <p className="truncate text-sm text-[#6B7280]">{member.email}</p>
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

              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                      Transactions
                    </p>
                    <p className="text-xs text-[#6B7280]">
                      All transactions currently recorded in this group.
                    </p>
                  </div>
                  <span
                    className="rounded-full bg-[#F0FAF5] px-3 py-1 text-xs text-[#166534]"
                    style={{ fontWeight: 700 }}
                  >
                    {selectedGroupTransactionSummary.totalCount} items
                  </span>
                </div>

                <div className="mb-3 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-[#F9FAFB] px-3 py-3">
                    <p className="text-xs uppercase text-[#9CA3AF]">Total</p>
                    <p className="mt-1 text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                      {selectedGroupTransactionAmountLabel}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#FFF7ED] px-3 py-3">
                    <p className="text-xs uppercase text-[#9CA3AF]">Pending</p>
                    <p className="mt-1 text-sm text-[#92400E]" style={{ fontWeight: 700 }}>
                      {selectedGroupTransactionSummary.pendingCount}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#EFF6FF] px-3 py-3">
                    <p className="text-xs uppercase text-[#9CA3AF]">Settled</p>
                    <p className="mt-1 text-sm text-[#1D4ED8]" style={{ fontWeight: 700 }}>
                      {selectedGroupTransactionSummary.settledCount}
                    </p>
                  </div>
                </div>

                {isLoadingGroupTransactions ? (
                  <div className="space-y-3">
                    <div className="h-16 animate-pulse rounded-xl bg-[#F3F4F6]" />
                    <div className="h-16 animate-pulse rounded-xl bg-[#F3F4F6]" />
                  </div>
                ) : selectedGroupTransactions.length > 0 ? (
                  <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
                    <div className="space-y-3 p-3">
                      {pagedGroupTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="rounded-xl border border-[#E5E7EB] bg-white px-4 py-3"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p
                                className="truncate text-[#111827]"
                                style={{ fontWeight: 600 }}
                              >
                                {transaction.title}
                              </p>
                              <p className="mt-1 text-sm text-[#6B7280]">
                                Paid by {transaction.paidByName}
                              </p>
                              <p className="mt-1 text-xs text-[#9CA3AF]">
                                {transaction.participantCount} participants •{" "}
                                {formatLocalDate(transaction.expenseDate)}
                              </p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                                {formatCurrency(transaction.amount, transaction.currency)}
                              </p>
                              <span
                                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs ${
                                  transaction.settlementStatus === "settled"
                                    ? "bg-[#D1FAE5] text-[#065F46]"
                                    : "bg-[#FEF3C7] text-[#92400E]"
                                }`}
                                style={{ fontWeight: 600 }}
                              >
                                {getSettlementStatusLabel(transaction.settlementStatus)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <AdminPagination
                      page={groupTransactionsPage}
                      totalPages={groupTransactionsTotalPages}
                      onPageChange={setGroupTransactionsPage}
                    />
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#F9FAFB] px-4 py-4 text-sm text-[#6B7280]">
                    No transactions found in this group.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#6B7280]">Select a group to see details.</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
