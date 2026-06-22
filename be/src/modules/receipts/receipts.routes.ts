import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  createReceiptHandler,
  createReceiptPresignHandler,
  getReceiptByIdHandler,
  getReceiptViewUrlHandler,
  getReceiptsHandler,
} from "./receipts.controller.js";

const receiptsRouter = Router();

receiptsRouter.get("/", authMiddleware, getReceiptsHandler);
receiptsRouter.post("/presign", authMiddleware, createReceiptPresignHandler);
receiptsRouter.post("/", authMiddleware, createReceiptHandler);
receiptsRouter.get("/:receiptId/view-url", authMiddleware, getReceiptViewUrlHandler);
receiptsRouter.get("/:receiptId", authMiddleware, getReceiptByIdHandler);

export default receiptsRouter;
