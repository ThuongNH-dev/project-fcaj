import type { Collection, ObjectId } from "mongodb";
import { ObjectId as MongoObjectId } from "mongodb";
import { connectToMongo } from "../../db/mongo.js";
import { getUsersCollection } from "../auth/auth.service.js";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  NOTIFICATION_PREFERENCE_KEYS,
} from "./notifications.constants.js";
import type {
  NotificationPreferences,
  NotificationType,
  PublicNotification,
  UpdateNotificationPreferencesInput,
} from "./notifications.types.js";

// ─────────────────────────────────────────────────────────────────────────────
// Notification Preferences
// ─────────────────────────────────────────────────────────────────────────────

export function getDefaultNotificationPreferences(): NotificationPreferences {
  // Return a mutable copy so callers can spread/modify it safely.
  return { ...DEFAULT_NOTIFICATION_PREFERENCES };
}

/**
 * Merge user's stored preferences (possibly partial or containing old fields)
 * with the current defaults. Unknown / removed fields (e.g. weeklyDigest) are
 * silently ignored – no destructive migration needed.
 */
export function normalizeNotificationPreferences(
  stored?: Partial<Record<string, unknown>>,
): NotificationPreferences {
  const result = getDefaultNotificationPreferences();

  if (!stored) {
    return result;
  }

  for (const key of NOTIFICATION_PREFERENCE_KEYS) {
    const value = (stored as Record<string, unknown>)[key];

    if (typeof value === "boolean") {
      result[key] = value;
    }
    // Non-boolean / missing values fall back to the default – no error thrown
    // for stored data (only input validation throws).
  }

  return result;
}

/**
 * Validate and strip an UPDATE input payload.
 * - Rejects unknown fields (anything not in the 5-key set).
 * - Rejects non-boolean values.
 */
export function normalizeNotificationPreferencesInput(
  input: Record<string, unknown>,
): UpdateNotificationPreferencesInput {
  const allowedKeys = new Set<string>(NOTIFICATION_PREFERENCE_KEYS);
  const normalized: UpdateNotificationPreferencesInput = {};

  for (const key of Object.keys(input)) {
    if (!allowedKeys.has(key)) {
      throw new Error(
        `Unknown notification preference field: "${key}". Allowed fields are: ${[...NOTIFICATION_PREFERENCE_KEYS].join(", ")}.`,
      );
    }
  }

  for (const key of NOTIFICATION_PREFERENCE_KEYS) {
    const value = (input as Record<string, unknown>)[key];

    if (value === undefined) {
      continue;
    }

    if (typeof value !== "boolean") {
      throw new Error(`Notification preference "${key}" must be a boolean.`);
    }

    normalized[key] = value;
  }

  return normalized;
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

  return normalizeNotificationPreferences(
    user.notificationPreferences as Partial<Record<string, unknown>> | undefined,
  );
}

export async function updateCurrentUserNotificationPreferences(
  userId: string,
  rawInput: Record<string, unknown>,
): Promise<NotificationPreferences | null> {
  if (!MongoObjectId.isValid(userId)) {
    return null;
  }

  if (Object.keys(rawInput).length === 0) {
    throw new Error("At least one notification preference is required.");
  }

  // Validate & strip input – throws on unknown fields or non-boolean values
  const validatedInput = normalizeNotificationPreferencesInput(rawInput);

  if (Object.keys(validatedInput).length === 0) {
    throw new Error("At least one notification preference is required.");
  }

  const users = await getUsersCollection();
  const userObjectId = new MongoObjectId(userId);
  const user = await users.findOne({ _id: userObjectId });

  if (!user) {
    return null;
  }

  const currentPreferences = normalizeNotificationPreferences(
    user.notificationPreferences as Partial<Record<string, unknown>> | undefined,
  );
  const nextPreferences: NotificationPreferences = {
    ...currentPreferences,
    ...validatedInput,
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

// ─────────────────────────────────────────────────────────────────────────────
// In-app Notification CRUD
// ─────────────────────────────────────────────────────────────────────────────

export interface NotificationDocument {
  _id?: ObjectId;
  recipientUserId: string;
  actorUserId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  groupId: string | null;
  expenseId: string | null;
  settlementId: string | null;
  isRead: boolean;
  readAt: Date | null;
  /**
   * Optional deduplication key for idempotent inserts (e.g. settlement reminders).
   * When absent the field is not stored at all, so the partial unique index
   * only applies to documents that actually carry this field.
   */
  deduplicationKey?: string;
  createdAt: Date;
}

/** Name of the old sparse index that must be dropped before creating the new one. */
const OLD_DEDUP_INDEX_NAME = "deduplicationKey_unique_idx";
/** Name of the new partial-filter unique index. */
const NEW_DEDUP_INDEX_NAME = "deduplicationKey_unique_string_idx";

let notificationIndexesEnsured = false;

async function ensureNotificationIndexes(
  collection: Collection<NotificationDocument>,
) {
  if (notificationIndexesEnsured) {
    return;
  }

  // ── Drop the legacy sparse index if it still exists ────────────────────────
  // A sparse unique index counts every null/missing as a separate key on older
  // MongoDB drivers, which causes duplicate-key errors when many docs omit the
  // field.  Replace it with a partial-filter index that only indexes documents
  // where the field is actually a string.
  try {
    const existingIndexes = await collection.listIndexes().toArray();
    const hasOldIndex = existingIndexes.some(
      (idx) => idx.name === OLD_DEDUP_INDEX_NAME,
    );

    if (hasOldIndex) {
      await collection.dropIndex(OLD_DEDUP_INDEX_NAME);
    }
  } catch {
    // Collection might not exist yet – safe to ignore.
  }

  await collection.createIndexes([
    {
      key: { recipientUserId: 1, createdAt: -1 },
      name: "recipient_createdAt_idx",
    },
    {
      key: { recipientUserId: 1, isRead: 1 },
      name: "recipient_isRead_idx",
    },
    {
      key: { deduplicationKey: 1 },
      name: NEW_DEDUP_INDEX_NAME,
      unique: true,
      // Only index documents where deduplicationKey is a string (not missing).
      partialFilterExpression: { deduplicationKey: { $type: "string" } },
    },
  ]);

  notificationIndexesEnsured = true;
}

export async function getNotificationsCollection(): Promise<
  Collection<NotificationDocument>
> {
  const db = await connectToMongo();
  const collection = db.collection<NotificationDocument>("notifications");

  await ensureNotificationIndexes(collection);

  return collection;
}

export function toPublicNotification(
  doc: NotificationDocument,
): PublicNotification {
  if (!doc._id) {
    throw new Error("Notification document is missing an id.");
  }

  return {
    id: doc._id.toString(),
    recipientUserId: doc.recipientUserId,
    actorUserId: doc.actorUserId,
    type: doc.type,
    title: doc.title,
    message: doc.message,
    groupId: doc.groupId,
    expenseId: doc.expenseId,
    settlementId: doc.settlementId,
    isRead: doc.isRead,
    readAt: doc.readAt?.toISOString() ?? null,
    // Field is optional in the document; always expose as null when absent.
    deduplicationKey: doc.deduplicationKey ?? null,
    createdAt: doc.createdAt.toISOString(),
  };
}

export interface GetNotificationsOptions {
  page: number;
  limit: number;
}

export async function getNotificationsForUser(
  userId: string,
  options: GetNotificationsOptions,
): Promise<{ notifications: PublicNotification[]; total: number }> {
  if (!MongoObjectId.isValid(userId)) {
    return { notifications: [], total: 0 };
  }

  const { page, limit } = options;
  const skip = (page - 1) * limit;

  const collection = await getNotificationsCollection();
  const filter = { recipientUserId: userId };

  const [documents, total] = await Promise.all([
    collection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    collection.countDocuments(filter),
  ]);

  return {
    notifications: documents.map(toPublicNotification),
    total,
  };
}

export async function getUnreadNotificationCount(
  userId: string,
): Promise<number> {
  if (!MongoObjectId.isValid(userId)) {
    return 0;
  }

  const collection = await getNotificationsCollection();

  return collection.countDocuments({
    recipientUserId: userId,
    isRead: false,
  });
}

/**
 * Mark a single notification as read (idempotent).
 * - Returns the notification (current state) when it exists and belongs to the user.
 * - Returns null when the notification does not exist OR belongs to another user.
 * - Does NOT update readAt on repeated calls (only sets it on the first read).
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string,
): Promise<PublicNotification | null> {
  if (!MongoObjectId.isValid(notificationId)) {
    return null;
  }

  const collection = await getNotificationsCollection();

  // First check: does this notification exist and belong to the current user?
  const existing = await collection.findOne({
    _id: new MongoObjectId(notificationId),
    recipientUserId: userId,
  });

  // Not found or owned by someone else → 404
  if (!existing) {
    return null;
  }

  // Already read → return current state without touching readAt
  if (existing.isRead) {
    return toPublicNotification(existing);
  }

  // Unread → mark as read and record the timestamp
  const now = new Date();
  const updated = await collection.findOneAndUpdate(
    {
      _id: new MongoObjectId(notificationId),
      recipientUserId: userId,
      isRead: false, // guard: only update if still unread
    },
    {
      $set: {
        isRead: true,
        readAt: now,
      },
    },
    { returnDocument: "after" },
  );

  // Race condition: another request marked it read between the findOne and here.
  // Re-fetch to return the current state.
  if (!updated) {
    const refetched = await collection.findOne({
      _id: new MongoObjectId(notificationId),
      recipientUserId: userId,
    });
    return refetched ? toPublicNotification(refetched) : null;
  }

  return toPublicNotification(updated);
}

export async function markAllNotificationsAsRead(
  userId: string,
): Promise<number> {
  if (!MongoObjectId.isValid(userId)) {
    return 0;
  }

  const collection = await getNotificationsCollection();
  const now = new Date();

  const result = await collection.updateMany(
    {
      recipientUserId: userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
        readAt: now,
      },
    },
  );

  return result.modifiedCount;
}

export async function deleteNotification(
  notificationId: string,
  userId: string,
): Promise<boolean | null> {
  if (!MongoObjectId.isValid(notificationId)) {
    return null;
  }

  const collection = await getNotificationsCollection();

  // Fetch first so we can distinguish "not found" from "belongs to another user"
  // while returning the same response shape for both (security convention).
  const existing = await collection.findOne({
    _id: new MongoObjectId(notificationId),
  });

  if (!existing) {
    return null;
  }

  if (existing.recipientUserId !== userId) {
    return null;
  }

  const result = await collection.deleteOne({
    _id: new MongoObjectId(notificationId),
    recipientUserId: userId,
  });

  return result.deletedCount > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Idempotent notification creation (used by Payment Sent flow)
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateNotificationInput {
  recipientUserId: string;
  actorUserId: string | null;
  type: NotificationType;
  title: string;
  message: string;
  groupId: string | null;
  expenseId: string | null;
  settlementId: string | null;
  deduplicationKey: string;
}

/**
 * Insert a notification idempotently using deduplicationKey.
 * If a notification with the same deduplicationKey already exists (duplicate
 * key error E11000), treat it as success and return true.
 *
 * @returns true if notification was created or already exists, false on unexpected error
 */
export async function createNotificationIdempotently(
  input: CreateNotificationInput,
): Promise<boolean> {
  const collection = await getNotificationsCollection();

  const doc: NotificationDocument = {
    recipientUserId: input.recipientUserId,
    actorUserId: input.actorUserId,
    type: input.type,
    title: input.title,
    message: input.message,
    groupId: input.groupId,
    expenseId: input.expenseId,
    settlementId: input.settlementId,
    isRead: false,
    readAt: null,
    deduplicationKey: input.deduplicationKey,
    createdAt: new Date(),
  };

  try {
    await collection.insertOne(doc);
    return true;
  } catch (error: unknown) {
    // Duplicate key error (E11000) on deduplicationKey → idempotent success
    if (
      error instanceof Error &&
      "code" in error &&
      (error as { code: number }).code === 11000
    ) {
      return true;
    }

    // Unexpected error — propagate
    throw error;
  }
}

/**
 * Insert multiple notifications idempotently using deduplicationKey.
 * Uses bulkWrite with ordered:false so one duplicate does not stop the rest.
 * Duplicate key errors (E11000) are treated as success.
 * Other DB errors are logged but do NOT throw — callers must not fail because
 * of notification errors.
 */
export async function createNotificationsIdempotently(
  inputs: CreateNotificationInput[],
): Promise<void> {
  if (inputs.length === 0) {
    return;
  }

  const collection = await getNotificationsCollection();
  const now = new Date();

  const operations = inputs.map((input) => ({
    insertOne: {
      document: {
        recipientUserId: input.recipientUserId,
        actorUserId: input.actorUserId,
        type: input.type,
        title: input.title,
        message: input.message,
        groupId: input.groupId,
        expenseId: input.expenseId,
        settlementId: input.settlementId,
        isRead: false,
        readAt: null,
        deduplicationKey: input.deduplicationKey,
        createdAt: now,
      } satisfies NotificationDocument,
    },
  }));

  try {
    await collection.bulkWrite(operations, { ordered: false });
  } catch (error: unknown) {
    // bulkWrite with ordered:false throws a BulkWriteError that bundles all
    // errors. We check if ALL of them are duplicate-key errors — if so, treat
    // as idempotent success. If any non-duplicate error exists, log it.
    const isBulkError =
      error instanceof Error && error.constructor.name === "MongoBulkWriteError";

    if (isBulkError) {
      const bulkError = error as Error & {
        writeErrors?: Array<{ code: number }>;
      };
      const writeErrors = bulkError.writeErrors ?? [];
      const hasNonDuplicateError = writeErrors.some((e) => e.code !== 11000);

      if (!hasNonDuplicateError) {
        // All errors are duplicates — idempotent success
        return;
      }

      // At least one non-duplicate error: log and continue
      console.error(
        "[notifications] Non-duplicate bulk write error:",
        writeErrors.filter((e) => e.code !== 11000),
      );
      return;
    }

    // Non-bulk error (e.g. network failure)
    console.error("[notifications] Unexpected error in createNotificationsIdempotently:", error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Format helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format amount for notification messages.
 * VND: no decimal places (e.g. "500,000 VND")
 * USD: 2 decimal places (e.g. "12.50 USD")
 */
function formatAmount(amount: number, currency: string): string {
  if (currency === "VND") {
    return `${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })} VND`;
  }
  return `${amount.toFixed(2)} ${currency}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Business notification helpers
// ─────────────────────────────────────────────────────────────────────────────

export interface NotifyExpenseAddedInput {
  expenseId: string;
  groupId: string;
  actorUserId: string;
  actorName: string;
  expenseTitle: string;
  expenseDescription: string;
  amount: number;
  currency: string;
  /** All members of the group (userId strings). */
  groupMemberUserIds: string[];
}

/**
 * Send expense_added notifications to all group members except the actor.
 * - Batch-fetches preferences for all candidate recipients.
 * - Skips recipients with expenseAdded === false.
 * - Uses deduplicationKey to prevent duplicate notifications.
 * - Never throws — notification errors must not fail the expense creation.
 */
export async function notifyExpenseAdded(
  input: NotifyExpenseAddedInput,
): Promise<void> {
  // Recipients = all members except the actor
  const recipientIds = input.groupMemberUserIds.filter(
    (id) => id !== input.actorUserId,
  );

  if (recipientIds.length === 0) {
    return;
  }

  try {
    // Batch-fetch user preferences for all candidates in one query
    const users = await getUsersCollection();
    const validObjectIds = recipientIds.filter((id) =>
      MongoObjectId.isValid(id),
    );

    const userDocs = await users
      .find(
        { _id: { $in: validObjectIds.map((id) => new MongoObjectId(id)) } },
        { projection: { _id: 1, notificationPreferences: 1 } },
      )
      .toArray();

    // Build a map: userId → normalised preferences
    const prefsByUserId = new Map(
      userDocs.map((doc) => [
        doc._id!.toString(),
        normalizeNotificationPreferences(
          doc.notificationPreferences as
          | Partial<Record<string, unknown>>
          | undefined,
        ),
      ]),
    );

    // Build the message
    const descriptionPart = input.expenseDescription
      ? ` — ${input.expenseDescription}`
      : "";
    const amountStr = formatAmount(input.amount, input.currency);
    const message = `${input.actorName} added "${input.expenseTitle}"${descriptionPart}: ${amountStr}.`;

    // Build notification inputs for recipients who have expenseAdded enabled
    const notifications: CreateNotificationInput[] = recipientIds
      .filter((recipientId) => {
        const prefs = prefsByUserId.get(recipientId);
        // Default true when prefs or field is missing
        return prefs === undefined ? true : prefs.expenseAdded;
      })
      .map((recipientId) => ({
        recipientUserId: recipientId,
        actorUserId: input.actorUserId,
        type: "expense_added" as const,
        title: "Expense added",
        message,
        groupId: input.groupId,
        expenseId: input.expenseId,
        settlementId: null,
        deduplicationKey: `expense-added:${input.expenseId}:${recipientId}`,
      }));

    await createNotificationsIdempotently(notifications);
  } catch (error) {
    console.error("[notifications] notifyExpenseAdded failed:", error);
  }
}

export interface NotifyMembersAddedToGroupInput {
  groupId: string;
  groupName: string;
  actorUserId: string;
  /** Members who were actually added (not the owner/creator). */
  addedMembers: Array<{ userId: string; membershipEventId: string }>;
}

/**
 * Send group_invite notifications to newly added group members.
 * - Skips recipients with groupInvites === false.
 * - deduplicationKey includes membershipEventId so remove-then-re-add
 *   produces a new notification while retries remain idempotent.
 * - Never throws — notification errors must not fail group operations.
 */
export async function notifyMembersAddedToGroup(
  input: NotifyMembersAddedToGroupInput,
): Promise<void> {
  if (input.addedMembers.length === 0) {
    return;
  }

  try {
    // Batch-fetch preferences for all added members
    const users = await getUsersCollection();
    const validIds = input.addedMembers
      .map((m) => m.userId)
      .filter((id) => MongoObjectId.isValid(id));

    const userDocs = await users
      .find(
        { _id: { $in: validIds.map((id) => new MongoObjectId(id)) } },
        { projection: { _id: 1, notificationPreferences: 1 } },
      )
      .toArray();

    const prefsByUserId = new Map(
      userDocs.map((doc) => [
        doc._id!.toString(),
        normalizeNotificationPreferences(
          doc.notificationPreferences as
          | Partial<Record<string, unknown>>
          | undefined,
        ),
      ]),
    );

    const notifications: CreateNotificationInput[] = input.addedMembers
      .filter((member) => {
        const prefs = prefsByUserId.get(member.userId);
        // Default true when prefs or field is missing
        return prefs === undefined ? true : prefs.groupInvites;
      })
      .map((member) => ({
        recipientUserId: member.userId,
        actorUserId: input.actorUserId,
        type: "group_invite" as const,
        title: "Added to group",
        message: `You were added to the group "${input.groupName}".`,
        groupId: input.groupId,
        expenseId: null,
        settlementId: null,
        deduplicationKey: `group-added:${input.groupId}:${member.userId}:${member.membershipEventId}`,
      }));

    await createNotificationsIdempotently(notifications);
  } catch (error) {
    console.error("[notifications] notifyMembersAddedToGroup failed:", error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Settlement Reminder — on-demand sync
// ─────────────────────────────────────────────────────────────────────────────

export function getIsoWeekKey(date: Date): string {
  const target = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    ),
  );

  const isoWeekday = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - isoWeekday);

  const isoYear = target.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));

  const weekNumber = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );

  return `${isoYear}-W${String(weekNumber).padStart(2, "0")}`;
}

/**
 * Currency display order for settlement reminder messages.
 * Currencies are shown in this fixed order to keep messages stable.
 */
const CURRENCY_DISPLAY_ORDER = ["VND", "USD"] as const;

//Format a settlement reminder message that aggregates amounts by currency.
function buildReminderMessage(
  settlementCount: number,
  amountByCurrency: Map<string, number>,
): string {
  const label =
    settlementCount === 1 ? "1 pending settlement" : `${settlementCount} pending settlements`;

  // Build currency parts in fixed order; any currencies not in the known list
  // are appended at the end sorted alphabetically for determinism.
  const knownParts: string[] = [];
  const unknownCurrencies: string[] = [];

  for (const currency of CURRENCY_DISPLAY_ORDER) {
    const amount = amountByCurrency.get(currency);
    if (amount !== undefined) {
      knownParts.push(formatAmount(amount, currency));
    }
  }

  for (const [currency, amount] of amountByCurrency) {
    if (!(CURRENCY_DISPLAY_ORDER as readonly string[]).includes(currency)) {
      unknownCurrencies.push(currency);
    }
    void amount; // used below
  }
  unknownCurrencies.sort();
  for (const currency of unknownCurrencies) {
    const amount = amountByCurrency.get(currency)!;
    knownParts.push(formatAmount(amount, currency));
  }

  const totalStr =
    knownParts.length === 1
      ? knownParts[0]
      : `${knownParts.slice(0, -1).join(", ")} and ${knownParts[knownParts.length - 1]}`;

  return `You have ${label} totaling ${totalStr}.`;
}

export interface SyncSettlementRemindersResult {
  created: boolean;
  pendingSettlementCount: number;
}

/**
 * On-demand settlement reminder sync for the current user.
 */
export async function syncSettlementRemindersForUser(
  userId: string,
): Promise<SyncSettlementRemindersResult> {
  // ── 1. Fetch pending settlements ──────────────────────────────────────────
  const { getSettlementsCollection } = await import(
    "../settlements/settlements.service.js"
  );
  const settlementsCollection = await getSettlementsCollection();

  const pendingSettlements = await settlementsCollection
    .find({ debtorUserId: userId, status: "pending" })
    .project<{ amount: number; currency: string }>({ amount: 1, currency: 1 })
    .toArray();

  const pendingSettlementCount = pendingSettlements.length;

  // ── 2. Resolve preference ─────────────────────────────────────────────────
  const users = await getUsersCollection();
  const { ObjectId: MongoObjectId2 } = await import("mongodb");

  let settlementRemindersEnabled = true; // default true when field missing
  if (MongoObjectId2.isValid(userId)) {
    const userDoc = await users.findOne(
      { _id: new MongoObjectId2(userId) },
      { projection: { notificationPreferences: 1 } },
    );
    const prefs = normalizeNotificationPreferences(
      userDoc?.notificationPreferences as
      | Partial<Record<string, unknown>>
      | undefined,
    );
    settlementRemindersEnabled = prefs.settlementReminders;
  }

  // ── 3 & 4. Early exit without inserting ──────────────────────────────────
  if (!settlementRemindersEnabled || pendingSettlementCount === 0) {
    return { created: false, pendingSettlementCount };
  }

  // ── 5. Build notification content ─────────────────────────────────────────
  const weekKey = getIsoWeekKey(new Date());
  const deduplicationKey = `settlement-reminder:${userId}:${weekKey}`;

  // Aggregate amounts by currency
  const amountByCurrency = new Map<string, number>();
  for (const s of pendingSettlements) {
    const currency = s.currency as string;
    amountByCurrency.set(currency, (amountByCurrency.get(currency) ?? 0) + s.amount);
  }

  const message = buildReminderMessage(pendingSettlementCount, amountByCurrency);

  // ── 6. Idempotent insert ──────────────────────────────────────────────────
  // createNotificationIdempotently returns true for both new inserts AND
  // duplicate-key successes — we cannot distinguish them from its return value.
  // To accurately report `created`, we attempt the raw insert ourselves and
  // inspect the outcome directly.

  const collection = await getNotificationsCollection();
  const now = new Date();

  const doc: NotificationDocument = {
    recipientUserId: userId,
    actorUserId: null,
    type: "settlement_reminder",
    title: "Settlement reminder",
    message,
    groupId: null,
    expenseId: null,
    settlementId: null,
    isRead: false,
    readAt: null,
    deduplicationKey,
    createdAt: now,
  };

  let created = false;

  try {
    await collection.insertOne(doc);
    created = true;
  } catch (error: unknown) {
    // Duplicate key (E11000) → this week's reminder already exists.
    // Treat as idempotent success but created = false.
    const isDuplicate =
      error instanceof Error &&
      "code" in error &&
      (error as { code: number }).code === 11000;

    if (!isDuplicate) {
      // Unexpected DB error — propagate so the handler can return 503.
      throw error;
    }
    // isDuplicate → created stays false
  }

  return { created, pendingSettlementCount };
}

// ─────────────────────────────────────────────────────────────────────────────
// Product Update & Tips — admin broadcast
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductUpdateResult {
  recipientCount: number;
  createdCount: number;
}

/**
 * Broadcast a product_update notification to all opted-in users.
 *
 * - Queries users in a single batch (no N+1 loop).
 * - Uses bulkWrite with ordered:false so one duplicate does not stop the rest.
 * - Duplicate key (E11000) is silently skipped and NOT counted in createdCount.
 * - Any other DB error is re-thrown so the controller returns 503.
 *
 * @param broadcastId  Caller-generated UUID; scopes deduplicationKey to this broadcast.
 * @param actorUserId  Admin user ID.
 * @param title        Notification title (already trimmed, max 120 chars).
 * @param message      Notification message (already trimmed, max 1000 chars).
 */
export async function createProductUpdateNotifications(
  broadcastId: string,
  actorUserId: string,
  title: string,
  message: string,
): Promise<ProductUpdateResult> {
  const users = await getUsersCollection();

  // ── Batch query opted-in users ────────────────────────────────────────────
  // "productUpdatesAndTips" must be explicitly true.
  // Missing or false → default false → excluded.
  const optedInUsers = await users
    .find(
      { "notificationPreferences.productUpdatesAndTips": true },
      { projection: { _id: 1 } },
    )
    .toArray();

  const recipientCount = optedInUsers.length;

  if (recipientCount === 0) {
    return { recipientCount: 0, createdCount: 0 };
  }

  const now = new Date();

  const operations = optedInUsers.map((user) => {
    const recipientUserId = user._id.toString();
    return {
      insertOne: {
        document: {
          recipientUserId,
          actorUserId,
          type: "product_update" as const,
          title,
          message,
          groupId: null,
          expenseId: null,
          settlementId: null,
          isRead: false,
          readAt: null,
          deduplicationKey: `product-update:${broadcastId}:${recipientUserId}`,
          createdAt: now,
        } satisfies NotificationDocument,
      },
    };
  });

  const collection = await getNotificationsCollection();

  let createdCount = 0;

  try {
    const bulkResult = await collection.bulkWrite(operations, { ordered: false });
    createdCount = bulkResult.insertedCount ?? 0;
  } catch (error: any) {
    if (error && error.name === "MongoBulkWriteError") {
      createdCount = error.insertedCount ?? 0;
      // Throw if any error is NOT duplicate key (11000)
      const writeErrors = error.writeErrors || [];
      const hasOtherErrors = writeErrors.some((we: any) => we.code !== 11000);
      if (hasOtherErrors) {
        throw error;
      }
    } else {
      throw error; // Not a bulk write error, bubble up
    }
  }

  return { recipientCount, createdCount };
}
