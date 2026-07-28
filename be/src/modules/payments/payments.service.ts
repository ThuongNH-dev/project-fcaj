import crypto from "crypto";
import type { Collection, IndexDescription, ObjectId } from "mongodb";
import { billingConfig } from "../../config/billing.js";
import { connectToMongo } from "../../db/mongo.js";
import { env } from "../../config/env.js";
import { getCurrentUserBillingSummary, updateCurrentUserBillingPlan } from "../auth/auth.service.js";
import type {
  BillingPaymentHistoryRecord,
  CreateVnpayBillingPaymentInput,
  PaymentStatus,
  VnpayReturnResult,
} from "./payments.types.js";

interface BillingPaymentDocument {
  _id?: ObjectId;
  provider: "vnpay";
  scope: "billing";
  userId: string;
  plan: "pro";
  txnRef: string;
  amount: number;
  currency: "VND";
  orderInfo: string;
  bankCode: string | null;
  locale: "vn" | "en";
  status: PaymentStatus;
  responseCode: string | null;
  transactionStatus: string | null;
  vnpTransactionNo: string | null;
  bankTranNo: string | null;
  paidAt: Date | null;
  activatedAt: Date | null;
  expiresAt: Date | null;
  returnQuery: Record<string, string> | null;
  ipnQuery: Record<string, string> | null;
  createdAt: Date;
  updatedAt: Date;
}

const VNPAY_VERSION = "2.1.0";
const VNPAY_COMMAND = "pay";
const VNPAY_ORDER_TYPE = "other";
let indexesEnsured = false;

function encodeVnpayValue(value: string) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

function normalizeAndSortParams(params: Record<string, string>) {
  const sortedKeys = Object.keys(params).sort();
  const sortedParams: Record<string, string> = {};

  sortedKeys.forEach((key) => {
    sortedParams[key] = encodeVnpayValue(params[key]);
  });

  return sortedParams;
}

function buildUnsignedQuery(params: Record<string, string>) {
  const sortedParams = normalizeAndSortParams(params);

  return Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
}

function signParams(params: Record<string, string>) {
  return crypto
    .createHmac("sha512", env.vnpayHashSecret)
    .update(buildUnsignedQuery(params), "utf8")
    .digest("hex");
}

function formatVnpayDate(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("");
}

function getClientIp(rawIp?: string | string[]) {
  const firstIp = Array.isArray(rawIp) ? rawIp[0] : rawIp;

  if (!firstIp?.trim()) {
    return "127.0.0.1";
  }

  const normalizedIp = firstIp.split(",")[0]?.trim() || "127.0.0.1";

  if (normalizedIp === "::1" || normalizedIp === "0:0:0:0:0:0:0:1") {
    return "127.0.0.1";
  }

  return normalizedIp;
}

function normalizeLocale(value?: string) {
  return value?.trim().toLowerCase() === "en" ? "en" : "vn";
}

function normalizeBankCode(value?: string) {
  const normalized = value?.trim().toUpperCase();
  return normalized ? normalized : null;
}

function sanitizeOrderInfo(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 255);
}

function getBillingPrice(currency: "USD" | "VND") {
  return currency === "USD"
    ? billingConfig.proPriceUsd()
    : billingConfig.proPriceVnd();
}

function getUsdToVndRate() {
  return billingConfig.usdToVndRate();
}

function sanitizeQuery(query: Record<string, unknown>) {
  return Object.entries(query).reduce<Record<string, string>>((result, [key, value]) => {
    if (typeof value === "string") {
      result[key] = value;
    }

    return result;
  }, {});
}

async function ensurePaymentIndexes(collection: Collection<BillingPaymentDocument>) {
  if (indexesEnsured) {
    return;
  }

  const indexes: IndexDescription[] = [
    { key: { txnRef: 1 }, name: "txnRef_idx", unique: true },
    { key: { userId: 1, createdAt: -1 }, name: "user_createdAt_idx" },
    { key: { status: 1, updatedAt: -1 }, name: "status_updatedAt_idx" },
  ];

  await collection.createIndexes(indexes);
  indexesEnsured = true;
}

async function getPaymentsCollection() {
  const db = await connectToMongo();
  const collection = db.collection<BillingPaymentDocument>("payments");

  await ensurePaymentIndexes(collection);

  return collection;
}

function addOneMonth(date: Date) {
  const nextDate = new Date(date);
  nextDate.setMonth(nextDate.getMonth() + 1);
  return nextDate;
}

function getReturnUrl() {
  return `${env.frontendUrl}${env.vnpayReturnPath}`;
}

function getIpnUrl() {
  return `${env.backendUrl}${env.vnpayIpnPath}`;
}

export async function createVnpayBillingPaymentUrl(
  input: CreateVnpayBillingPaymentInput,
  rawIp?: string | string[],
) {
  const billing = await getCurrentUserBillingSummary(input.userId);

  if (!billing) {
    throw new Error("User not found.");
  }

  if (billing.profile.plan === "pro") {
    throw new Error("Your Pro plan is already active.");
  }

  const createdAt = new Date();
  const expireAt = new Date(createdAt.getTime() + 15 * 60 * 1000);
  const locale = normalizeLocale(input.locale);
  const bankCode = normalizeBankCode(input.bankCode);
  const displayCurrency = input.currency;
  const displayAmount = getBillingPrice(displayCurrency);
  const vndAmount = Math.round(
    displayCurrency === "USD"
      ? displayAmount * getUsdToVndRate()
      : displayAmount,
  );
  const txnRef = `BILL${input.userId.slice(-6).toUpperCase()}${createdAt.getTime()}`;
  const orderInfo = sanitizeOrderInfo(`Upgrade Splitly to Pro ${input.userId}`);
  const vnpParams: Record<string, string> = {
    vnp_Amount: Math.round(vndAmount * 100).toString(),
    vnp_Command: VNPAY_COMMAND,
    vnp_CreateDate: formatVnpayDate(createdAt),
    vnp_CurrCode: "VND",
    vnp_ExpireDate: formatVnpayDate(expireAt),
    vnp_IpAddr: getClientIp(rawIp),
    vnp_Locale: locale,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: VNPAY_ORDER_TYPE,
    vnp_ReturnUrl: getReturnUrl(),
    vnp_TmnCode: env.vnpayTmnCode,
    vnp_TxnRef: txnRef,
    vnp_Version: VNPAY_VERSION,
  };

  if (bankCode) {
    vnpParams.vnp_BankCode = bankCode;
  }

  const hashData = buildUnsignedQuery(vnpParams);
  const secureHash = signParams(vnpParams);
  const payments = await getPaymentsCollection();

  await payments.insertOne({
    provider: "vnpay",
    scope: "billing",
    userId: input.userId,
    plan: input.plan,
    txnRef,
    amount: vndAmount,
    currency: "VND",
    orderInfo,
    bankCode,
    locale,
    status: "pending",
    responseCode: null,
    transactionStatus: null,
    vnpTransactionNo: null,
    bankTranNo: null,
    paidAt: null,
    activatedAt: null,
    expiresAt: null,
    returnQuery: null,
    ipnQuery: null,
    createdAt,
    updatedAt: createdAt,
  });

  const paymentUrl = `${env.vnpayUrl}?${hashData}&vnp_SecureHash=${secureHash}`;

  return {
    paymentUrl,
    txnRef,
    amount: vndAmount,
    plan: input.plan,
    ipnUrl: getIpnUrl(),
    returnUrl: getReturnUrl(),
  };
}

export function verifyVnpayResponse(query: Record<string, unknown>) {
  const sanitizedQuery = sanitizeQuery(query);
  const secureHash = sanitizedQuery.vnp_SecureHash;

  if (!secureHash) {
    throw new Error("Missing VNPay secure hash.");
  }

  const paramsToSign = { ...sanitizedQuery };
  delete paramsToSign.vnp_SecureHash;
  delete paramsToSign.vnp_SecureHashType;

  const expectedHash = signParams(paramsToSign);

  if (expectedHash !== secureHash) {
    throw new Error("Invalid VNPay secure hash.");
  }

  return sanitizedQuery;
}

export async function handleVnpayReturn(
  query: Record<string, unknown>,
  source: "return" | "ipn",
): Promise<VnpayReturnResult> {
  const verifiedQuery = verifyVnpayResponse(query);

  const txnRef = verifiedQuery.vnp_TxnRef ?? "";
  const responseCode = verifiedQuery.vnp_ResponseCode ?? "";
  const transactionStatus = verifiedQuery.vnp_TransactionStatus ?? "";
  const isSuccess = responseCode === "00" && transactionStatus === "00";
  const payments = await getPaymentsCollection();
  const payment = await payments.findOne({ txnRef, scope: "billing" });

  if (!payment) {
    throw new Error("Payment transaction was not found.");
  }

  const updatedAt = new Date();
  const updateFields: Partial<BillingPaymentDocument> = {
    status: isSuccess ? "success" : "failed",
    responseCode,
    transactionStatus,
    vnpTransactionNo: verifiedQuery.vnp_TransactionNo ?? null,
    bankTranNo: verifiedQuery.vnp_BankTranNo ?? null,
    paidAt: isSuccess ? updatedAt : null,
    updatedAt,
  };

  if (source === "return") {
    updateFields.returnQuery = verifiedQuery;
  } else {
    updateFields.ipnQuery = verifiedQuery;
  }

  await payments.updateOne({ txnRef }, { $set: updateFields });

  if (isSuccess) {
    const activatedAt = new Date();
    await updateCurrentUserBillingPlan(payment.userId, { plan: payment.plan });
    await payments.updateOne(
      { txnRef },
      {
        $set: {
          activatedAt,
          expiresAt: addOneMonth(activatedAt),
        },
      },
    );
  }

  return {
    ok: isSuccess,
    message: isSuccess
      ? "VNPay payment completed and Pro plan activated successfully."
      : `VNPay payment failed with code ${responseCode || "unknown"}.`,
    paymentStatus: isSuccess ? "success" : "failed",
    redirectPath: "/settings?tab=billing",
  };
}

export async function getBillingPaymentHistory(
  userId: string,
): Promise<BillingPaymentHistoryRecord[]> {
  const payments = await getPaymentsCollection();
  const paymentDocuments = await payments
    .find({ scope: "billing", userId })
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

  return paymentDocuments.map((paymentDocument) => ({
    id: paymentDocument._id?.toString() ?? paymentDocument.txnRef,
    txnRef: paymentDocument.txnRef,
    amount: paymentDocument.amount,
    currency: paymentDocument.currency,
    status: paymentDocument.status,
    plan: paymentDocument.plan,
    paidAt: paymentDocument.paidAt?.toISOString() ?? null,
    activatedAt: paymentDocument.activatedAt?.toISOString() ?? null,
    createdAt: paymentDocument.createdAt.toISOString(),
    updatedAt: paymentDocument.updatedAt.toISOString(),
  }));
}
