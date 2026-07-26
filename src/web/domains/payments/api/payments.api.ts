import { getJson, postJson } from "../../../shared/api/client";
import type {
  CreateVnpayPaymentResponse,
  VerifyVnpayReturnResponse,
} from "../models/payments.types";

export function createVnpayBillingPayment() {
  return postJson<{ plan: "pro" }, CreateVnpayPaymentResponse>(
    "/api/payments/vnpay/billing/create",
    { plan: "pro" },
  );
}

export function verifyVnpayReturn(search: string) {
  return getJson<VerifyVnpayReturnResponse>(`/api/payments/vnpay/return${search}`);
}
