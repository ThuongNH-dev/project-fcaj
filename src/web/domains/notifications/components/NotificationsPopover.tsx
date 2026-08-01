import {
  Bell,
  CheckCheck,
  Clock3,
  HandCoins,
  ReceiptText,
  Scale,
  RefreshCw,
  Sparkles,
  Trash2,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import type {
  AppNotification,
  NotificationType,
} from "../models/notifications.types";

const NOTIFICATION_ICONS: Record<NotificationType, LucideIcon> = {
  expense_added: ReceiptText,
  payment_received: HandCoins,
  settlement_reminder: Clock3,
  group_invite: UserPlus,
  product_update: Sparkles,
  settlement_dispute_created: Scale,
};

interface NotificationsPopoverProps {
  anchorRef: RefObject<HTMLElement | null>;
  deletingNotificationId?: string | null;
  errorMessage?: string;
  isLoading?: boolean;
  isMarkingAllAsRead?: boolean;
  notifications: AppNotification[];
  onClose: () => void;
  onDelete?: (notification: AppNotification) => void;
  onMarkAllAsRead?: () => void;
  onNotificationClick?: (notification: AppNotification) => void;
  onRetry?: () => void;
  readingNotificationId?: string | null;
}

function formatNotificationDate(value: string, lang: "en" | "vi") {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(lang === "vi" ? "vi-VN" : "en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function NotificationsPopover({
  anchorRef,
  deletingNotificationId = null,
  errorMessage = "",
  isLoading = false,
  isMarkingAllAsRead = false,
  notifications,
  onClose,
  onDelete,
  onMarkAllAsRead,
  onNotificationClick,
  onRetry,
  readingNotificationId = null,
}: NotificationsPopoverProps) {
  const { lang, t } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ right: 16, top: 64 });
  const hasUnreadNotifications = notifications.some(
    (notification) => !notification.isRead,
  );

  useLayoutEffect(() => {
    function updatePosition() {
      const anchor = anchorRef.current;

      if (!anchor) {
        return;
      }

      const rect = anchor.getBoundingClientRect();
      setPosition({
        right: Math.max(16, window.innerWidth - rect.right),
        top: rect.bottom + 8,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [anchorRef]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;

      if (
        panelRef.current?.contains(target) ||
        anchorRef.current?.contains(target)
      ) {
        return;
      }

      onClose();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        anchorRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [anchorRef, onClose]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      ref={panelRef}
      id="notifications-popover"
      role="dialog"
      aria-label={t.notifications}
      className="fixed z-[100] flex max-h-[calc(100vh-2rem)] w-[min(24rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-2xl"
      style={{ right: position.right, top: position.top }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-[#F3F4F6] px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="truncate text-sm text-[#111827]" style={{ fontWeight: 700 }}>
            {t.notifications}
          </h2>
          <p className="mt-0.5 text-xs text-[#9CA3AF]">
            {t.notificationCenterDesc}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-1">
          {hasUnreadNotifications && onMarkAllAsRead ? (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              disabled={isMarkingAllAsRead}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs text-[#15803D] transition-colors hover:bg-[#F0FAF5] disabled:cursor-not-allowed disabled:opacity-60"
              style={{ fontWeight: 600 }}
            >
              <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {isMarkingAllAsRead ? t.markingAllAsRead : t.markAllAsRead}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeNotifications}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="min-h-0 overflow-y-auto" aria-live="polite">
        {isLoading ? (
          <div className="space-y-3 p-4">
            <p className="sr-only">{t.loadingNotificationList}</p>
            {[0, 1, 2].map((item) => (
              <div key={item} className="flex animate-pulse gap-3 py-2">
                <div className="h-9 w-9 flex-shrink-0 rounded-xl bg-[#E5E7EB]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-2/5 rounded bg-[#E5E7EB]" />
                  <div className="h-3 w-full rounded bg-[#F3F4F6]" />
                  <div className="h-3 w-1/3 rounded bg-[#F3F4F6]" />
                </div>
              </div>
            ))}
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col items-center px-6 py-10 text-center">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#FEF2F2]">
              <Bell className="h-5 w-5 text-[#B91C1C]" aria-hidden="true" />
            </div>
            <p className="text-sm text-[#B91C1C]">{errorMessage}</p>
            {onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] px-3 py-2 text-xs text-[#374151] transition-colors hover:bg-[#F9FAFB]"
                style={{ fontWeight: 600 }}
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                {t.retry}
              </button>
            ) : null}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0FAF5]">
              <Bell className="h-6 w-6 text-[#16A34A]" aria-hidden="true" />
            </div>
            <h3 className="text-sm text-[#111827]" style={{ fontWeight: 700 }}>
              {t.noNotifications}
            </h3>
            <p className="mt-1 max-w-64 text-xs text-[#6B7280]">
              {t.noNotificationsDesc}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[#F3F4F6]">
            {notifications.map((notification) => {
              const Icon = NOTIFICATION_ICONS[notification.type];
              const isDeleting = deletingNotificationId === notification.id;
              const isReading = readingNotificationId === notification.id;

              return (
                <li
                  key={notification.id}
                  className={notification.isRead ? "bg-white" : "bg-[#F0FAF5]/60"}
                >
                  <div className="flex items-start gap-2 px-3 py-3">
                    <button
                      type="button"
                      onClick={() => onNotificationClick?.(notification)}
                      disabled={isReading}
                      aria-busy={isReading}
                      className="flex min-w-0 flex-1 items-start gap-3 rounded-xl p-1 text-left transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-60"
                    >
                      <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#EAFBF3] text-[#15803D]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-2">
                          <span
                            className="min-w-0 flex-1 truncate text-sm text-[#111827]"
                            style={{ fontWeight: notification.isRead ? 600 : 700 }}
                          >
                            {notification.title}
                          </span>
                          {!notification.isRead ? (
                            <span
                              className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#16A34A]"
                              aria-label={t.unreadNotification}
                            />
                          ) : null}
                        </span>
                        <span className="mt-0.5 block line-clamp-2 text-xs text-[#6B7280]">
                          {notification.message}
                        </span>
                        <time
                          dateTime={notification.createdAt}
                          className="mt-1.5 block text-[11px] text-[#9CA3AF]"
                        >
                          {formatNotificationDate(notification.createdAt, lang)}
                        </time>
                      </span>
                    </button>
                    {onDelete ? (
                      <button
                        type="button"
                        onClick={() => onDelete(notification)}
                        disabled={isDeleting || isReading}
                        aria-label={`${t.deleteNotification}: ${notification.title}`}
                        className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[#9CA3AF] transition-colors hover:bg-[#FEF2F2] hover:text-[#B91C1C] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>,
    document.body,
  );
}
