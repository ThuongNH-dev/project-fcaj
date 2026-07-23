import type { Request, Response } from "express";
import {
  getCurrentUserNotificationPreferences,
  getNotificationsForUser,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  updateCurrentUserNotificationPreferences,
} from "./notifications.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// Notification Preferences
// ─────────────────────────────────────────────────────────────────────────────

export async function getCurrentUserNotificationPreferencesHandler(
  req: Request,
  res: Response,
) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  try {
    const notificationPreferences = await getCurrentUserNotificationPreferences(
      userId,
    );

    if (!notificationPreferences) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Notification preferences fetched successfully.",
      notificationPreferences,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to fetch notification preferences.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function updateCurrentUserNotificationPreferencesHandler(
  req: Request,
  res: Response,
) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({
      ok: false,
      message: "Request body must be an object.",
    });
  }

  const body = req.body as Record<string, unknown>;

  // Expect the payload under the "notificationPreferences" key
  const rawPreferences = body.notificationPreferences;

  if (
    !rawPreferences ||
    typeof rawPreferences !== "object" ||
    Array.isArray(rawPreferences)
  ) {
    return res.status(400).json({
      ok: false,
      message: "notificationPreferences object is required.",
    });
  }

  const preferencesInput = rawPreferences as Record<string, unknown>;

  if (Object.keys(preferencesInput).length === 0) {
    return res.status(400).json({
      ok: false,
      message: "At least one notification preference is required.",
    });
  }

  try {
    const updatedNotificationPreferences =
      await updateCurrentUserNotificationPreferences(userId, preferencesInput);

    if (!updatedNotificationPreferences) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Notification preferences updated successfully.",
      notificationPreferences: updatedNotificationPreferences,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update notification preferences.";

    const is400 =
      message === "At least one notification preference is required." ||
      message.includes('Notification preference "') ||
      message.includes("Unknown notification preference field:");

    return res.status(is400 ? 400 : 503).json({
      ok: false,
      message,
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// In-app Notifications
// ─────────────────────────────────────────────────────────────────────────────

export async function getNotificationsHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  let page = 1;
  if (req.query.page !== undefined) {
    const rawPage = Number(req.query.page);
    if (!Number.isInteger(rawPage) || rawPage < 1) {
      return res.status(400).json({
        ok: false,
        message: "Page must be a positive integer.",
      });
    }
    page = rawPage;
  }

  let limit = 20;
  if (req.query.limit !== undefined) {
    const rawLimit = Number(req.query.limit);
    if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 100) {
      return res.status(400).json({
        ok: false,
        message: "Limit must be a positive integer between 1 and 100.",
      });
    }
    limit = rawLimit;
  }

  try {
    const { notifications, total } = await getNotificationsForUser(userId, {
      page,
      limit,
    });

    return res.status(200).json({
      ok: true,
      message: "Notifications fetched successfully.",
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch notifications.";

    return res.status(503).json({ ok: false, message });
  }
}

export async function getUnreadNotificationCountHandler(
  req: Request,
  res: Response,
) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  try {
    const count = await getUnreadNotificationCount(userId);

    return res.status(200).json({
      ok: true,
      message: "Unread notification count fetched successfully.",
      unreadCount: count,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to fetch unread notification count.";

    return res.status(503).json({ ok: false, message });
  }
}

export async function markNotificationAsReadHandler(
  req: Request,
  res: Response,
) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  const notificationId = String(req.params.notificationId);

  try {
    const notification = await markNotificationAsRead(notificationId, userId);

    if (!notification) {
      return res.status(404).json({
        ok: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Notification marked as read.",
      notification,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to mark notification as read.";

    return res.status(503).json({ ok: false, message });
  }
}

export async function markAllNotificationsAsReadHandler(
  req: Request,
  res: Response,
) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  try {
    const modifiedCount = await markAllNotificationsAsRead(userId);

    return res.status(200).json({
      ok: true,
      message: "All notifications marked as read.",
      modifiedCount,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to mark all notifications as read.";

    return res.status(503).json({ ok: false, message });
  }
}

export async function deleteNotificationHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  const notificationId = String(req.params.notificationId);

  try {
    const result = await deleteNotification(notificationId, userId);

    if (result === null) {
      return res.status(404).json({
        ok: false,
        message: "Notification not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Notification deleted successfully.",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete notification.";

    return res.status(503).json({ ok: false, message });
  }
}
