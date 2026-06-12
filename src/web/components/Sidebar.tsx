import { useState } from "react";
import { useNavigate } from "react-router";
import {
  LayoutDashboard, Users, Receipt, TrendingUp, FileText, Shield,
  Settings, Leaf, ChevronRight, Menu, X, LogOut
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import { clearStoredUser, getStoredUser, getUserInitials } from "../api/auth";

interface SidebarProps {
  currentPath: string;
}


export function Sidebar({ currentPath }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { lang, setLang, t } = useLanguage();
  const user = getStoredUser();
  const navigate = useNavigate();

  const navItems = [
    { icon: LayoutDashboard, label: t.dashboard, path: "/dashboard" },
    { icon: Users, label: t.groups, path: "/groups" },
    { icon: Receipt, label: t.expenses, path: "/expenses" },
    { icon: TrendingUp, label: t.settlements, path: "/settlement" },
    { icon: FileText, label: t.receipts, path: "/receipts" },
    ...(user?.role === "admin"
      ? [{ icon: Shield, label: t.admin, path: "/admin" }]
      : []),
    { icon: Settings, label: t.settings, path: "/profile" },
  ];

  const displayName = user ? `${user.firstName} ${user.lastName}` : "Guest";
  const displayEmail = user?.email ?? "No active session";
  const userInitials = user ? getUserInitials(user) : "GU";
  const handleSignOut = () => {
    clearStoredUser();
    navigate("/login");
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo + language toggle */}
      <div className="border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3 px-5 py-4">
          <div className="w-8 h-8 bg-[#7EDDBA] rounded-xl flex items-center justify-center flex-shrink-0">
            <Leaf className="w-4 h-4 text-[#065f46]" strokeWidth={2.5} />
          </div>
          {!collapsed && (
            <span className="text-[#111827]" style={{ fontWeight: 700, fontSize: "1.0625rem" }}>
              Splitly
            </span>
          )}
          <button
            className="ml-auto p-1 rounded-lg text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F0FAF5] hidden lg:flex"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${collapsed ? "" : "rotate-180"}`} />
          </button>
        </div>
        {/* Language switcher — always visible in header */}
        <div className={`px-3 pb-3 ${collapsed ? "flex justify-center" : ""}`}>
          <div className="flex items-center gap-0.5 bg-[#F3F4F6] rounded-xl p-0.5 w-full">
            <button
              onClick={() => setLang("en")}
              className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${lang === "en" ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#374151]"}`}
              style={{ fontWeight: 600 }}
            >
              EN
            </button>
            <button
              onClick={() => setLang("vi")}
              className={`flex-1 py-1.5 rounded-lg text-xs transition-all ${lang === "vi" ? "bg-white text-[#111827] shadow-sm" : "text-[#6B7280] hover:text-[#374151]"}`}
              style={{ fontWeight: 600 }}
            >
              VI
            </button>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, path }) => {
          const active =
            currentPath === path ||
            (path === "/groups" && currentPath.startsWith("/groups/"));
          return (
            <button
              key={path}
              onClick={() => { navigate(path); setMobileOpen(false); }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all group w-full ${
                active
                  ? "bg-[#F0FAF5] text-[#16A34A]"
                  : "text-[#6B7280] hover:text-[#111827] hover:bg-[#F9FAFB]"
              }`}
              style={{ fontWeight: active ? 600 : 500 }}
            >
              <Icon className={`w-4.5 h-4.5 flex-shrink-0 ${active ? "text-[#16A34A]" : "text-[#9CA3AF] group-hover:text-[#374151]"}`} />
              {!collapsed && <span>{label}</span>}
              {active && !collapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User profile at bottom */}
      <div className="border-t border-[#E5E7EB] px-3 py-4">
        <div className={`flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[#F0FAF5] transition-colors ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-[#7EDDBA] flex items-center justify-center text-[#065f46] flex-shrink-0" style={{ fontWeight: 700, fontSize: "0.8125rem" }}>
            {userInitials}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#111827] truncate" style={{ fontWeight: 600 }}>{displayName}</p>
              <p className="text-xs text-[#9CA3AF] truncate">{displayEmail}</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={handleSignOut}
              className="p-1.5 rounded-lg hover:bg-[#FEF2F2] text-[#9CA3AF] hover:text-[#EF4444] transition-colors flex-shrink-0"
              title={t.signOut}
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
        {collapsed && (
          <button
            onClick={handleSignOut}
            className="w-full flex justify-center mt-1 p-2 rounded-xl hover:bg-[#FEF2F2] text-[#9CA3AF] hover:text-[#EF4444] transition-colors"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden bg-white border border-[#E5E7EB] rounded-xl p-2 shadow-sm"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5 text-[#374151]" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
            <button className="absolute top-4 right-4 p-1.5 rounded-xl hover:bg-[#F0FAF5]" onClick={() => setMobileOpen(false)}>
              <X className="w-4 h-4 text-[#6B7280]" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-white border-r border-[#E5E7EB] transition-all duration-200 z-30 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <SidebarContent />
      </div>

      {/* Spacer for content */}
      <div className={`hidden lg:block flex-shrink-0 transition-all duration-200 ${collapsed ? "w-16" : "w-60"}`} />
    </>
  );
}
