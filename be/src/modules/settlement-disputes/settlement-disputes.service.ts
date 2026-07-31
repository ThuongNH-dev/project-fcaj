import { randomUUID } from "crypto";
import type { Collection, IndexDescription } from "mongodb";
import { ObjectId as MongoObjectId } from "mongodb";
import { connectToMongo } from "../../db/mongo.js";
import type {
  CreateDisputeInput,
  DisputesPaginationOptions,
  GetDisputesFilters,
  PublicDisputeEvidence,
  PublicSettlementDispute,
  SettlementDisputeDocument,
  SettlementDisputeStatus,
} from "./settlement-disputes.types.js";

let indexesEnsured = false;

async function ensureDisputeIndexes(
  collection: Collection<SettlementDisputeDocument>,
) {
  if (indexesEnsured) {
    return;
  }

  const indexes: IndexDescription[] = [
    {
      key: { settlementId: 1, createdByUserId: 1 },
      name: "settlement_creator_unique_idx",
      unique: true,
    },
    {
      key: { createdByUserId: 1, createdAt: -1 },
      name: "creator_created_idx",
    },
    {
      key: { status: 1, createdAt: -1 },
      name: "status_created_idx",
    },
  ];

  await collection.createIndexes(indexes);
  indexesEnsured = true;
}

export async function getDisputesCollection(): Promise<
  Collection<SettlementDisputeDocument>
> {
  const db = await connectToMongo();
  const collection =
    db.collection<SettlementDisputeDocument>("settlementDisputes");

  await ensureDisputeIndexes(collection);

  return collection;
}

// ─── Conversion ───────────────────────────────────────────────────────────────

function toPublicEvidence(ev: SettlementDisputeDocument["evidence"][number]): PublicDisputeEvidence {
  return {
    id: ev.id,
    originalFileName: ev.originalFileName,
    mimeType: ev.mimeType,
    sizeInBytes: ev.sizeInBytes,
    uploadedAt: ev.uploadedAt instanceof Date
      ? ev.uploadedAt.toISOString()
      : new Date(ev.uploadedAt).toISOString(),
  };
}

export function toPublicSettlementDispute(
  doc: SettlementDisputeDocument,
): PublicSettlementDispute {
  if (!doc._id) {
    throw new Error("Settlement dispute document is missing an id.");
  }

  return {
    id: doc._id.toString(),
    settlementId: doc.settlementId,
    groupId: doc.groupId,
    createdByUserId: doc.createdByUserId,
    againstUserId: doc.againstUserId,
    reason: doc.reason,
    description: doc.description,
    evidence: doc.evidence.map(toPublicEvidence),
    status: doc.status,
    adminNote: doc.adminNote,
    handledByAdminId: doc.handledByAdminId,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createSettlementDispute(params: {
  input: CreateDisputeInput;
  createdByUserId: string;
  againstUserId: string;
  groupId: string;
}): Promise<PublicSettlementDispute> {
  const disputes = await getDisputesCollection();
  const now = new Date();

  const evidenceDocs: SettlementDisputeDocument["evidence"] =
    params.input.evidence.map((ev) => ({
      id: randomUUID(),
      objectKey: ev.objectKey,
      originalFileName: ev.originalFileName.trim(),
      mimeType: ev.mimeType,
      sizeInBytes: ev.sizeInBytes,
      uploadedAt: now,
    }));

  const doc: SettlementDisputeDocument = {
    settlementId: params.input.settlementId,
    groupId: params.groupId,
    createdByUserId: params.createdByUserId,
    againstUserId: params.againstUserId,
    reason: params.input.reason,
    description: params.input.description.trim(),
    evidence: evidenceDocs,
    status: "pending",
    adminNote: null,
    handledByAdminId: null,
    createdAt: now,
    updatedAt: now,
  };

  const result = await disputes.insertOne(doc);

  return toPublicSettlementDispute({ ...doc, _id: result.insertedId });
}

// ─── Get for user ─────────────────────────────────────────────────────────────

export async function getDisputeByIdForUser(
  disputeId: string,
  userId: string,
): Promise<PublicSettlementDispute | null> {
  if (!MongoObjectId.isValid(disputeId)) {
    return null;
  }

  const disputes = await getDisputesCollection();
  const doc = await disputes.findOne({
    _id: new MongoObjectId(disputeId),
    createdByUserId: userId,
  });

  return doc ? toPublicSettlementDispute(doc) : null;
}

export async function getDisputesByUser(
  userId: string,
  filters: GetDisputesFilters,
  pagination: DisputesPaginationOptions,
): Promise<{ disputes: PublicSettlementDispute[]; total: number }> {
  const disputes = await getDisputesCollection();
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = { createdByUserId: userId };

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.settlementId) {
    query.settlementId = filters.settlementId;
  }

  if (filters.groupId) {
    query.groupId = filters.groupId;
  }

  const [docs, total] = await Promise.all([
    disputes.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    disputes.countDocuments(query),
  ]);

  return {
    disputes: docs.map(toPublicSettlementDispute),
    total,
  };
}

// ─── Get evidence doc (internal) ─────────────────────────────────────────────

export async function getDisputeDocumentById(
  disputeId: string,
): Promise<SettlementDisputeDocument | null> {
  if (!MongoObjectId.isValid(disputeId)) {
    return null;
  }

  const disputes = await getDisputesCollection();

  return disputes.findOne({ _id: new MongoObjectId(disputeId) });
}

// ─── Admin queries ────────────────────────────────────────────────────────────

export async function getDisputesForAdmin(
  filters: GetDisputesFilters,
  pagination: DisputesPaginationOptions,
): Promise<{ disputes: PublicSettlementDispute[]; total: number }> {
  const disputes = await getDisputesCollection();
  const { page, limit } = pagination;
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> = {};

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.settlementId) {
    query.settlementId = filters.settlementId;
  }

  if (filters.groupId) {
    query.groupId = filters.groupId;
  }

  if (filters.createdByUserId) {
    query.createdByUserId = filters.createdByUserId;
  }

  const [docs, total] = await Promise.all([
    disputes.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    disputes.countDocuments(query),
  ]);

  return {
    disputes: docs.map(toPublicSettlementDispute),
    total,
  };
}

// ─── Admin status update ──────────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Partial<
  Record<SettlementDisputeStatus, SettlementDisputeStatus[]>
> = {
  pending: ["resolved", "rejected"],
};

export async function updateDisputeStatusByAdmin(params: {
  disputeId: string;
  newStatus: SettlementDisputeStatus;
  adminNote: string;
  adminUserId: string;
}): Promise<PublicSettlementDispute | null> {
  if (!MongoObjectId.isValid(params.disputeId)) {
    return null;
  }

  const disputes = await getDisputesCollection();
  const disputeObjectId = new MongoObjectId(params.disputeId);

  // Fetch current doc to validate transition
  const existing = await disputes.findOne({ _id: disputeObjectId });

  if (!existing) {
    return null;
  }

  const allowedNext = ALLOWED_TRANSITIONS[existing.status];

  if (!allowedNext || !allowedNext.includes(params.newStatus)) {
    throw new Error("Settlement dispute status transition is invalid.");
  }

  const now = new Date();

  const result = await disputes.findOneAndUpdate(
    {
      _id: disputeObjectId,
      status: existing.status, // atomic: guard against race condition
    },
    {
      $set: {
        status: params.newStatus,
        adminNote: params.adminNote,
        handledByAdminId: params.adminUserId,
        updatedAt: now,
      },
    },
    { returnDocument: "after" },
  );

  if (!result) {
    throw new Error("Settlement dispute status transition is invalid.");
  }

  return toPublicSettlementDispute(result);
}

// ─── Check existing dispute ───────────────────────────────────────────────────

export async function hasExistingDispute(
  settlementId: string,
  userId: string,
): Promise<boolean> {
  const disputes = await getDisputesCollection();
  const existing = await disputes.findOne(
    { settlementId, createdByUserId: userId },
    { projection: { _id: 1 } },
  );

  return existing !== null;
}
