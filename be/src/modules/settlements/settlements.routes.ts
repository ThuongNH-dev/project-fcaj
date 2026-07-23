import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  getMySettlementsHandler,
  markSettlementAsSentHandler,
} from "./settlements.controller.js";

const settlementsRouter = Router();

// GET /my must be declared before /:settlementId to avoid route conflict
settlementsRouter.get("/my", authMiddleware, getMySettlementsHandler);
settlementsRouter.patch("/:settlementId/sent", authMiddleware, markSettlementAsSentHandler);

export default settlementsRouter;
