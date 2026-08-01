import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  deleteNotification,
  getNotificationDestination,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  NotificationBellButton,
  NotificationsPopover,
  type AppNotification,
} from "../../../domains/notifications";
import { useLanguage } from "../../../shared/providers/LanguageProvider";

export function AdminNotificationCenter() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [readingNotificationId, setReadingNotificationId] = useState<string | null>(null);
  const [deletingNotificationId, setDeletingNotificationId] = useState<string | null>(null);
  const [isMarkingAllAsRead, setIsMarkingAllAsRead] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);

  const loadNotificationList = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const [notificationsResponse, countResponse] = await Promise.all([
        getNotifications({ page: 1, limit: 20 }),
        getUnreadNotificationCount(),
      ]);
      setNotifications(notificationsResponse.notifications);
      setUnreadCount(countResponse.unreadCount);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t.loadNotificationListError,
      );
    } finally {
      setIsLoading(false);
    }
  }, [t.loadNotificationListError]);

  useEffect(() => {
    let isActive = true;

    void getUnreadNotificationCount()
      .then((response) => {
        if (isActive) setUnreadCount(response.unreadCount);
      })
      .catch(() => {
        // The bell stays usable even if the compact count request fails.
      });

    return () => {
      isActive = false;
    };
  }, []);

  function handleToggle() {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    void loadNotificationList();
  }

  async function handleNotificationClick(notification: AppNotification) {
    if (readingNotificationId) return;

    if (!notification.isRead) {
      try {
        setReadingNotificationId(notification.id);
        setErrorMessage("");
        const response = await markNotificationAsRead(notification.id);
        setNotifications((current) =>
          current.map((item) => (item.id === notification.id ? response.notification : item)),
        );
        setUnreadCount((current) => Math.max(0, current - 1));
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : t.markNotificationReadError,
        );
        return;
      } finally {
        setReadingNotificationId(null);
      }
    }

    const destination = getNotificationDestination(notification);
    if (destination) {
      setIsOpen(false);
      navigate(destination);
    }
  }

  async function handleMarkAllAsRead() {
    if (isMarkingAllAsRead) return;

    try {
      setIsMarkingAllAsRead(true);
      setErrorMessage("");
      await markAllNotificationsAsRead();
      const readAt = new Date().toISOString();
      setNotifications((current) =>
        current.map((notification) =>
          notification.isRead ? notification : { ...notification, isRead: true, readAt },
        ),
      );
      setUnreadCount(0);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t.markAllNotificationsReadError,
      );
    } finally {
      setIsMarkingAllAsRead(false);
    }
  }

  async function handleDelete(notification: AppNotification) {
    if (deletingNotificationId) return;

    try {
      setDeletingNotificationId(notification.id);
      setErrorMessage("");
      await deleteNotification(notification.id);
      setNotifications((current) => current.filter((item) => item.id !== notification.id));
      if (!notification.isRead) {
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t.deleteNotificationError,
      );
    } finally {
      setDeletingNotificationId(null);
    }
  }

  return (
    <div className="relative">
      <NotificationBellButton
        buttonRef={bellRef}
        isOpen={isOpen}
        unreadCount={unreadCount}
        onClick={handleToggle}
      />
      {isOpen ? (
        <NotificationsPopover
          anchorRef={bellRef}
          notifications={notifications}
          isLoading={isLoading}
          errorMessage={errorMessage}
          readingNotificationId={readingNotificationId}
          deletingNotificationId={deletingNotificationId}
          isMarkingAllAsRead={isMarkingAllAsRead}
          onClose={() => setIsOpen(false)}
          onRetry={() => void loadNotificationList()}
          onNotificationClick={(notification) => void handleNotificationClick(notification)}
          onMarkAllAsRead={() => void handleMarkAllAsRead()}
          onDelete={(notification) => void handleDelete(notification)}
        />
      ) : null}
    </div>
  );
}
