import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  getCurrentUserNotificationPreferencesHandler,
  updateCurrentUserNotificationPreferencesHandler,
  getNotificationsHandler,
  getUnreadNotificationCountHandler,
  markNotificationAsReadHandler,
  markAllNotificationsAsReadHandler,
  deleteNotificationHandler,
} from "./notifications.controller.js";

const notificationsRouter = Router();

// ─── Preferences ─────────────────────────────────────────────────────────────
notificationsRouter.get(
  "/preferences",
  authMiddleware,
  getCurrentUserNotificationPreferencesHandler,
);

notificationsRouter.patch(
  "/preferences",
  authMiddleware,
  updateCurrentUserNotificationPreferencesHandler,
);

// ─── In-app Notification list & count ────────────────────────────────────────
notificationsRouter.get("/", authMiddleware, getNotificationsHandler);

notificationsRouter.get(
  "/unread-count",
  authMiddleware,
  getUnreadNotificationCountHandler,
);

// ─── Mark all as read (must be before /:notificationId to avoid route conflict) ─
notificationsRouter.patch(
  "/read-all",
  authMiddleware,
  markAllNotificationsAsReadHandler,
);

// ─── Single notification actions ─────────────────────────────────────────────
notificationsRouter.patch(
  "/:notificationId/read",
  authMiddleware,
  markNotificationAsReadHandler,
);

notificationsRouter.delete(
  "/:notificationId",
  authMiddleware,
  deleteNotificationHandler,
);

export default notificationsRouter;
