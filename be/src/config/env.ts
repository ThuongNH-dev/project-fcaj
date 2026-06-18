import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.resolve(__dirname, "../../.env");

dotenv.config({ path: envFilePath });

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017",
  mongoDb: process.env.MONGODB_DB || "project_fcaj",
  jwtSecret: process.env.JWT_SECRET || "project-fcaj-dev-secret",
  frontendUrl:
    process.env.FRONTEND_URL?.replace(/\/$/, "") || "http://localhost:5173",
  emailFrom: process.env.EMAIL_FROM || "Splitly <no-reply@splitly.local>",
  resendApiKey: process.env.RESEND_API_KEY || "",
  resendApiUrl: process.env.RESEND_API_URL || "https://api.resend.com/emails",
} as const;
