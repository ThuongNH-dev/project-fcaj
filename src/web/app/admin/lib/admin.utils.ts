import {
  Activity,
  Receipt,
  Shield,
  TrendingUp,
  Users,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type {
  AdminActivityLog,
  AdminSettlementRecord,
  AdminUploadRecord,
} from "../../../domains/admin-reporting";
import {
  formatCurrency,
  formatDateTime,
  formatFileSize,
  formatLocalDate,
} from "../../../shared/lib/formatters";
import { useLanguage } from "../../../shared/providers/LanguageProvider";

type Translator = ReturnType<typeof useLanguage>["t"];

export interface AdminTabDefinition {
  icon: LucideIcon;
  key: string;
  label: string;
  path: string;
}

export { formatCurrency, formatDateTime, formatFileSize, formatLocalDate };

export function getAdminTabs(t: Translator): AdminTabDefinition[] {
  return [
    { key: "users", label: t.users, icon: Users, path: "/admin/users" },
    { key: "groups", label: t.groups, icon: Activity, path: "/admin/groups" },
    {
      key: "settlements",
      label: t.settlements,
      icon: TrendingUp,
      path: "/admin/settlements",
    },
    { key: "uploads", label: t.uploads, icon: Receipt, path: "/admin/uploads" },
    { key: "rejected", label: t.rejectedTx, icon: XCircle, path: "/admin/rejected" },
    { key: "logs", label: t.activityLogs, icon: Activity, path: "/admin/logs" },
  ];
}

export function getLogTypeLabel(eventType: AdminActivityLog["eventType"]) {
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

export function getSettlementStatusLabel(
  status: AdminSettlementRecord["settlementStatus"],
) {
  return status === "settled" ? "Settled" : "Pending";
}

export function getUploadStatusLabel(upload: AdminUploadRecord, t: Translator) {
  if (upload.processingStatus === "processed") {
    return t.processed;
  }

  if (upload.processingStatus === "failed") {
    return t.failedErrors;
  }

  return t.pendingReview;
}

export function getAdminStatCards(stats: {
  newUsersLast7Days?: number;
  totalAdmins?: number;
  totalExpenses?: number;
  totalGroups?: number;
  totalReceiptUploads?: number;
  totalUsers?: number;
}, t: Translator) {
  return [
    {
      bg: "bg-[#F0FAF5]",
      icon: Users,
      iconBg: "bg-[#7EDDBA]",
      key: "total-users",
      label: t.totalUsers,
      value: stats.totalUsers?.toString() ?? "--",
    },
    {
      bg: "bg-[#EFF6FF]",
      icon: Activity,
      iconBg: "bg-[#93C5FD]",
      key: "total-groups",
      label: t.totalGroups,
      value: stats.totalGroups?.toString() ?? "--",
    },
    {
      bg: "bg-[#FFF7ED]",
      icon: Receipt,
      iconBg: "bg-[#FDBA74]",
      key: "total-expenses",
      label: "Expenses",
      value: stats.totalExpenses?.toString() ?? "--",
    },
    {
      bg: "bg-[#F0FDF4]",
      icon: Receipt,
      iconBg: "bg-[#86EFAC]",
      key: "total-uploads",
      label: "Uploads",
      value: stats.totalReceiptUploads?.toString() ?? "--",
    },
    {
      bg: "bg-[#FEFCE8]",
      icon: Shield,
      iconBg: "bg-[#FCD34D]",
      key: "total-admins",
      label: "Admin Accounts",
      value: stats.totalAdmins?.toString() ?? "--",
    },
    {
      bg: "bg-[#FEF2F2]",
      icon: Activity,
      iconBg: "bg-[#FCA5A5]",
      key: "new-users-last-7-days",
      label: "New Users (7 Days)",
      value: stats.newUsersLast7Days?.toString() ?? "--",
    },
  ];
}
