import type { NotificationPreferences } from "./notifications.types.js";

/**
 * Canonical list of all valid notification preference keys.
 * Kept here (not in notifications.service.ts) so auth.service.ts can import
 * it without creating a circular dependency.
 */
export const NOTIFICATION_PREFERENCE_KEYS: ReadonlyArray<
  keyof NotificationPreferences
> = [
  "expenseAdded",
  "paymentReceived",
  "settlementReminders",
  "groupInvites",
  "productUpdatesAndTips",
] as const;

/**
 * Default notification preferences applied to every new user and used as
 * fallback for any missing field when reading stored preferences.
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: Readonly<NotificationPreferences> =
  {
    expenseAdded: true,
    paymentReceived: true,
    settlementReminders: true,
    groupInvites: true,
    productUpdatesAndTips: false,
  } as const;
