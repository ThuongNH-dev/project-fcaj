import type { Request, Response } from "express";
import {
  getCurrentUserNotificationPreferences,
  updateCurrentUserNotificationPreferences,
} from "./notifications.service.js";
import type { NotificationPreferences } from "./notifications.types.js";

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

  const body = req.body as {
    notificationPreferences?: Partial<NotificationPreferences>;
  };
  const notificationPreferences = body.notificationPreferences;

  if (!notificationPreferences || typeof notificationPreferences !== "object") {
    return res.status(400).json({
      ok: false,
      message: "Notification preferences payload is required.",
    });
  }

  try {
    const updatedNotificationPreferences =
      await updateCurrentUserNotificationPreferences(
        userId,
        notificationPreferences,
      );

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
    const statusCode =
      message === "At least one notification preference is required." ||
      message.includes('Notification preference "')
        ? 400
        : 503;

    return res.status(statusCode).json({
      ok: false,
      message,
    });
  }
}
