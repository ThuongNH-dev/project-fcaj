export interface CreateVnpayPaymentResponse {
  ok: boolean;
  message: string;
  paymentUrl?: string;
  txnRef?: string;
  amount?: number;
  originalAmount?: number;
  originalCurrency?: "USD" | "VND";
  plan?: "pro";
  returnUrl?: string;
  ipnUrl?: string;
}

export interface VerifyVnpayReturnResponse {
  ok: boolean;
  message: string;
  paymentStatus: "pending" | "success" | "failed";
  redirectPath: string;
}
