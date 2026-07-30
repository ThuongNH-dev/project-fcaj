export type SettlementStatus = "pending" | "sent";

export type SettlementRole = "debtor" | "creditor";

export type SettlementSentSource = "debtor" | "creditor_settlement";

export type SettlementPaymentNotificationStatus =
  | "not_required"
  | "pending"
  | "sent";

export type SettlementCurrency = "USD" | "VND";

export interface Settlement {
  id: string;
  expenseId: string;
  groupId: string;
  debtorUserId: string;
  creditorUserId: string;
  amount: number;
  currency: SettlementCurrency;
  status: SettlementStatus;
  sentAt: string | null;
  sentSource: SettlementSentSource | null;
  paymentNotificationStatus: SettlementPaymentNotificationStatus;
  paymentNotificationSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SettlementPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface GetMySettlementsParams {
  page?: number;
  limit?: number;
  status?: SettlementStatus;
  groupId?: string;
  expenseId?: string;
  role?: SettlementRole;
}

export interface GetMySettlementsResponse {
  ok: boolean;
  message: string;
  settlements: Settlement[];
  pagination: SettlementPagination;
}

export interface MarkSettlementAsSentResponse {
  ok: boolean;
  message: string;
  settlement: Settlement;
}
