import type { Request, Response } from "express";
import { ObjectId as MongoObjectId } from "mongodb";
import { getUserById } from "../auth/auth.service.js";
import {
  normalizeNotificationPreferences,
} from "../notifications/notifications.service.js";
import { getUsersCollection } from "../auth/auth.service.js";
import {
  createNotificationIdempotently,
} from "../notifications/notifications.service.js";
import {
  getSettlementsForUser,
  markSettlementAsSent,
  updateSettlementNotificationStatus,
  getSettlementById,
} from "./settlements.service.js";
import type { GetMySettlementsFilters } from "./settlements.types.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/settlements/my
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/settlements/my:
 *   get:
 *     summary: Get settlements for the current user
 *     tags:
 *       - Settlements
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, sent]
 *         description: Filter by settlement status.
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [debtor, creditor]
 *         description: Filter by user role in the settlement.
 *       - in: query
 *         name: groupId
 *         schema:
 *           type: string
 *         description: Filter by group ID.
 *       - in: query
 *         name: expenseId
 *         schema:
 *           type: string
 *         description: Filter by expense ID.
 *     responses:
 *       200:
 *         description: Settlements fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 settlements:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       expenseId:
 *                         type: string
 *                       groupId:
 *                         type: string
 *                       debtorUserId:
 *                         type: string
 *                       creditorUserId:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                         enum: [USD, VND]
 *                       status:
 *                         type: string
 *                         enum: [pending, sent]
 *                       sentAt:
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
 *         description: Invalid query parameters.
 *       401:
 *         description: Unauthenticated.
 *       503:
 *         description: Database failure.
 */
export async function getMySettlementsHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  // ── Validate pagination ──────────────────────────────────────────────────
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

  // ── Validate filters ────────────────────────────────────────────────────
  const filters: GetMySettlementsFilters = {};

  if (req.query.status !== undefined) {
    const rawStatus = String(req.query.status);
    if (rawStatus !== "pending" && rawStatus !== "sent") {
      return res.status(400).json({
        ok: false,
        message: "Status must be either \"pending\" or \"sent\".",
      });
    }
    filters.status = rawStatus;
  }

  if (req.query.groupId !== undefined) {
    const rawGroupId = String(req.query.groupId);
    if (!MongoObjectId.isValid(rawGroupId)) {
      return res.status(400).json({
        ok: false,
        message: "groupId must be a valid ObjectId.",
      });
    }
    filters.groupId = rawGroupId;
  }

  if (req.query.expenseId !== undefined) {
    const rawExpenseId = String(req.query.expenseId);
    if (!MongoObjectId.isValid(rawExpenseId)) {
      return res.status(400).json({
        ok: false,
        message: "expenseId must be a valid ObjectId.",
      });
    }
    filters.expenseId = rawExpenseId;
  }

  if (req.query.role !== undefined) {
    const rawRole = String(req.query.role);
    if (rawRole !== "debtor" && rawRole !== "creditor") {
      return res.status(400).json({
        ok: false,
        message: "Role must be either \"debtor\" or \"creditor\".",
      });
    }
    filters.role = rawRole;
  }

  try {
    const { settlements, total } = await getSettlementsForUser(
      userId,
      filters,
      { page, limit },
    );

    return res.status(200).json({
      ok: true,
      message: "Settlements fetched successfully.",
      settlements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch settlements.";

    return res.status(503).json({ ok: false, message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/settlements/:settlementId/sent
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /api/settlements/{settlementId}/sent:
 *   patch:
 *     summary: Mark a settlement as sent (debtor only)
 *     description: |
 *       Only the debtor can mark a settlement as sent.
 *       This operation is idempotent — calling it again when already sent
 *       returns the settlement with `wasAlreadySent: true`.
 *       A payment_received notification is sent to the creditor if they have
 *       opted in to paymentReceived notifications.
 *     tags:
 *       - Settlements
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: settlementId
 *         required: true
 *         schema:
 *           type: string
 *         description: Settlement ID.
 *     responses:
 *       200:
 *         description: Settlement marked as sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 settlement:
 *                   type: object
 *       400:
 *         description: Invalid settlementId.
 *       401:
 *         description: Unauthenticated.
 *       404:
 *         description: Settlement not found or not owned by debtor.
 *       503:
 *         description: Database failure.
 */
export async function markSettlementAsSentHandler(
  req: Request,
  res: Response,
) {
  const userId = req.auth?.userId;
  const settlementId =
    typeof req.params.settlementId === "string"
      ? req.params.settlementId
      : "";

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  if (!MongoObjectId.isValid(settlementId)) {
    return res.status(400).json({
      ok: false,
      message: "settlementId must be a valid ObjectId.",
    });
  }

  try {
    const currentUser = await getUserById(userId);

    if (!currentUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    // ── Check creditor preference BEFORE marking sent ─────────────────────
    // We need the settlement to know creditorUserId
    const existingSettlement = await getSettlementById(settlementId);

    if (!existingSettlement) {
      return res.status(404).json({
        ok: false,
        message: "Settlement not found.",
      });
    }

    // Only the debtor can mark as sent
    if (existingSettlement.debtorUserId !== currentUser.id) {
      return res.status(404).json({
        ok: false,
        message: "Settlement not found.",
      });
    }

    // Determine if notification should be pending BEFORE the transition
    let notificationPending = false;
    if (existingSettlement.status === "pending") {
      // Check creditor's paymentReceived preference
      const users = await getUsersCollection();
      const creditorUser = await users.findOne({
        _id: new MongoObjectId(existingSettlement.creditorUserId),
      });

      const creditorPreferences = normalizeNotificationPreferences(
        creditorUser?.notificationPreferences as
          | Partial<Record<string, unknown>>
          | undefined,
      );

      notificationPending = creditorPreferences.paymentReceived === true;
    }

    // ── Atomic mark as sent ───────────────────────────────────────────────
    const result = await markSettlementAsSent(
      settlementId,
      currentUser.id,
      notificationPending,
    );

    if (!result) {
      return res.status(404).json({
        ok: false,
        message: "Settlement not found.",
      });
    }

    // ── Handle notification ───────────────────────────────────────────────
    let notificationSuccess = false;
    if (!result.wasAlreadySent && notificationPending) {
      // First transition — create notification
      notificationSuccess = await tryCreatePaymentSentNotification(
        result.settlement.id,
        existingSettlement,
        currentUser,
      );
    } else if (
      result.wasAlreadySent &&
      existingSettlement.paymentNotificationStatus === "pending"
    ) {
      // Retry: settlement already sent but notification wasn't created yet
      notificationSuccess = await tryCreatePaymentSentNotification(
        result.settlement.id,
        existingSettlement,
        currentUser,
      );
    }

    // Refetch settlement if notification was successfully created to return latest state
    let finalSettlement = result.settlement;
    if (notificationSuccess) {
      const { toPublicSettlement } = await import("./settlements.service.js");
      const updatedDoc = await getSettlementById(result.settlement.id);
      if (updatedDoc) {
        finalSettlement = toPublicSettlement(updatedDoc);
      }
    }

    return res.status(200).json({
      ok: true,
      message: result.wasAlreadySent
        ? "Settlement was already marked as sent."
        : "Settlement marked as sent successfully.",
      settlement: finalSettlement,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to mark settlement as sent.";

    return res.status(503).json({ ok: false, message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: try to create payment-sent notification and update settlement state
// ─────────────────────────────────────────────────────────────────────────────

interface MinimalUser {
  id: string;
  firstName: string;
  lastName: string;
}

async function tryCreatePaymentSentNotification(
  settlementId: string,
  settlement: {
    expenseId: string;
    groupId: string;
    creditorUserId: string;
    amount: number;
    currency: string;
  },
  debtor: MinimalUser,
): Promise<boolean> {
  try {
    const debtorName = `${debtor.firstName} ${debtor.lastName}`.trim();

    const formattedAmount =
      settlement.currency === "VND"
        ? new Intl.NumberFormat("vi-VN").format(settlement.amount)
        : new Intl.NumberFormat("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(settlement.amount);

    const created = await createNotificationIdempotently({
      recipientUserId: settlement.creditorUserId,
      actorUserId: debtor.id,
      type: "payment_received",
      title: "Payment sent",
      message: `${debtorName} marked a payment of ${formattedAmount} ${settlement.currency} as sent.`,
      groupId: settlement.groupId,
      expenseId: settlement.expenseId,
      settlementId,
      deduplicationKey: `payment-sent:${settlementId}`,
    });

    if (created) {
      await updateSettlementNotificationStatus(settlementId);
      return true;
    }
    return false;
  } catch {
    // Notification failure must NOT rollback the settlement transition.
    // The paymentNotificationStatus remains "pending" and can be retried.
    return false;
  }
}
