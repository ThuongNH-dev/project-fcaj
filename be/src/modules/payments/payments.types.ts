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

export interface BillingPaymentHistoryRecord {
  id: string;
  txnRef: string;
  amount: number;
  currency: "VND";
  status: PaymentStatus;
  plan: "pro";
  paidAt: string | null;
  activatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
