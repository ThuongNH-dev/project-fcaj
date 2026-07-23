import type { Collection, ClientSession, IndexDescription } from "mongodb";
import { ObjectId as MongoObjectId } from "mongodb";
import { connectToMongo } from "../../db/mongo.js";
import type { SupportedCurrency } from "../auth/auth.types.js";
import type { ExpenseParticipantShare } from "../expenses/expenses.types.js";
import type {
  GetMySettlementsFilters,
  PaginationOptions,
  PublicSettlement,
  SettlementDocument,
} from "./settlements.types.js";

let indexesEnsured = false;

async function ensureSettlementIndexes(
  collection: Collection<SettlementDocument>,
) {
  if (indexesEnsured) {
    return;
  }

  const indexes: IndexDescription[] = [
    {
      key: { expenseId: 1, debtorUserId: 1, creditorUserId: 1 },
      name: "expense_debtor_creditor_unique_idx",
      unique: true,
    },
    {
      key: { debtorUserId: 1, status: 1 },
      name: "debtor_status_idx",
    },
    {
      key: { creditorUserId: 1, status: 1 },
      name: "creditor_status_idx",
    },
    {
      key: { expenseId: 1 },
      name: "expense_idx",
    },
  ];

  await collection.createIndexes(indexes);
  indexesEnsured = true;
}

export async function getSettlementsCollection(): Promise<
  Collection<SettlementDocument>
> {
  const db = await connectToMongo();
  const collection = db.collection<SettlementDocument>("settlements");

  await ensureSettlementIndexes(collection);

  return collection;
}

// ─────────────────────────────────────────────────────────────────────────────
// Conversions
// ─────────────────────────────────────────────────────────────────────────────

export function toPublicSettlement(doc: SettlementDocument): PublicSettlement {
  if (!doc._id) {
    throw new Error("Settlement document is missing an id.");
  }

  return {
    id: doc._id.toString(),
    expenseId: doc.expenseId,
    groupId: doc.groupId,
    debtorUserId: doc.debtorUserId,
    creditorUserId: doc.creditorUserId,
    amount: doc.amount,
    currency: doc.currency,
    status: doc.status,
    sentAt: doc.sentAt?.toISOString() ?? null,
    sentSource: doc.sentSource,
    paymentNotificationStatus: doc.paymentNotificationStatus,
    paymentNotificationSentAt:
      doc.paymentNotificationSentAt?.toISOString() ?? null,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Create settlements for a new expense
// ─────────────────────────────────────────────────────────────────────────────

export async function createSettlementsForExpense(
  expenseId: string,
  groupId: string,
  paidByUserId: string,
  participants: ExpenseParticipantShare[],
  currency: SupportedCurrency,
  session: ClientSession | null,
): Promise<void> {
  const debtors = participants.filter(
    (p) => p.userId !== paidByUserId && p.shareAmount > 0,
  );

  if (debtors.length === 0) {
    return;
  }

  const now = new Date();
  const docs: SettlementDocument[] = debtors.map((debtor) => ({
    expenseId,
    groupId,
    debtorUserId: debtor.userId,
    creditorUserId: paidByUserId,
    amount: debtor.shareAmount,
    currency,
    status: "pending" as const,
    sentAt: null,
    sentSource: null,
    paymentNotificationStatus: "not_required" as const,
    paymentNotificationSentAt: null,
    createdAt: now,
    updatedAt: now,
  }));

  const settlements = await getSettlementsCollection();

  if (session) {
    await settlements.insertMany(docs, { session });
  } else {
    await settlements.insertMany(docs);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reconcile settlements when an expense is updated
// ─────────────────────────────────────────────────────────────────────────────

export async function reconcileSettlements(
  expenseId: string,
  groupId: string,
  newPaidByUserId: string,
  newParticipants: ExpenseParticipantShare[],
  newCurrency: SupportedCurrency,
  session: ClientSession | null,
): Promise<void> {
  const settlements = await getSettlementsCollection();
  const sessionOpt = session ? { session } : {};

  const existingSettlements = await settlements
    .find({ expenseId }, sessionOpt)
    .toArray();

  // Build the expected set of (debtorUserId) → shareAmount for the new state
  const expectedDebtors = new Map<string, number>();
  for (const p of newParticipants) {
    if (p.userId !== newPaidByUserId && p.shareAmount > 0) {
      expectedDebtors.set(p.userId, p.shareAmount);
    }
  }

  // Check if any SENT settlement would be affected by this update
  const { SettlementConflictError } = await import(
    "../../errors/settlement-conflict.error.js"
  );

  for (const s of existingSettlements) {
    if (s.status !== "sent") {
      continue;
    }

    const expectedAmount = expectedDebtors.get(s.debtorUserId);

    // Settlement is sent but:
    // - debtor was removed from participants, OR
    // - debtor became the new payer, OR
    // - creditor changed (payer changed), OR
    // - amount changed, OR
    // - currency changed
    const debtorRemoved = expectedAmount === undefined;
    const creditorChanged = s.creditorUserId !== newPaidByUserId;
    const amountChanged = expectedAmount !== undefined && expectedAmount !== s.amount;
    const currencyChanged = s.currency !== newCurrency;

    if (debtorRemoved || creditorChanged || amountChanged || currencyChanged) {
      throw new SettlementConflictError(
        "Cannot update this expense because one or more payments have already been marked as sent. Please resolve sent payments before making changes.",
      );
    }
  }

  // No sent settlement is affected — proceed with reconciliation of pending settlements
  const now = new Date();

  // 1. Delete pending settlements for debtors no longer in the expected set
  //    OR whose creditor has changed
  const toDelete: MongoObjectId[] = [];
  for (const s of existingSettlements) {
    if (s.status !== "pending" || !s._id) {
      continue;
    }

    const expectedAmount = expectedDebtors.get(s.debtorUserId);
    const creditorChanged = s.creditorUserId !== newPaidByUserId;

    if (expectedAmount === undefined || creditorChanged) {
      toDelete.push(new MongoObjectId(s._id));
    }
  }

  if (toDelete.length > 0) {
    await settlements.deleteMany(
      { _id: { $in: toDelete } },
      sessionOpt,
    );
  }

  // 2. Update pending settlements whose amount or currency changed
  for (const s of existingSettlements) {
    if (s.status !== "pending" || !s._id) {
      continue;
    }

    const expectedAmount = expectedDebtors.get(s.debtorUserId);
    const creditorChanged = s.creditorUserId !== newPaidByUserId;

    // Already deleted above
    if (expectedAmount === undefined || creditorChanged) {
      continue;
    }

    const needsUpdate =
      s.amount !== expectedAmount || s.currency !== newCurrency;

    if (needsUpdate) {
      await settlements.updateOne(
        { _id: new MongoObjectId(s._id) },
        {
          $set: {
            amount: expectedAmount,
            currency: newCurrency,
            updatedAt: now,
          },
        },
        sessionOpt,
      );
    }
  }

  // 3. Create new pending settlements for new debtors
  const existingDebtorIds = new Set(
    existingSettlements
      .filter((s) => s.creditorUserId === newPaidByUserId && s.status !== "sent")
      .map((s) => s.debtorUserId),
  );

  // Also keep track of sent settlements that are still valid (not deleted)
  const sentDebtorIds = new Set(
    existingSettlements
      .filter((s) => s.status === "sent" && s.creditorUserId === newPaidByUserId)
      .map((s) => s.debtorUserId),
  );

  const newDocs: SettlementDocument[] = [];
  for (const [debtorUserId, shareAmount] of expectedDebtors) {
    // Skip if we already have a pending or sent settlement for this debtor
    if (existingDebtorIds.has(debtorUserId) || sentDebtorIds.has(debtorUserId)) {
      continue;
    }

    // Also skip debtors whose pending settlement was deleted due to creditor change
    // — they need a new settlement with the new creditor
    // (already handled: deleted above, not in existingDebtorIds)

    newDocs.push({
      expenseId,
      groupId,
      debtorUserId,
      creditorUserId: newPaidByUserId,
      amount: shareAmount,
      currency: newCurrency,
      status: "pending",
      sentAt: null,
      sentSource: null,
      paymentNotificationStatus: "not_required",
      paymentNotificationSentAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  if (newDocs.length > 0) {
    await settlements.insertMany(newDocs, sessionOpt);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Delete all settlements for an expense (only when all are pending)
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteSettlementsByExpenseId(
  expenseId: string,
  session: ClientSession | null,
): Promise<void> {
  const settlements = await getSettlementsCollection();
  const sessionOpt = session ? { session } : {};

  await settlements.deleteMany({ expenseId }, sessionOpt);
}

// ─────────────────────────────────────────────────────────────────────────────
// Check if any settlement is sent for an expense
// ─────────────────────────────────────────────────────────────────────────────

export async function hasAnySentSettlement(
  expenseId: string,
  session?: ClientSession | null,
): Promise<boolean> {
  const settlements = await getSettlementsCollection();
  const sessionOpt = session ? { session } : {};
  const doc = await settlements.findOne(
    {
      expenseId,
      status: "sent",
    },
    sessionOpt,
  );

  return doc !== null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cascade: mark all pending settlements as sent (creditor settle expense)
// ─────────────────────────────────────────────────────────────────────────────

export async function cascadeSettleByExpenseId(
  expenseId: string,
  session: ClientSession | null,
): Promise<void> {
  const settlements = await getSettlementsCollection();
  const sessionOpt = session ? { session } : {};
  const now = new Date();

  await settlements.updateMany(
    { expenseId, status: "pending" },
    {
      $set: {
        status: "sent",
        sentAt: now,
        sentSource: "creditor_settlement",
        paymentNotificationStatus: "not_required",
        updatedAt: now,
      },
    },
    sessionOpt,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mark a single settlement as sent (debtor Payment Sent)
// Returns: { settlement, wasAlreadySent }
// ─────────────────────────────────────────────────────────────────────────────

export interface MarkSentResult {
  settlement: PublicSettlement;
  wasAlreadySent: boolean;
}

export async function markSettlementAsSent(
  settlementId: string,
  debtorUserId: string,
  notificationPending: boolean,
): Promise<MarkSentResult | null> {
  if (!MongoObjectId.isValid(settlementId)) {
    return null;
  }

  const settlements = await getSettlementsCollection();
  const now = new Date();

  // Atomic update: only transition pending → sent for this debtor
  const result = await settlements.findOneAndUpdate(
    {
      _id: new MongoObjectId(settlementId),
      debtorUserId,
      status: "pending",
    },
    {
      $set: {
        status: "sent",
        sentAt: now,
        sentSource: "debtor",
        paymentNotificationStatus: notificationPending
          ? "pending"
          : "not_required",
        updatedAt: now,
      },
    },
    { returnDocument: "after" },
  );

  if (result) {
    return {
      settlement: toPublicSettlement(result),
      wasAlreadySent: false,
    };
  }

  // If no update happened, check if the settlement exists and is already sent
  const existing = await settlements.findOne({
    _id: new MongoObjectId(settlementId),
    debtorUserId,
  });

  if (!existing) {
    // Not found or does not belong to this debtor
    return null;
  }

  // Already sent — idempotent response
  return {
    settlement: toPublicSettlement(existing),
    wasAlreadySent: true,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Update notification status on a settlement after notification was sent
// ─────────────────────────────────────────────────────────────────────────────

export async function updateSettlementNotificationStatus(
  settlementId: string,
): Promise<void> {
  const settlements = await getSettlementsCollection();

  await settlements.updateOne(
    {
      _id: new MongoObjectId(settlementId),
      paymentNotificationStatus: "pending",
    },
    {
      $set: {
        paymentNotificationStatus: "sent",
        paymentNotificationSentAt: new Date(),
      },
    },
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Query: Get settlements for current user with filters + pagination
// ─────────────────────────────────────────────────────────────────────────────

export async function getSettlementsForUser(
  userId: string,
  filters: GetMySettlementsFilters,
  pagination: PaginationOptions,
): Promise<{ settlements: PublicSettlement[]; total: number }> {
  const settlements = await getSettlementsCollection();
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  // Build filter: current user is debtor OR creditor
  type FilterValue = string | { $in?: string[] };
  const filter: Record<string, FilterValue> = {};

  if (filters.role === "debtor") {
    filter.debtorUserId = userId;
  } else if (filters.role === "creditor") {
    filter.creditorUserId = userId;
  } else {
    // No role filter — match where user is either debtor or creditor
    // Use $or at top level
  }

  if (filters.status) {
    filter.status = filters.status;
  }

  if (filters.groupId) {
    filter.groupId = filters.groupId;
  }

  if (filters.expenseId) {
    filter.expenseId = filters.expenseId;
  }

  // Build the final query
  let query: Record<string, unknown>;

  if (!filters.role) {
    // Need $or for debtor/creditor
    query = {
      ...filter,
      $or: [{ debtorUserId: userId }, { creditorUserId: userId }],
    };
  } else {
    query = filter;
  }

  const [documents, total] = await Promise.all([
    settlements
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
    settlements.countDocuments(query),
  ]);

  return {
    settlements: documents.map(toPublicSettlement),
    total,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Get settlement by ID (for internal use)
// ─────────────────────────────────────────────────────────────────────────────

export async function getSettlementById(
  settlementId: string,
): Promise<SettlementDocument | null> {
  if (!MongoObjectId.isValid(settlementId)) {
    return null;
  }

  const settlements = await getSettlementsCollection();

  return settlements.findOne({
    _id: new MongoObjectId(settlementId),
  });
}
