import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  createDisputeEvidencePresignHandler,
  createDisputeHandler,
  getDisputeByIdHandler,
  getDisputeEvidenceViewUrlHandler,
  getMyDisputesHandler,
} from "./settlement-disputes.controller.js";

const settlementDisputesRouter = Router();

// Evidence presign (must be before /:disputeId to avoid route conflict)
settlementDisputesRouter.post(
  "/evidence/presign",
  authMiddleware,
  createDisputeEvidencePresignHandler,
);

// List current user's disputes (must be before /:disputeId)
settlementDisputesRouter.get("/my", authMiddleware, getMyDisputesHandler);

// Create dispute
settlementDisputesRouter.post("/", authMiddleware, createDisputeHandler);

// Get dispute by id (only creator)
settlementDisputesRouter.get(
  "/:disputeId",
  authMiddleware,
  getDisputeByIdHandler,
);

// Get evidence view URL (only creator)
settlementDisputesRouter.get(
  "/:disputeId/evidence/:evidenceId/view-url",
  authMiddleware,
  getDisputeEvidenceViewUrlHandler,
);

export default settlementDisputesRouter;
