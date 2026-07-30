import type { Request, Response } from "express";
import { ObjectId as MongoObjectId } from "mongodb";
import { isUserActivePro } from "../auth/auth.service.js";
import { getSettlementById } from "../settlements/settlements.service.js";
import { connectToMongo } from "../../db/mongo.js";
import {
  createSettlementDispute,
  getDisputeByIdForUser,
  getDisputeDocumentById,
  getDisputesByUser,
  getDisputesForAdmin,
  hasExistingDispute,
  toPublicSettlementDispute,
  updateDisputeStatusByAdmin,
} from "./settlement-disputes.service.js";
import {
  createDisputeEvidenceUploadPresign,
  createDisputeEvidenceViewUrl,
  verifyDisputeEvidence,
} from "./settlement-disputes.storage.js";
import type {
  CreateDisputeEvidenceInput,
  DisputeEvidenceMimeType,
  SettlementDisputeReason,
  SettlementDisputeStatus,
} from "./settlement-disputes.types.js";

// ─── Constants ────────────────────────────────────────────────────────────────

const ALLOWED_MIME_TYPES = new Set<DisputeEvidenceMimeType>([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const ALLOWED_REASONS = new Set<SettlementDisputeReason>([
  "payment_not_received",
  "incorrect_amount",
  "unauthorized_settlement",
  "other",
]);

const ALLOWED_ADMIN_TARGET_STATUSES = new Set<SettlementDisputeStatus>([
  "resolved",
  "rejected",
]);

const MAX_EVIDENCE_COUNT = 3;
const MAX_EVIDENCE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface GroupLookup {
  isBanned?: boolean;
  members: Array<{ userId: string }>;
}

async function getGroupForDispute(
  groupId: string,
): Promise<GroupLookup | null> {
  if (!MongoObjectId.isValid(groupId)) {
    return null;
  }

  const db = await connectToMongo();
  const groups = db.collection<GroupLookup>("groups");

  return groups.findOne(
    { _id: new MongoObjectId(groupId) },
    { projection: { isBanned: 1, members: 1 } },
  );
}

function isGroupMember(group: GroupLookup, userId: string): boolean {
  return group.members.some((m) => m.userId === userId);
}

/**
 * Validate all business rules shared between presign and create-dispute endpoints.
 * Returns a response object if a rule is violated, or null if all rules pass.
 */
async function validateDisputeEligibility(
  res: Response,
  userId: string,
  settlementId: string,
): Promise<{
  settlement: Awaited<ReturnType<typeof getSettlementById>>;
  groupId: string;
  againstUserId: string;
} | null> {
  // Fetch settlement
  const settlement = await getSettlementById(settlementId);

  if (!settlement) {
    res.status(404).json({ ok: false, message: "Settlement not found." });
    return null;
  }

  const { debtorUserId, creditorUserId, status: settlementStatus, groupId } = settlement;

  // User must be debtor or creditor
  const isDebtor = debtorUserId === userId;
  const isCreditor = creditorUserId === userId;

  if (!isDebtor && !isCreditor) {
    res.status(404).json({ ok: false, message: "Settlement not found." });
    return null;
  }

  const againstUserId = isDebtor ? creditorUserId : debtorUserId;

  // Settlement must be sent
  if (settlementStatus !== "sent") {
    res.status(409).json({
      ok: false,
      message: "Only sent settlements can be disputed.",
    });
    return null;
  }

  // User must be Pro active
  const isPro = await isUserActivePro(userId);

  if (!isPro) {
    res.status(403).json({
      ok: false,
      message: "Settlement dispute creation is available on Pro only.",
    });
    return null;
  }

  // Validate group membership and ban status
  const group = await getGroupForDispute(groupId);

  if (!group) {
    res.status(404).json({ ok: false, message: "Settlement not found." });
    return null;
  }

  if (group.isBanned) {
    res.status(409).json({
      ok: false,
      message: "This group has been banned.",
    });
    return null;
  }

  if (!isGroupMember(group, userId)) {
    res.status(404).json({ ok: false, message: "Settlement not found." });
    return null;
  }

  return { settlement, groupId, againstUserId };
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/settlement-disputes/evidence/presign
// ─────────────────────────────────────────────────────────────────────────────

export async function createDisputeEvidencePresignHandler(
  req: Request,
  res: Response,
) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res
      .status(401)
      .json({ ok: false, message: "Authorization token is required." });
  }

  const body = req.body as Record<string, unknown>;
  const settlementId =
    typeof body.settlementId === "string" ? body.settlementId.trim() : "";
  const originalFileName =
    typeof body.originalFileName === "string"
      ? body.originalFileName.trim()
      : "";
  const mimeType =
    typeof body.mimeType === "string" ? body.mimeType.trim() : "";
  const rawSize = body.sizeInBytes;
  const sizeInBytes =
    typeof rawSize === "number"
      ? rawSize
      : typeof rawSize === "string"
        ? Number(rawSize)
        : NaN;

  // ── Input validation ──────────────────────────────────────────────────────
  if (!settlementId) {
    return res
      .status(400)
      .json({ ok: false, message: "settlementId is required." });
  }

  if (!originalFileName) {
    return res
      .status(400)
      .json({ ok: false, message: "originalFileName is required." });
  }

  if (!mimeType) {
    return res
      .status(400)
      .json({ ok: false, message: "mimeType is required." });
  }

  if (!ALLOWED_MIME_TYPES.has(mimeType as DisputeEvidenceMimeType)) {
    return res.status(400).json({
      ok: false,
      message:
        "Evidence file type must be image/jpeg, image/png, or image/webp.",
    });
  }

  if (!Number.isInteger(sizeInBytes) || sizeInBytes <= 0) {
    return res.status(400).json({
      ok: false,
      message: "sizeInBytes must be a positive integer.",
    });
  }

  if (sizeInBytes > MAX_EVIDENCE_SIZE_BYTES) {
    return res.status(400).json({
      ok: false,
      message: "Evidence file size must not exceed 5 MB.",
    });
  }

  try {
    // ── Business rule checks ─────────────────────────────────────────────────
    const eligibility = await validateDisputeEligibility(
      res,
      userId,
      settlementId,
    );

    if (!eligibility) {
      return; // response already sent
    }

    // Check no existing dispute from this user
    const alreadyDisputed = await hasExistingDispute(settlementId, userId);

    if (alreadyDisputed) {
      return res.status(409).json({
        ok: false,
        message: "You have already disputed this settlement.",
      });
    }

    // ── Create presigned upload URL ───────────────────────────────────────────
    const presignResult = await createDisputeEvidenceUploadPresign({
      userId,
      settlementId,
      originalFileName,
      mimeType: mimeType as DisputeEvidenceMimeType,
    });

    return res.status(201).json({
      ok: true,
      message: "Settlement dispute evidence upload URL created successfully.",
      uploadUrl: presignResult.uploadUrl,
      objectKey: presignResult.objectKey,
      expiresIn: presignResult.expiresIn,
      headers: presignResult.headers,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create evidence upload URL.";

    return res.status(503).json({ ok: false, message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/settlement-disputes
// ─────────────────────────────────────────────────────────────────────────────

export async function createDisputeHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res
      .status(401)
      .json({ ok: false, message: "Authorization token is required." });
  }

  const body = req.body as Record<string, unknown>;
  const settlementId =
    typeof body.settlementId === "string" ? body.settlementId.trim() : "";
  const reason =
    typeof body.reason === "string" ? body.reason.trim() : "";
  const rawDescription =
    typeof body.description === "string" ? body.description.trim() : "";
  const rawEvidence = Array.isArray(body.evidence) ? body.evidence : [];

  // ── Validation ────────────────────────────────────────────────────────────
  if (!settlementId) {
    return res
      .status(400)
      .json({ ok: false, message: "settlementId is required." });
  }

  if (!reason) {
    return res.status(400).json({ ok: false, message: "reason is required." });
  }

  if (!ALLOWED_REASONS.has(reason as SettlementDisputeReason)) {
    return res.status(400).json({ ok: false, message: "Invalid dispute reason." });
  }

  if (!rawDescription) {
    return res
      .status(400)
      .json({ ok: false, message: "description is required." });
  }

  if (rawDescription.length < 10) {
    return res.status(400).json({
      ok: false,
      message: "description must be at least 10 characters.",
    });
  }

  if (rawDescription.length > 1000) {
    return res.status(400).json({
      ok: false,
      message: "description must not exceed 1000 characters.",
    });
  }

  if (rawEvidence.length > MAX_EVIDENCE_COUNT) {
    return res.status(400).json({
      ok: false,
      message: `A maximum of ${MAX_EVIDENCE_COUNT} evidence files are allowed.`,
    });
  }

  // Validate each evidence item shape
  for (const [idx, item] of rawEvidence.entries()) {
    if (!item || typeof item !== "object") {
      return res
        .status(400)
        .json({ ok: false, message: `evidence[${idx}] is invalid.` });
    }

    const ev = item as Record<string, unknown>;

    if (typeof ev.objectKey !== "string" || !ev.objectKey.trim()) {
      return res
        .status(400)
        .json({ ok: false, message: `evidence[${idx}].objectKey is required.` });
    }

    if (typeof ev.originalFileName !== "string" || !ev.originalFileName.trim()) {
      return res.status(400).json({
        ok: false,
        message: `evidence[${idx}].originalFileName is required.`,
      });
    }

    if (typeof ev.mimeType !== "string") {
      return res
        .status(400)
        .json({ ok: false, message: `evidence[${idx}].mimeType is required.` });
    }

    if (!ALLOWED_MIME_TYPES.has(ev.mimeType as DisputeEvidenceMimeType)) {
      return res.status(400).json({
        ok: false,
        message: `evidence[${idx}].mimeType must be image/jpeg, image/png, or image/webp.`,
      });
    }

    const evSize =
      typeof ev.sizeInBytes === "number"
        ? ev.sizeInBytes
        : typeof ev.sizeInBytes === "string"
          ? Number(ev.sizeInBytes)
          : NaN;

    if (!Number.isInteger(evSize) || evSize <= 0) {
      return res.status(400).json({
        ok: false,
        message: `evidence[${idx}].sizeInBytes must be a positive integer.`,
      });
    }

    if (evSize > MAX_EVIDENCE_SIZE_BYTES) {
      return res.status(400).json({
        ok: false,
        message: `evidence[${idx}] file size must not exceed 5 MB.`,
      });
    }
  }

  try {
    // ── Business rule checks ─────────────────────────────────────────────────
    const eligibility = await validateDisputeEligibility(
      res,
      userId,
      settlementId,
    );

    if (!eligibility) {
      return; // response already sent
    }

    const { groupId, againstUserId } = eligibility;

    // Duplicate dispute check (before S3 verification to fail fast)
    const alreadyDisputed = await hasExistingDispute(settlementId, userId);

    if (alreadyDisputed) {
      return res.status(409).json({
        ok: false,
        message: "You have already disputed this settlement.",
      });
    }

    // ── Verify evidence on S3 ─────────────────────────────────────────────────
    const validatedEvidence: CreateDisputeEvidenceInput[] = [];

    for (const [idx, item] of rawEvidence.entries()) {
      const ev = item as Record<string, unknown>;
      const objectKey = String(ev.objectKey).trim();
      const mimeType = ev.mimeType as DisputeEvidenceMimeType;
      const sizeInBytes =
        typeof ev.sizeInBytes === "number"
          ? ev.sizeInBytes
          : Number(ev.sizeInBytes);

      const verification = await verifyDisputeEvidence({
        objectKey,
        expectedMimeType: mimeType,
        expectedSizeInBytes: sizeInBytes,
        userId,
        settlementId,
      });

      if (!verification.valid) {
        return res.status(400).json({
          ok: false,
          message:
            verification.reason ??
            `evidence[${idx}] could not be verified on S3.`,
        });
      }

      validatedEvidence.push({
        objectKey,
        originalFileName: String(ev.originalFileName).trim(),
        mimeType,
        sizeInBytes,
      });
    }

    // ── Create dispute ────────────────────────────────────────────────────────
    const dispute = await createSettlementDispute({
      input: {
        settlementId,
        reason: reason as SettlementDisputeReason,
        description: rawDescription,
        evidence: validatedEvidence,
      },
      createdByUserId: userId,
      againstUserId,
      groupId,
    });

    return res.status(201).json({
      ok: true,
      message: "Settlement dispute created successfully.",
      dispute,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create settlement dispute.";

    // MongoDB duplicate key error
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "11000"
    ) {
      return res.status(409).json({
        ok: false,
        message: "You have already disputed this settlement.",
      });
    }

    // Check for numeric mongo error code
    const mongoCode = (error as Record<string, unknown>)?.["code"];
    if (mongoCode === 11000) {
      return res.status(409).json({
        ok: false,
        message: "You have already disputed this settlement.",
      });
    }

    return res.status(503).json({ ok: false, message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/settlement-disputes/my
// ─────────────────────────────────────────────────────────────────────────────

export async function getMyDisputesHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res
      .status(401)
      .json({ ok: false, message: "Authorization token is required." });
  }

  const rawPage = typeof req.query.page === "string" ? Number(req.query.page) : 1;
  const rawLimit =
    typeof req.query.limit === "string" ? Number(req.query.limit) : 20;
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isInteger(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, 100)
    : 20;

  const statusParam =
    typeof req.query.status === "string" ? req.query.status.trim() : "";
  const settlementId =
    typeof req.query.settlementId === "string"
      ? req.query.settlementId.trim()
      : "";
  const groupId =
    typeof req.query.groupId === "string" ? req.query.groupId.trim() : "";

  const allowedStatuses = new Set<SettlementDisputeStatus>([
    "pending",
    "resolved",
    "rejected",
  ]);

  if (statusParam && !allowedStatuses.has(statusParam as SettlementDisputeStatus)) {
    return res.status(400).json({
      ok: false,
      message: "Invalid status filter.",
    });
  }

  try {
    const { disputes, total } = await getDisputesByUser(
      userId,
      {
        status: statusParam
          ? (statusParam as SettlementDisputeStatus)
          : undefined,
        settlementId: settlementId || undefined,
        groupId: groupId || undefined,
      },
      { page, limit },
    );

    return res.status(200).json({
      ok: true,
      message: "Settlement disputes fetched successfully.",
      disputes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to fetch settlement disputes.";

    return res.status(503).json({ ok: false, message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/settlement-disputes/:disputeId
// ─────────────────────────────────────────────────────────────────────────────

export async function getDisputeByIdHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res
      .status(401)
      .json({ ok: false, message: "Authorization token is required." });
  }

  const disputeId =
    typeof req.params.disputeId === "string" ? req.params.disputeId : "";

  try {
    const dispute = await getDisputeByIdForUser(disputeId, userId);

    if (!dispute) {
      return res
        .status(404)
        .json({ ok: false, message: "Settlement dispute not found." });
    }

    return res.status(200).json({
      ok: true,
      message: "Settlement dispute fetched successfully.",
      dispute,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to fetch settlement dispute.";

    return res.status(503).json({ ok: false, message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/settlement-disputes/:disputeId/evidence/:evidenceId/view-url
// ─────────────────────────────────────────────────────────────────────────────

export async function getDisputeEvidenceViewUrlHandler(
  req: Request,
  res: Response,
) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res
      .status(401)
      .json({ ok: false, message: "Authorization token is required." });
  }

  const disputeId =
    typeof req.params.disputeId === "string" ? req.params.disputeId : "";
  const evidenceId =
    typeof req.params.evidenceId === "string" ? req.params.evidenceId : "";

  try {
    // Only the creator can view evidence
    const dispute = await getDisputeByIdForUser(disputeId, userId);

    if (!dispute) {
      return res
        .status(404)
        .json({ ok: false, message: "Settlement dispute not found." });
    }

    const evidenceItem = dispute.evidence.find((ev) => ev.id === evidenceId);

    if (!evidenceItem) {
      return res
        .status(404)
        .json({ ok: false, message: "Evidence not found." });
    }

    const doc = await getDisputeDocumentById(disputeId);

    if (!doc) {
      return res
        .status(404)
        .json({ ok: false, message: "Settlement dispute not found." });
    }

    const docEvidence = doc.evidence.find((ev) => ev.id === evidenceId);

    if (!docEvidence) {
      return res
        .status(404)
        .json({ ok: false, message: "Evidence not found." });
    }

    const presignResult = await createDisputeEvidenceViewUrl({
      objectKey: docEvidence.objectKey,
    });

    return res.status(200).json({
      ok: true,
      message: "Settlement dispute evidence access URL created successfully.",
      url: presignResult.url,
      expiresIn: presignResult.expiresIn,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create evidence access URL.";

    return res.status(503).json({ ok: false, message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: GET /api/admin/settlement-disputes
// ─────────────────────────────────────────────────────────────────────────────

export async function adminGetDisputesHandler(req: Request, res: Response) {
  const rawPage = typeof req.query.page === "string" ? Number(req.query.page) : 1;
  const rawLimit =
    typeof req.query.limit === "string" ? Number(req.query.limit) : 20;
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isInteger(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, 100)
    : 20;

  const statusParam =
    typeof req.query.status === "string" ? req.query.status.trim() : "";
  const settlementId =
    typeof req.query.settlementId === "string"
      ? req.query.settlementId.trim()
      : "";
  const groupId =
    typeof req.query.groupId === "string" ? req.query.groupId.trim() : "";
  const createdByUserId =
    typeof req.query.createdByUserId === "string"
      ? req.query.createdByUserId.trim()
      : "";

  const allowedStatuses = new Set<SettlementDisputeStatus>([
    "pending",
    "resolved",
    "rejected",
  ]);

  if (statusParam && !allowedStatuses.has(statusParam as SettlementDisputeStatus)) {
    return res.status(400).json({ ok: false, message: "Invalid status filter." });
  }

  try {
    const { disputes, total } = await getDisputesForAdmin(
      {
        status: statusParam
          ? (statusParam as SettlementDisputeStatus)
          : undefined,
        settlementId: settlementId || undefined,
        groupId: groupId || undefined,
        createdByUserId: createdByUserId || undefined,
      },
      { page, limit },
    );

    return res.status(200).json({
      ok: true,
      message: "Settlement disputes fetched successfully.",
      disputes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to fetch settlement disputes.";

    return res.status(503).json({ ok: false, message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: GET /api/admin/settlement-disputes/:disputeId
// ─────────────────────────────────────────────────────────────────────────────

export async function adminGetDisputeByIdHandler(req: Request, res: Response) {
  const disputeId =
    typeof req.params.disputeId === "string" ? req.params.disputeId : "";

  try {
    const doc = await getDisputeDocumentById(disputeId);

    if (!doc) {
      return res
        .status(404)
        .json({ ok: false, message: "Settlement dispute not found." });
    }

    const dispute = toPublicSettlementDispute(doc);

    return res.status(200).json({
      ok: true,
      message: "Settlement dispute fetched successfully.",
      dispute,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to fetch settlement dispute.";

    return res.status(503).json({ ok: false, message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: PATCH /api/admin/settlement-disputes/:disputeId/status
// ─────────────────────────────────────────────────────────────────────────────

export async function adminUpdateDisputeStatusHandler(
  req: Request,
  res: Response,
) {
  const adminUserId = req.auth?.userId;

  if (!adminUserId) {
    return res
      .status(401)
      .json({ ok: false, message: "Authorization token is required." });
  }

  const disputeId =
    typeof req.params.disputeId === "string" ? req.params.disputeId : "";

  const body = req.body as Record<string, unknown>;
  const newStatus =
    typeof body.status === "string" ? body.status.trim() : "";
  const rawAdminNote =
    typeof body.adminNote === "string" ? body.adminNote.trim() : "";

  if (!newStatus) {
    return res.status(400).json({ ok: false, message: "status is required." });
  }

  if (!ALLOWED_ADMIN_TARGET_STATUSES.has(newStatus as SettlementDisputeStatus)) {
    return res.status(400).json({
      ok: false,
      message: "status must be resolved or rejected.",
    });
  }

  if (!rawAdminNote) {
    return res
      .status(400)
      .json({ ok: false, message: "adminNote is required." });
  }

  if (rawAdminNote.length > 1000) {
    return res
      .status(400)
      .json({ ok: false, message: "adminNote must not exceed 1000 characters." });
  }

  try {
    const updated = await updateDisputeStatusByAdmin({
      disputeId,
      newStatus: newStatus as SettlementDisputeStatus,
      adminNote: rawAdminNote,
      adminUserId,
    });

    if (!updated) {
      return res
        .status(404)
        .json({ ok: false, message: "Settlement dispute not found." });
    }

    return res.status(200).json({
      ok: true,
      message: "Settlement dispute status updated successfully.",
      dispute: updated,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to update settlement dispute status.";

    if (message === "Settlement dispute status transition is invalid.") {
      return res.status(409).json({ ok: false, message });
    }

    return res.status(503).json({ ok: false, message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN: GET /api/admin/settlement-disputes/:disputeId/evidence/:evidenceId/view-url
// ─────────────────────────────────────────────────────────────────────────────

export async function adminGetDisputeEvidenceViewUrlHandler(
  req: Request,
  res: Response,
) {
  const disputeId =
    typeof req.params.disputeId === "string" ? req.params.disputeId : "";
  const evidenceId =
    typeof req.params.evidenceId === "string" ? req.params.evidenceId : "";

  try {
    const doc = await getDisputeDocumentById(disputeId);

    if (!doc) {
      return res
        .status(404)
        .json({ ok: false, message: "Settlement dispute not found." });
    }

    const evidenceItem = doc.evidence.find((ev) => ev.id === evidenceId);

    if (!evidenceItem) {
      return res
        .status(404)
        .json({ ok: false, message: "Evidence not found." });
    }

    const presignResult = await createDisputeEvidenceViewUrl({
      objectKey: evidenceItem.objectKey,
    });

    return res.status(200).json({
      ok: true,
      message: "Settlement dispute evidence access URL created successfully.",
      url: presignResult.url,
      expiresIn: presignResult.expiresIn,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to create evidence access URL.";

    return res.status(503).json({ ok: false, message });
  }
}
