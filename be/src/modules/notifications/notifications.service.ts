import { ObjectId as MongoObjectId } from "mongodb";
import { getUsersCollection } from "../auth/auth.service.js";
import type {
  NotificationPreferences,
  UpdateNotificationPreferencesInput,
} from "./notifications.types.js";

const NOTIFICATION_PREFERENCE_KEYS = [
  "expenseAdded",
  "paymentReceived",
  "settlementReminder",
  "weeklyDigest",
  "groupInvites",
  "marketingEmails",
] as const;

export function getDefaultNotificationPreferences(): NotificationPreferences {
  return {
    expenseAdded: false,
    paymentReceived: false,
    settlementReminder: false,
    weeklyDigest: false,
    groupInvites: false,
    marketingEmails: false,
  };
}

export function normalizeNotificationPreferences(
  notificationPreferences?: Partial<NotificationPreferences>,
): NotificationPreferences {
  const defaults = getDefaultNotificationPreferences();

  if (!notificationPreferences) {
    return defaults;
  }

  const normalizedPreferences = { ...defaults };

  for (const key of NOTIFICATION_PREFERENCE_KEYS) {
    const value = notificationPreferences[key];

    if (value === undefined) {
      continue;
    }

    if (typeof value !== "boolean") {
      throw new Error(`Notification preference "${key}" must be a boolean.`);
    }

    normalizedPreferences[key] = value;
  }

  return normalizedPreferences;
}

export function normalizeNotificationPreferencesInput(
  notificationPreferences: UpdateNotificationPreferencesInput,
): UpdateNotificationPreferencesInput {
  const normalizedPreferences: UpdateNotificationPreferencesInput = {};

  for (const key of NOTIFICATION_PREFERENCE_KEYS) {
    const value = notificationPreferences[key];

    if (value === undefined) {
      continue;
    }

    if (typeof value !== "boolean") {
      throw new Error(`Notification preference "${key}" must be a boolean.`);
    }

    normalizedPreferences[key] = value;
  }

  return normalizedPreferences;
}

export async function getCurrentUserNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences | null> {
  if (!MongoObjectId.isValid(userId)) {
    return null;
  }

  const users = await getUsersCollection();
  const user = await users.findOne({ _id: new MongoObjectId(userId) });

  if (!user) {
    return null;
  }

  return normalizeNotificationPreferences(user.notificationPreferences);
}

export async function updateCurrentUserNotificationPreferences(
  userId: string,
  input: UpdateNotificationPreferencesInput,
): Promise<NotificationPreferences | null> {
  if (!MongoObjectId.isValid(userId)) {
    return null;
  }

  if (Object.keys(input).length === 0) {
    throw new Error("At least one notification preference is required.");
  }

  const users = await getUsersCollection();
  const userObjectId = new MongoObjectId(userId);
  const user = await users.findOne({ _id: userObjectId });

  if (!user) {
    return null;
  }

  const currentPreferences = normalizeNotificationPreferences(
    user.notificationPreferences,
  );
  const normalizedInput = normalizeNotificationPreferencesInput(input);
  const nextPreferences = {
    ...currentPreferences,
    ...normalizedInput,
  };

  await users.updateOne(
    { _id: userObjectId },
    {
      $set: {
        notificationPreferences: nextPreferences,
        updatedAt: new Date(),
      },
    },
  );

  return nextPreferences;
}
