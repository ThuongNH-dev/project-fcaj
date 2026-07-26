import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  createVnpayBillingPaymentHandler,
  handleVnpayIpnHandler,
  handleVnpayReturnHandler,
} from "./payments.controller.js";

const paymentsRouter = Router();

paymentsRouter.post("/vnpay/billing/create", authMiddleware, createVnpayBillingPaymentHandler);
paymentsRouter.get("/vnpay/return", handleVnpayReturnHandler);
paymentsRouter.get("/vnpay/ipn", handleVnpayIpnHandler);

export default paymentsRouter;
