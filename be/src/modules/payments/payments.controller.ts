import type { Request, Response } from "express";
import { getUserById } from "../auth/auth.service.js";
import { createVnpayBillingPaymentUrl, handleVnpayReturn } from "./payments.service.js";

export async function createVnpayBillingPaymentHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;
  const { bankCode, locale, plan } = req.body as {
    bankCode?: string;
    locale?: string;
    plan?: "pro";
  };

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  if (plan !== "pro") {
    return res.status(400).json({
      ok: false,
      message: "Only the Pro plan can be purchased with VNPay.",
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

    const result = await createVnpayBillingPaymentUrl(
      {
        userId: currentUser.id,
        plan,
        currency: currentUser.defaultCurrency === "VND" ? "VND" : "USD",
        bankCode,
        locale,
      },
      req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? req.ip,
    );

    return res.status(200).json({
      ok: true,
      message: "VNPay billing payment URL created successfully.",
      ...result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create VNPay billing payment URL.";

    const statusCode =
      message === "User not found."
        ? 404
        : message === "Your Pro plan is already active."
          ? 409
          : 503;

    return res.status(statusCode).json({
      ok: false,
      message,
    });
  }
}

export async function handleVnpayReturnHandler(req: Request, res: Response) {
  try {
    const result = await handleVnpayReturn(req.query, "return");
    return res.status(200).json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to verify VNPay return.";

    return res.status(400).json({
      ok: false,
      message,
      paymentStatus: "failed",
      redirectPath: "/settings?tab=billing",
    });
  }
}

export async function handleVnpayIpnHandler(req: Request, res: Response) {
  try {
    await handleVnpayReturn(req.query, "ipn");

    return res.status(200).json({
      RspCode: "00",
      Message: "Confirm Success",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to process VNPay IPN.";

    return res.status(200).json({
      RspCode: "97",
      Message: message,
    });
  }
}
