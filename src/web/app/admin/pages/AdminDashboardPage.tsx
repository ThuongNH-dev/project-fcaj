import { Shield, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useStoredUser } from "../../../domains/auth";
import {
  deleteAdminUser,
  getAdminUser,
  getAdminUsers,
  updateAdminUserRole,
  type AdminUserDetail,
  type AdminUserRecord,
} from "../../../domains/admin-reporting";
import {
  formatCurrency,
  formatDateTime,
  formatLocalDate,
} from "../../../shared/lib/formatters";
import { useFeedback } from "../../../shared/providers/FeedbackProvider";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { AdminSearchInput } from "../components/AdminSearchInput";
import { useAdminLayoutContext } from "../layout/AdminLayout";

export function AdminDashboardPage() {
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingUserDetail, setIsLoadingUserDetail] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [roleDraft, setRoleDraft] = useState<"admin" | "user">("user");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user">("all");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const currentUser = useStoredUser();
  const { confirm, showToast } = useFeedback();
  const { refreshDashboard } = useAdminLayoutContext();
  const { t } = useLanguage();

  async function refreshUsers() {
    const response = await getAdminUsers();
    const refreshedUsers = response.users ?? [];

    setUsers(refreshedUsers);
    setSelectedUserId((currentSelectedUserId) => {
      if (
        currentSelectedUserId &&
        refreshedUsers.some((user) => user.id === currentSelectedUserId)
      ) {
        return currentSelectedUserId;
      }

      return refreshedUsers[0]?.id ?? null;
    });
  }

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        setIsLoadingUsers(true);
        setErrorMessage("");
        const response = await getAdminUsers();
        const loadedUsers = response.users ?? [];

        if (!isMounted) {
          return;
        }

        setUsers(loadedUsers);
        if (loadedUsers.length > 0) {
          setSelectedUserId((currentSelectedUserId) =>
            currentSelectedUserId &&
            loadedUsers.some((user) => user.id === currentSelectedUserId)
              ? currentSelectedUserId
              : loadedUsers[0].id,
          );
        } else {
          setSelectedUserId(null);
          setSelectedUser(null);
        }
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load admin users.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingUsers(false);
        }
      }
    }

    void loadUsers();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedUserId) {
      return;
    }

    let isMounted = true;

    async function loadUserDetail() {
      try {
        setIsLoadingUserDetail(true);
        const response = await getAdminUser(selectedUserId);

        if (!isMounted) {
          return;
        }

        setSelectedUser(response.user ?? null);
      } catch (error) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load admin user detail.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoadingUserDetail(false);
        }
      }
    }

    void loadUserDetail();

    return () => {
      isMounted = false;
    };
  }, [selectedUserId]);

  useEffect(() => {
    setRoleDraft(selectedUser?.role ?? "user");
  }, [selectedUser?.role]);

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false;
      }

      if (!keyword) {
        return true;
      }

      return (
        user.fullName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
      );
    });
  }, [roleFilter, search, users]);

  async function handleSaveRole() {
    if (!selectedUser || roleDraft === selectedUser.role) {
      return;
    }

    try {
      setIsUpdatingRole(true);
      const response = await updateAdminUserRole(selectedUser.id, { role: roleDraft });
      showToast({
        variant: "success",
        message: response.message,
      });
      await Promise.all([refreshUsers(), refreshDashboard()]);
    } catch (error) {
      showToast({
        variant: "error",
        message:
          error instanceof Error ? error.message : "Unable to update user role.",
      });
    } finally {
      setIsUpdatingRole(false);
    }
  }

  async function handleDeleteUser() {
    if (!selectedUser) {
      return;
    }

    const confirmed = await confirm({
      title: t.deleteUserTitle,
      message: `${t.deleteUser} "${selectedUser.fullName}"? ${t.deleteUserDesc}`,
      cancelLabel: t.cancel,
      confirmLabel: t.deleteUser,
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      setDeletingUserId(selectedUser.id);
      const response = await deleteAdminUser(selectedUser.id);
      showToast({
        variant: "success",
        message: response.message,
      });
      await Promise.all([refreshUsers(), refreshDashboard()]);
    } catch (error) {
      showToast({
        variant: "error",
        message: error instanceof Error ? error.message : "Unable to delete user.",
      });
    } finally {
      setDeletingUserId(null);
    }
  }

  const isManagingSelf = selectedUser?.id === currentUser?.id;
  const canSaveRole =
    Boolean(selectedUser) &&
    !isManagingSelf &&
    roleDraft !== selectedUser?.role &&
    !isUpdatingRole;
  const isDeletingSelectedUser = deletingUserId === selectedUser?.id;

  return (
    <>
      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
          {errorMessage}
        </div>
      )}

      <AdminSearchInput
        placeholder={t.searchUsers}
        value={search}
        onChange={setSearch}
      />

      <div className="mb-5 flex w-fit flex-wrap items-center gap-1 rounded-xl border border-[#E5E7EB] bg-white p-1">
        {[
          { key: "all", label: t.allUsers },
          { key: "admin", label: t.adminsOnly },
          { key: "user", label: t.standardUsersOnly },
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            type="button"
            onClick={() => setRoleFilter(filterOption.key as "all" | "admin" | "user")}
            className={`rounded-lg px-4 py-2 text-sm transition-all ${
              roleFilter === filterOption.key
                ? "bg-[#16A34A] text-white shadow-sm"
                : "text-[#6B7280] hover:text-[#111827]"
            }`}
            style={{ fontWeight: 600 }}
          >
            {filterOption.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
          {isLoadingUsers ? (
            <div className="px-5 py-8 text-sm text-[#6B7280]">{t.loadingUsers}</div>
          ) : filteredUsers.length > 0 ? (
            <div className="divide-y divide-[#F3F4F6]">
              <div className="px-5 py-4">
                <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
                  {t.userManagement}
                </h3>
                <p className="mt-1 text-sm text-[#6B7280]">
                  {t.userManagementDesc}
                </p>
              </div>
              {filteredUsers.map((user) => {
                const isSelected = selectedUserId === user.id;

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    className={`w-full px-5 py-4 text-left transition-colors ${
                      isSelected ? "bg-[#F0FAF5]" : "hover:bg-[#FAFAFA]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                            {user.fullName}
                          </p>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs ${
                              user.role === "admin"
                                ? "bg-[#FEE2E2] text-[#991B1B]"
                                : "bg-[#EFF6FF] text-[#1D4ED8]"
                            }`}
                            style={{ fontWeight: 600 }}
                          >
                            {user.role}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-sm text-[#6B7280]">{user.email}</p>
                        <p className="mt-2 text-xs text-[#9CA3AF]">
                          {user.groupCount} groups / {user.expenseCount} expenses /{" "}
                          {user.receiptUploadCount} receipts
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs text-[#9CA3AF]">{t.joinedOn}</p>
                        <p className="text-sm text-[#111827]" style={{ fontWeight: 600 }}>
                          {formatLocalDate(user.createdAt)}
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
              title={t.noUsersYet}
              description={t.noUsersDesc}
            />
          )}
        </div>

        <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h3 className="text-[#111827]" style={{ fontWeight: 700 }}>
              {t.userDetail}
            </h3>
            {selectedUser && (
              <button
                type="button"
                onClick={() => void handleDeleteUser()}
                disabled={isDeletingSelectedUser || isManagingSelf}
                className="inline-flex items-center gap-2 rounded-xl bg-[#FEF2F2] px-3 py-2 text-sm text-[#B91C1C] transition-colors hover:bg-[#FEE2E2] disabled:cursor-not-allowed disabled:opacity-60"
                style={{ fontWeight: 600 }}
              >
                <Trash2 className="h-4 w-4" />
                {isDeletingSelectedUser ? t.deletingUser : t.deleteUser}
              </button>
            )}
          </div>

          {isLoadingUserDetail ? (
            <p className="text-sm text-[#6B7280]">{t.loadingUserDetail}</p>
          ) : selectedUser ? (
            <div className="space-y-5">
              <div className="rounded-2xl bg-[#F9FAFB] px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                      {selectedUser.fullName}
                    </p>
                    <p className="mt-1 text-sm text-[#6B7280]">{selectedUser.email}</p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      selectedUser.role === "admin"
                        ? "bg-[#FEE2E2] text-[#991B1B]"
                        : "bg-[#EFF6FF] text-[#1D4ED8]"
                    }`}
                    style={{ fontWeight: 700 }}
                  >
                    {selectedUser.role}
                  </span>
                </div>
                <p className="mt-4 text-sm text-[#6B7280]">
                  {t.joinedOn} {formatDateTime(selectedUser.createdAt)}
                </p>
                <p className="mt-1 text-xs text-[#9CA3AF]">
                  Last updated {formatDateTime(selectedUser.updatedAt)}
                </p>
              </div>

              <div>
                <p className="mb-3 text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                  {t.roleManagement}
                </p>
                <div className="flex items-center gap-2 rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-2">
                  {(["user", "admin"] as const).map((roleOption) => (
                    <button
                      key={roleOption}
                      type="button"
                      onClick={() => setRoleDraft(roleOption)}
                      disabled={isManagingSelf}
                      className={`flex-1 rounded-xl px-4 py-2 text-sm transition-all ${
                        roleDraft === roleOption
                          ? "bg-[#16A34A] text-white shadow-sm"
                          : "text-[#6B7280] hover:text-[#111827]"
                      } disabled:cursor-not-allowed disabled:opacity-60`}
                      style={{ fontWeight: 600 }}
                    >
                      {roleOption === "admin" ? "Admin" : "User"}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-[#9CA3AF]">
                    {isManagingSelf
                      ? t.ownAdminRoleProtected
                      : t.roleChangeHint}
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleSaveRole()}
                    disabled={!canSaveRole}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#16A34A] px-4 py-2 text-sm text-white transition-colors hover:bg-[#15803D] disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ fontWeight: 600 }}
                  >
                    <Shield className="h-4 w-4" />
                    {isUpdatingRole ? t.savingRole : t.saveRole}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Groups", value: selectedUser.groupCount.toString() },
                  {
                    label: t.ownedGroups,
                    value: selectedUser.ownedGroupCount.toString(),
                  },
                  { label: "Expenses", value: selectedUser.expenseCount.toString() },
                  {
                    label: t.pendingSettlementsLabel,
                    value: selectedUser.pendingSettlementCount.toString(),
                  },
                  {
                    label: "Receipts",
                    value: selectedUser.receiptUploadCount.toString(),
                  },
                  {
                    label: t.totalPaid,
                    value: formatCurrency(
                      selectedUser.totalPaidAmount,
                      selectedUser.defaultCurrency || "USD",
                    ),
                  },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-[#F9FAFB] px-4 py-3">
                    <p className="text-xs uppercase text-[#9CA3AF]">{item.label}</p>
                    <p className="mt-1 text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <p className="mb-3 text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                  {t.groupMemberships}
                </p>
                {selectedUser.groups.length > 0 ? (
                  <div className="space-y-3">
                    {selectedUser.groups.map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center justify-between gap-3 rounded-xl bg-[#F9FAFB] px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-[#111827]" style={{ fontWeight: 600 }}>
                            {group.name}
                          </p>
                          <p className="truncate text-sm text-[#6B7280]">
                            Updated {formatLocalDate(group.updatedAt)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs ${
                            group.role === "owner"
                              ? "bg-[#FEF3C7] text-[#92400E]"
                              : "bg-[#EFF6FF] text-[#1D4ED8]"
                          }`}
                          style={{ fontWeight: 600 }}
                        >
                          {group.role}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#6B7280]">{t.noUserGroups}</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#6B7280]">{t.selectUserToManage}</p>
          )}
        </div>
      </div>
    </>
  );
}
