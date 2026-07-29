import {
  ChevronDown,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  FileType,
  Loader2,
  LogOut,
  Printer,
  Shield,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, Outlet, useLocation, useNavigate, useOutletContext } from "react-router";
import { AdminRoute } from "../guards/AdminRoute";
import type { AdminDashboardStats } from "../../../domains/admin-reporting";
import {
  downloadAdminUsersExport,
  fetchAdminUsersExportText,
  getAdminDashboard,
} from "../../../domains/admin-reporting";
import { clearStoredUser, getStoredBanNotice, useStoredUser } from "../../../domains/auth";
import { useFeedback } from "../../../shared/providers/FeedbackProvider";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import { Sidebar } from "../../private/layout/Sidebar";
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
  const [isExporting, setIsExporting] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [exportMenuPosition, setExportMenuPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const exportMenuPortalRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useFeedback();
  const { t } = useLanguage();
  const user = useStoredUser();
  const banNotice = getStoredBanNotice();

  const isBanned = Boolean(user?.isBanned || banNotice);

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

  useEffect(() => {
    if (!isExportMenuOpen) {
      return;
    }

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const clickedTrigger = exportMenuRef.current?.contains(target);
      const clickedMenu = exportMenuPortalRef.current?.contains(target);

      if (!clickedTrigger && !clickedMenu) {
        setIsExportMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isExportMenuOpen]);

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
  const isUsersPage =
    location.pathname === "/admin" || location.pathname.startsWith("/admin/users");

  function parseCsv(csvText: string): string[][] {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentField = "";
    let isInsideQuotes = false;

    for (let index = 0; index < csvText.length; index += 1) {
      const char = csvText[index];

      if (isInsideQuotes) {
        if (char === '"' && csvText[index + 1] === '"') {
          currentField += '"';
          index += 1;
        } else if (char === '"') {
          isInsideQuotes = false;
        } else {
          currentField += char;
        }
        continue;
      }

      if (char === '"') {
        isInsideQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\n" || char === "\r") {
        if (char === "\r" && csvText[index + 1] === "\n") {
          index += 1;
        }
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }

    if (currentField.length > 0 || currentRow.length > 0) {
      currentRow.push(currentField);
      rows.push(currentRow);
    }

    return rows.filter((row) => row.some((cell) => cell.trim().length > 0));
  }

  function buildPrintableUsersHtml(csvText: string) {
    const rows = parseCsv(csvText);
    const [headerRow, ...bodyRows] = rows;
    const headerHtml = (headerRow ?? [])
      .map((cell) => `<th>${cell}</th>`)
      .join("");
    const bodyHtml = bodyRows
      .map(
        (row) =>
          `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`,
      )
      .join("");

    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Splitly - User Export</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
      h1 { font-size: 18px; margin-bottom: 4px; }
      p { font-size: 12px; color: #6B7280; margin-top: 0; margin-bottom: 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th, td { border: 1px solid #E5E7EB; padding: 6px 8px; text-align: left; white-space: nowrap; }
      th { background: #F9FAFB; }
    </style>
  </head>
  <body>
    <h1>Splitly - User Export</h1>
    <p>Generated on ${new Date().toLocaleString()}</p>
    <table>
      <thead><tr>${headerHtml}</tr></thead>
      <tbody>${bodyHtml}</tbody>
    </table>
  </body>
</html>`;
  }

  async function handleCsvExport() {
    if (!isUsersPage) {
      return;
    }

    setIsExportMenuOpen(false);

    try {
      setIsExporting(true);
      await downloadAdminUsersExport();
      showToast({
        variant: "success",
        message: "User export started successfully.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message:
          error instanceof Error ? error.message : "Unable to export users.",
      });
    } finally {
      setIsExporting(false);
    }
  }

  async function handlePrintExport() {
    if (!isUsersPage) {
      return;
    }

    setIsExportMenuOpen(false);

    try {
      setIsExporting(true);
      const csvText = await fetchAdminUsersExportText();
      const printFrame = document.createElement("iframe");

      printFrame.style.position = "fixed";
      printFrame.style.right = "0";
      printFrame.style.bottom = "0";
      printFrame.style.width = "0";
      printFrame.style.height = "0";
      printFrame.style.border = "0";
      document.body.appendChild(printFrame);

      const frameDocument = printFrame.contentWindow?.document;

      if (!frameDocument) {
        throw new Error("Unable to open the print preview.");
      }

      frameDocument.open();
      frameDocument.write(buildPrintableUsersHtml(csvText));
      frameDocument.close();

      printFrame.onload = () => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        window.setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      };
    } catch (error) {
      showToast({
        variant: "error",
        message:
          error instanceof Error ? error.message : "Unable to print users.",
      });
    } finally {
      setIsExporting(false);
    }
  }

  async function handleCopyExport() {
    if (!isUsersPage) {
      return;
    }

    setIsExportMenuOpen(false);

    try {
      setIsExporting(true);
      const csvText = await fetchAdminUsersExportText();

      await navigator.clipboard.writeText(csvText);
      showToast({
        variant: "success",
        message: "User data copied to clipboard.",
      });
    } catch (error) {
      showToast({
        variant: "error",
        message:
          error instanceof Error ? error.message : "Unable to copy users.",
      });
    } finally {
      setIsExporting(false);
    }
  }

  const exportMenuOptions = [
    { key: "print", icon: Printer, label: t.exportPrint, onSelect: () => void handlePrintExport() },
    { key: "csv", icon: FileText, label: t.exportCsv, onSelect: () => void handleCsvExport() },
    {
      key: "excel",
      icon: FileSpreadsheet,
      label: t.exportExcel,
      onSelect: () => void handleCsvExport(),
    },
    { key: "pdf", icon: FileType, label: t.exportPdf, onSelect: () => void handlePrintExport() },
    { key: "copy", icon: Copy, label: t.exportCopy, onSelect: () => void handleCopyExport() },
  ];

  function handleLogout() {
    clearStoredUser();
    navigate("/login");
  }

  return (
    <AdminRoute>
      <div className="min-h-screen bg-[#F6FBF8] lg:pl-60">
        <Sidebar currentPath={location.pathname} />
        {isBanned ? (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-[#FECACA] bg-white p-6 shadow-2xl">
              <div className="rounded-2xl bg-[#FEF2F2] px-4 py-3 text-center">
                <p className="text-lg text-[#991B1B]" style={{ fontWeight: 800 }}>
                  Your account has been banned
                </p>
                <p className="mt-2 text-sm text-[#7F1D1D]">
                  {banNotice?.reason || user?.bannedReason || "You can no longer use this account."}
                </p>
              </div>
              <p className="mt-4 text-sm text-[#6B7280]">
                Please log out and create a new account if you need to continue using the app.
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-3 text-sm text-white transition-colors hover:bg-[#1F2937]"
                style={{ fontWeight: 700 }}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        ) : null}
        <div className="mx-auto max-w-7xl px-6 pb-8 pt-16 lg:pt-8">
          <div className="relative overflow-hidden rounded-3xl border border-[#E5E7EB] bg-gradient-to-br from-white via-white to-[#FEF2F2] px-6 py-6 sm:px-8 sm:py-7 mb-8">
            <div
              className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-[#FCA5A5]/25 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FCA5A5] to-[#DC2626]"
                  style={{ boxShadow: "0 4px 12px rgba(220, 38, 38, 0.25)" }}
                >
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1
                      className="text-[#111827]"
                      style={{ fontSize: "1.625rem", fontWeight: 800, letterSpacing: "-0.02em" }}
                    >
                      {t.adminTitle}
                    </h1>
                    <span
                      className="rounded-full bg-[#FEF3C7] px-2 py-0.5 text-[10px] uppercase tracking-wide text-[#92400E]"
                      style={{ fontWeight: 700 }}
                    >
                      admin
                    </span>
                  </div>
                  <p className="text-sm text-[#6B7280] mt-0.5">{t.adminDesc}</p>
                </div>
              </div>
              <div className="relative" ref={exportMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    if (!isUsersPage) {
                      return;
                    }

                    const buttonRect = exportMenuRef.current?.getBoundingClientRect();

                    if (buttonRect) {
                      setExportMenuPosition({
                        top: buttonRect.bottom + 8,
                        right: window.innerWidth - buttonRect.right,
                      });
                    }

                    setIsExportMenuOpen((open) => !open);
                  }}
                  disabled={!isUsersPage || isExporting}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                    isUsersPage
                      ? "bg-[#111827] text-white shadow-sm hover:bg-[#1F2937] active:scale-[0.98]"
                      : "border border-[#E5E7EB] bg-white text-[#9CA3AF]"
                  }`}
                  style={{ fontWeight: 600 }}
                  title={isUsersPage ? t.exportData : "User export is available on the Users tab."}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {isExporting ? "Exporting..." : t.exportData}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${isExportMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isExportMenuOpen && exportMenuPosition &&
                  createPortal(
                    <div
                      ref={exportMenuPortalRef}
                      className="fixed z-[140] w-44 overflow-hidden rounded-xl border border-[#E5E7EB] bg-white py-1.5 shadow-[0_12px_32px_rgba(17,24,39,0.14)]"
                      style={{ top: exportMenuPosition.top, right: exportMenuPosition.right }}
                    >
                      {exportMenuOptions.map(({ key, icon: OptionIcon, label, onSelect }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={onSelect}
                          className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm text-[#374151] transition-colors hover:bg-[#F9FAFB]"
                          style={{ fontWeight: 500 }}
                      >
                        <OptionIcon className="h-4 w-4 text-[#6B7280]" />
                        {label}
                      </button>
                    ))}
                    </div>,
                    document.body,
                  )}
              </div>
            </div>
          </div>

          {errorMessage && (
            <div className="mb-6 rounded-2xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {errorMessage}
            </div>
          )}

          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-3">
            {statCards.map(({ bg, icon: Icon, iconBg, key, label, value }) => (
              <div
                key={key}
                className={`${bg} rounded-2xl border border-[#FFFFFF] p-5 shadow-[0_1px_2px_rgba(17,24,39,0.06)] transition-all duration-200 hover:shadow-[0_8px_20px_rgba(17,24,39,0.08)] hover:-translate-y-0.5`}
              >
                <div
                  className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${iconBg} shadow-sm`}
                >
                  <Icon className="h-[18px] w-[18px] text-[#065f46]" strokeWidth={2.25} />
                </div>
                {isLoadingDashboard ? (
                  <div className="h-8 w-14 animate-pulse rounded-lg bg-black/10 mb-1" />
                ) : (
                  <p
                    className="text-[#111827]"
                    style={{ fontSize: "1.625rem", fontWeight: 800, letterSpacing: "-0.02em" }}
                  >
                    {value}
                  </p>
                )}
                <p className="mt-1 text-xs text-[#4B5563]" style={{ fontWeight: 600 }}>
                  {label}
                </p>
              </div>
            ))}
          </div>

          <div className="mb-6 flex items-center gap-1 overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white p-1 [scrollbar-width:thin]">
            {tabs.map(({ icon: Icon, key, label, path }) => {
              const isActive =
                path === "/admin"
                  ? location.pathname === "/admin"
                  : location.pathname.startsWith(path);

              return (
                <Link
                  key={key}
                  to={path}
                  className={`flex flex-shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm transition-all duration-150 ${
                    isActive
                      ? "bg-[#16A34A] text-white shadow-sm"
                      : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="whitespace-nowrap">{label}</span>
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