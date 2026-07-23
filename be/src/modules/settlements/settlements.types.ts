import type { ObjectId } from "mongodb";
import type { SupportedCurrency } from "../auth/auth.types.js";

export type SettlementStatus = "pending" | "sent";
export type SentSource = "debtor" | "creditor_settlement";
export type PaymentNotificationStatus = "not_required" | "pending" | "sent";

export interface SettlementDocument {
  _id?: ObjectId;
  expenseId: string;
  groupId: string;
  debtorUserId: string;
  creditorUserId: string;
  amount: number;
  currency: SupportedCurrency;
  status: SettlementStatus;
  sentAt: Date | null;
  sentSource: SentSource | null;
  paymentNotificationStatus: PaymentNotificationStatus;
  paymentNotificationSentAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicSettlement {
  id: string;
  expenseId: string;
  groupId: string;
  debtorUserId: string;
  creditorUserId: string;
  amount: number;
  currency: SupportedCurrency;
  status: SettlementStatus;
  sentAt: string | null;
  sentSource: SentSource | null;
  paymentNotificationStatus: PaymentNotificationStatus;
  paymentNotificationSentAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetMySettlementsFilters {
  status?: SettlementStatus;
  groupId?: string;
  expenseId?: string;
  role?: "debtor" | "creditor";
}

export interface PaginationOptions {
  page: number;
  limit: number;
}
