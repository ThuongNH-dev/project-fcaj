import { Download, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useOutletContext } from "react-router";
import { AdminRoute } from "../guards/AdminRoute";
import type { AdminDashboardStats } from "../../../domains/admin-reporting";
import { getAdminDashboard } from "../../../domains/admin-reporting";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import { getAdminStatCards, getAdminTabs } from "../lib/admin.utils";

interface AdminLayoutContextValue {
  isLoadingDashboard: boolean;
  refreshDashboard: () => Promise<void>;
  stats: AdminDashboardStats | null;
}

export function useAdminLayoutContext() {
  return useOutletContext<AdminLayoutContextValue>();
}

export function AdminLayout() {
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const location = useLocation();
  const { t } = useLanguage();

  async function loadDashboard() {
    try {
      setIsLoadingDashboard(true);
      setErrorMessage("");
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

  useEffect(() => {
    void loadDashboard();
  }, []);

  const statCards = getAdminStatCards(
    {
      newUsersLast7Days: stats?.newUsersLast7Days,
      totalAdmins: stats?.totalAdmins,
      totalExpenses: stats?.totalExpenses,
      totalGroups: stats?.totalGroups,
      totalReceiptUploads: stats?.totalReceiptUploads,
      totalUsers: stats?.totalUsers,
    },
    t,
  );
  const tabs = getAdminTabs(t);

  return (
    <AdminRoute>
      <div className="min-h-screen bg-[#F6FBF8] lg:pl-60">
        <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 lg:pt-8">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FEE2E2]">
                <Shield className="h-5 w-5 text-[#991b1b]" />
              </div>
              <div>
                <h1
                  className="text-[#111827]"
                  style={{ fontSize: "1.5rem", fontWeight: 800 }}
                >
                  {t.adminTitle}
                </h1>
                <p className="text-sm text-[#6B7280]">{t.adminDesc}</p>
              </div>
            </div>
            <button
              className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2.5 text-sm text-[#374151] transition-all hover:border-[#7EDDBA] hover:bg-[#F0FAF5]"
              style={{ fontWeight: 600 }}
            >
              <Download className="h-4 w-4" />
              {t.exportData}
            </button>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {errorMessage}
            </div>
          )}

          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {statCards.map(({ bg, icon: Icon, iconBg, key, label, value }) => (
              <div key={key} className={`${bg} rounded-2xl border border-white p-5`}>
                <div
                  className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${iconBg}`}
                >
                  <Icon className="h-4 w-4 text-[#065f46]" />
                </div>
                <p className="text-[#111827]" style={{ fontSize: "1.5rem", fontWeight: 800 }}>
                  {isLoadingDashboard ? "--" : value}
                </p>
                <p className="mt-0.5 text-xs text-[#6B7280]">{label}</p>
              </div>
            ))}
          </div>

          <div className="mb-5 flex w-fit flex-wrap items-center gap-1 rounded-xl border border-[#E5E7EB] bg-white p-1">
            {tabs.map(({ icon: Icon, key, label, path }) => {
              const isActive =
                path === "/admin"
                  ? location.pathname === "/admin"
                  : location.pathname.startsWith(path);

              return (
                <Link
                  key={key}
                  to={path}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all ${
                    isActive
                      ? "bg-[#16A34A] text-white shadow-sm"
                      : "text-[#6B7280] hover:text-[#111827]"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </Link>
              );
            })}
          </div>

          <Outlet context={{ isLoadingDashboard, refreshDashboard: loadDashboard, stats }} />
        </div>
      </div>
    </AdminRoute>
  );
}
