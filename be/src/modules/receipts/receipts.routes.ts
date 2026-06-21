import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  getReceiptByIdHandler,
  getReceiptsHandler,
  uploadReceiptHandler,
} from "./receipts.controller.js";

const receiptsRouter = Router();

receiptsRouter.get("/", authMiddleware, getReceiptsHandler);
receiptsRouter.post("/upload", authMiddleware, uploadReceiptHandler);
receiptsRouter.get("/:receiptId", authMiddleware, getReceiptByIdHandler);

export default receiptsRouter;
