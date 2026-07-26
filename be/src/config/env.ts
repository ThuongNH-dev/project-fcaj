import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: envFilePath });

const emailProvider = (
  process.env.EMAIL_PROVIDER ||
  (process.env.GMAIL_SMTP_USER && process.env.GMAIL_APP_PASSWORD
    ? "gmail"
    : process.env.RESEND_API_KEY
      ? "resend"
      : "console")
).toLowerCase();

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required.`);
  }

  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  backendUrl:
    process.env.BACKEND_URL?.replace(/\/$/, "") || "http://localhost:5000",
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
  mongoDb: process.env.MONGODB_DB || "project_fcaj",
  jwtSecret: requireEnv("JWT_SECRET"),
  frontendUrl:
    process.env.FRONTEND_URL?.replace(/\/$/, "") || "http://localhost:5173",
  awsRegion: process.env.AWS_REGION?.trim() || "",
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID?.trim() || "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  s3ReceiptsBucket: process.env.S3_RECEIPTS_BUCKET?.trim() || "",
  s3ReceiptsPrefix: process.env.S3_RECEIPTS_PREFIX?.trim() || "receipts/",
  s3PresignExpiresSeconds:
    Number(process.env.S3_PRESIGN_EXPIRES_SECONDS) || 300,
  emailProvider,
  emailFrom: process.env.EMAIL_FROM?.trim() || "",
  gmailSmtpUser: process.env.GMAIL_SMTP_USER?.trim() || "",
  gmailAppPassword: process.env.GMAIL_APP_PASSWORD || "",
  resendApiKey: process.env.RESEND_API_KEY || "",
  resendApiUrl: process.env.RESEND_API_URL || "https://api.resend.com/emails",
  vnpayTmnCode: requireEnv("VNPAY_TMN_CODE"),
  vnpayHashSecret: requireEnv("VNPAY_HASH_SECRET"),
  vnpayUrl:
    process.env.VNPAY_URL?.trim() ||
    "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  billingProPriceUsd: Number(process.env.BILLING_PRO_PRICE_USD),
  billingUsdToVndRate: Number(process.env.BILLING_USD_TO_VND_RATE),
  billingProPriceVnd: Number(process.env.BILLING_PRO_PRICE_VND),
  vnpayReturnPath:
    process.env.VNPAY_RETURN_PATH?.trim() || "/payment/vnpay/return",
  vnpayIpnPath:
    process.env.VNPAY_IPN_PATH?.trim() || "/api/payments/vnpay/ipn",
} as const;
