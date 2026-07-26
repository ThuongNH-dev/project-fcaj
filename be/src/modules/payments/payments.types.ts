export type PaymentStatus = "pending" | "success" | "failed";

export interface CreateVnpayBillingPaymentInput {
  userId: string;
  plan: "pro";
  currency: "USD" | "VND";
  bankCode?: string;
  locale?: string;
}

export interface VnpayReturnResult {
  ok: boolean;
  message: string;
  paymentStatus: PaymentStatus;
  redirectPath: string;
}
