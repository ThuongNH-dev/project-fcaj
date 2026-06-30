import { Eye, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  deleteAdminGroup,
  getAdminGroup,
  getAdminGroups,
} from "../../../domains/admin-reporting";
import type { Group } from "../../../domains/groups";
import { formatLocalDate } from "../../../shared/lib/formatters";
import { useFeedback } from "../../../shared/providers/FeedbackProvider";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { AdminSearchInput } from "../components/AdminSearchInput";
import { useAdminLayoutContext } from "../layout/AdminLayout";
import { formatDateTime } from "../lib/admin.utils";

export function AdminGroupsPage() {
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoadingGroupDetail, setIsLoadingGroupDetail] = useState(false);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
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
        if (loadedGroups.length > 0) {
          setSelectedGroupId((currentSelectedGroupId) =>
            currentSelectedGroupId ?? loadedGroups[0].id,
          );
        } else {
          setSelectedGroupId(null);
          setSelectedGroup(null);
        }
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

  async function handleDeleteGroup(group: Group) {
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

      <AdminSearchInput
        placeholder={t.searchGroups}
        value={search}
        onChange={setSearch}
      />

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
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
                <p className="mt-1 text-sm text-[#6B7280]">
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
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                          style={{ background: group.color }}
                        >
                          {group.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[#111827]" style={{ fontWeight: 600 }}>
                            {group.name}
                          </p>
                          <p className="truncate text-sm text-[#6B7280]">
                            Owner: {owner?.name ?? "Unknown"} / {group.members.length}{" "}
                            {t.members}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div
                          className="inline-flex items-center gap-1 rounded-full border border-[#D1FAE5] bg-white px-3 py-1 text-xs text-[#166534]"
                          style={{ fontWeight: 600 }}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          View
                        </div>
                        <p className="mt-2 text-xs text-[#9CA3AF]">
                          Updated {formatLocalDate(group.updatedAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <AdminEmptyState
              icon={Users}
              title={t.noGroupsYet}
              description={t.noGroupsDesc}
            />
          )}
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
              Group Detail
            </h3>
            {selectedGroup && (
              <button
                type="button"
                onClick={() => void handleDeleteGroup(selectedGroup)}
                disabled={deletingGroupId === selectedGroup.id}
                className="inline-flex items-center gap-2 rounded-xl bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C] transition-colors hover:bg-[#FEE2E2] disabled:cursor-not-allowed disabled:opacity-60"
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
            </div>
          ) : (
            <p className="text-sm text-[#6B7280]">Select a group to see details.</p>
          )}
        </div>
      </div>
    </>
  );
}
