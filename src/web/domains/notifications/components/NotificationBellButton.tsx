import { Bell } from "lucide-react";
import type { Ref } from "react";
import { useLanguage } from "../../../shared/providers/LanguageProvider";

interface NotificationBellButtonProps {
  buttonRef?: Ref<HTMLButtonElement>;
  isOpen: boolean;
  onClick: () => void;
  unreadCount: number;
}

function normalizeUnreadCount(unreadCount: number) {
  if (!Number.isFinite(unreadCount)) {
    return 0;
  }

  return Math.max(0, Math.floor(unreadCount));
}

export function NotificationBellButton({
  buttonRef,
  isOpen,
  onClick,
  unreadCount,
}: NotificationBellButtonProps) {
  const { t } = useLanguage();
  const normalizedUnreadCount = normalizeUnreadCount(unreadCount);
  const badgeText = normalizedUnreadCount > 99 ? "99+" : String(normalizedUnreadCount);
  const unreadLabelTemplate =
    normalizedUnreadCount === 1
      ? t.unreadNotificationCount
      : t.unreadNotificationsCount;
  const unreadLabel = unreadLabelTemplate.replace(
    "{count}",
    String(normalizedUnreadCount),
  );
  const accessibleLabel =
    normalizedUnreadCount > 0
      ? `${t.notifications}, ${unreadLabel}`
      : t.notifications;

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onClick}
      aria-label={accessibleLabel}
      aria-expanded={isOpen}
      aria-haspopup="dialog"
      aria-controls={isOpen ? "notifications-popover" : undefined}
      className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-[#E5E7EB] bg-white transition-colors hover:border-[#BBF7D0] hover:bg-[#F0FAF5]"
      title={t.notifications}
    >
      <Bell className="h-4 w-4 text-[#6B7280]" aria-hidden="true" />
      {normalizedUnreadCount > 0 ? (
        <span
          aria-hidden="true"
          className="absolute -right-1.5 -top-1.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full border-2 border-white bg-[#EF4444] px-1 text-[9px] leading-none text-white shadow-sm"
          style={{ fontWeight: 700 }}
        >
          {badgeText}
        </span>
      ) : null}
    </button>
  );
}
