import { env } from "./env.js";

export type BillingCurrency = "USD" | "VND";

function requirePositiveNumber(value: number, name: string) {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} is not configured. Set it in the backend .env file.`);
  }

  return value;
}

export const billingConfig = {
  proPriceUsd: () => requirePositiveNumber(env.billingProPriceUsd, "BILLING_PRO_PRICE_USD"),
  proPriceVnd: () => requirePositiveNumber(env.billingProPriceVnd, "BILLING_PRO_PRICE_VND"),
  usdToVndRate: () =>
    requirePositiveNumber(env.billingUsdToVndRate, "BILLING_USD_TO_VND_RATE"),
} as const;
