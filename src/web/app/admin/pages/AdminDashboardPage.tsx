import { Users } from "lucide-react";
import { useMemo, useState } from "react";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import { AdminEmptyState } from "../components/AdminEmptyState";
import { AdminSearchInput } from "../components/AdminSearchInput";
import { useAdminLayoutContext } from "../layout/AdminLayout";

export function AdminDashboardPage() {
  const [search, setSearch] = useState("");
  const { stats, isLoadingDashboard } = useAdminLayoutContext();
  const { t } = useLanguage();

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return (stats?.recentUsers ?? []).filter((user) => {
      if (!keyword) {
        return true;
      }

      return (
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
      );
    });
  }, [search, stats?.recentUsers]);

  return (
    <>
      <AdminSearchInput
        placeholder={t.searchUsers}
        value={search}
        onChange={setSearch}
      />

      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
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
              <p className="mt-1 text-sm text-[#6B7280]">
                Newest accounts in the system.
              </p>
            </div>
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="text-[#111827]" style={{ fontWeight: 600 }}>
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="truncate text-sm text-[#6B7280]">{user.email}</p>
                </div>
                <div className="shrink-0 text-right">
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
          <AdminEmptyState
            icon={Users}
            title={t.noUsersYet}
            description={t.noUsersDesc}
          />
        )}
      </div>
    </>
  );
}
