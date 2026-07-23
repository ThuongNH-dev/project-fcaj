import type { Request, Response } from "express";
import {
  getCurrentUserNotificationPreferences,
  getNotificationsForUser,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification,
  updateCurrentUserNotificationPreferences,
  syncSettlementRemindersForUser,
} from "./notifications.service.js";

// ─────────────────────────────────────────────────────────────────────────────
// Notification Preferences
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/notifications/preferences:
 *   get:
 *     summary: Get current user notification preferences
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferences fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 notificationPreferences:
 *                   type: object
 *                   properties:
 *                     expenseAdded:
 *                       type: boolean
 *                     paymentReceived:
 *                       type: boolean
 *                     settlementReminders:
 *                       type: boolean
 *                     groupInvites:
 *                       type: boolean
 *                     productUpdatesAndTips:
 *                       type: boolean
 *       401:
 *         description: Unauthenticated.
 *       404:
 *         description: User not found.
 *       503:
 *         description: Database failure.
 */
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

/**
 * @swagger
 * /api/notifications/preferences:
 *   patch:
 *     summary: Update current user notification preferences
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationPreferences:
 *                 type: object
 *                 properties:
 *                   expenseAdded:
 *                     type: boolean
 *                   paymentReceived:
 *                     type: boolean
 *                   settlementReminders:
 *                     type: boolean
 *                   groupInvites:
 *                     type: boolean
 *                   productUpdatesAndTips:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated successfully.
 *       400:
 *         description: Invalid preference fields or values.
 *       401:
 *         description: Unauthenticated.
 *       404:
 *         description: User not found.
 *       503:
 *         description: Database failure.
 */
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

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get notifications for the current user
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page.
 *     responses:
 *       200:
 *         description: Notifications fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 notifications:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       recipientUserId:
 *                         type: string
 *                       actorUserId:
 *                         type: string
 *                         nullable: true
 *                       type:
 *                         type: string
 *                         enum: [expense_added, payment_received, settlement_reminder, group_invite, product_update]
 *                       title:
 *                         type: string
 *                       message:
 *                         type: string
 *                       isRead:
 *                         type: boolean
 *                       readAt:
 *                         type: string
 *                         nullable: true
 *                       createdAt:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       400:
 *         description: Invalid page or limit.
 *       401:
 *         description: Unauthenticated.
 *       503:
 *         description: Database failure.
 */
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

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count for the current user
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count fetched.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 unreadCount:
 *                   type: integer
 *       401:
 *         description: Unauthenticated.
 *       503:
 *         description: Database failure.
 */
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

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark a notification as read
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID.
 *     responses:
 *       200:
 *         description: Notification marked as read.
 *       401:
 *         description: Unauthenticated.
 *       404:
 *         description: Notification not found.
 *       503:
 *         description: Database failure.
 */
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

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read for the current user
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 modifiedCount:
 *                   type: integer
 *       401:
 *         description: Unauthenticated.
 *       503:
 *         description: Database failure.
 */
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

/**
 * @swagger
 * /api/notifications/{notificationId}:
 *   delete:
 *     summary: Delete a notification
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID.
 *     responses:
 *       200:
 *         description: Notification deleted successfully.
 *       401:
 *         description: Unauthenticated.
 *       404:
 *         description: Notification not found.
 *       503:
 *         description: Database failure.
 */
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

// ─────────────────────────────────────────────────────────────────────────────
// On-demand notification sync
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/notifications/sync:
 *   post:
 *     summary: Sync settlement reminder notification
 *     description: |
 *       On-demand sync that checks the current user's pending settlements and
 *       creates at most one settlement_reminder notification per ISO week.
 *
 *       Call this from the frontend when the user logs in, opens the Home
 *       screen, or opens the Notifications screen.
 *
 *       **Idempotent**: calling multiple times in the same week returns
 *       `created: false` after the first successful call.
 *
 *       **Race-safe**: concurrent calls are protected by a unique index on
 *       `deduplicationKey`; exactly one insert will succeed.
 *     tags:
 *       - Notifications
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync completed (whether or not a new notification was created).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Notification sync completed.
 *                 created:
 *                   type: boolean
 *                   description: >
 *                     true only when a new settlement_reminder notification was
 *                     inserted this call. false when the preference is disabled,
 *                     there are no pending settlements, the reminder already
 *                     exists for this week, or a concurrent request beat this one.
 *                   example: true
 *                 pendingSettlementCount:
 *                   type: integer
 *                   description: >
 *                     Number of pending settlements for the current user at the
 *                     time of the sync, regardless of whether a notification was
 *                     created.
 *                   example: 3
 *       401:
 *         description: Missing or invalid authentication token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Authorization token is required.
 *       503:
 *         description: Database or service failure.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Unable to sync notifications.
 */

export async function syncNotificationsHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  try {
    const { created, pendingSettlementCount } =
      await syncSettlementRemindersForUser(userId);

    return res.status(200).json({
      ok: true,
      message: "Notification sync completed.",
      created,
      pendingSettlementCount,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sync notifications.";

    return res.status(503).json({ ok: false, message });
  }
}
