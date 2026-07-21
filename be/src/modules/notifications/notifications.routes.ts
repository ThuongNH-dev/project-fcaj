import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  getCurrentUserNotificationPreferencesHandler,
  updateCurrentUserNotificationPreferencesHandler,
} from "./notifications.controller.js";

const notificationsRouter = Router();

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

export default notificationsRouter;
