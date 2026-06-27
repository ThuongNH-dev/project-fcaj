import { ObjectId as MongoObjectId } from "mongodb";
import {
  getExpensesCollection,
  type ExpenseDocument,
} from "../../expenses/expenses.service.js";
import type {
  AdminSettlementDetail,
  AdminSettlementFilters,
  AdminSettlementParticipant,
  AdminSettlementRecord,
} from "../admin.types.js";
import { buildReferenceMaps, toAdminSettlementRecord } from "./admin.shared.js";

export async function getAdminSettlementRecords(
  filters: AdminSettlementFilters = {},
): Promise<AdminSettlementRecord[]> {
  const expenses = await getExpensesCollection();
  const query: Partial<
    Pick<ExpenseDocument, "groupId" | "paidByUserId" | "settlementStatus">
  > = {};
  const normalizedSearch = filters.search?.trim().toLowerCase();

  if (filters.status) {
    query.settlementStatus = filters.status;
  }

  if (filters.groupId) {
    query.groupId = filters.groupId;
  }

  if (filters.paidByUserId) {
    query.paidByUserId = filters.paidByUserId;
  }

  const expenseCursor = expenses.find(query).sort({ updatedAt: -1 });

  if (!normalizedSearch) {
    expenseCursor.limit(200);
  }

  const expenseDocuments = await expenseCursor.toArray();

  const referenceMaps = await buildReferenceMaps({
    expenseIds: [],
    groupIds: Array.from(
      new Set(expenseDocuments.map((expenseDocument) => expenseDocument.groupId)),
    ).filter((groupId) => MongoObjectId.isValid(groupId)),
    userIds: Array.from(
      new Set(
        expenseDocuments.flatMap((expenseDocument) => [
          expenseDocument.createdBy,
          expenseDocument.paidByUserId,
          expenseDocument.settledBy ?? "",
        ]),
      ),
    ).filter((userId) => MongoObjectId.isValid(userId)),
  });

  const records = expenseDocuments.map((expenseDocument: ExpenseDocument) =>
    toAdminSettlementRecord({
      expenseDocument,
      groupsById: referenceMaps.groupsById,
      usersById: referenceMaps.usersById,
    }),
  );

  if (!normalizedSearch) {
    return records;
  }

  return records
    .filter((record) => {
      return (
        record.title.toLowerCase().includes(normalizedSearch) ||
        record.groupName?.toLowerCase().includes(normalizedSearch) === true ||
        record.createdByName.toLowerCase().includes(normalizedSearch) ||
        record.paidByName.toLowerCase().includes(normalizedSearch) ||
        record.settledByName?.toLowerCase().includes(normalizedSearch) === true
      );
    })
    .slice(0, 200);
}

export async function getAdminSettlementRecordById(
  expenseId: string,
): Promise<AdminSettlementDetail | null> {
  if (!MongoObjectId.isValid(expenseId)) {
    return null;
  }

  const expenses = await getExpensesCollection();
  const expenseDocument = await expenses.findOne({
    _id: new MongoObjectId(expenseId),
  });

  if (!expenseDocument?._id) {
    return null;
  }

  const referenceMaps = await buildReferenceMaps({
    expenseIds: [],
    groupIds: [expenseDocument.groupId].filter((groupId) => MongoObjectId.isValid(groupId)),
    userIds: Array.from(
      new Set([
        expenseDocument.createdBy,
        expenseDocument.paidByUserId,
        expenseDocument.settledBy ?? "",
        ...expenseDocument.participants.map((participant) => participant.userId),
      ]),
    ).filter((userId) => MongoObjectId.isValid(userId)),
  });

  const participants: AdminSettlementParticipant[] = expenseDocument.participants.map(
    (participant) => ({
      email: referenceMaps.usersById.get(participant.userId)?.email ?? "",
      name: referenceMaps.usersById.get(participant.userId)?.name ?? "Unknown user",
      shareAmount: participant.shareAmount,
      userId: participant.userId,
    }),
  );

  return {
    ...toAdminSettlementRecord({
      expenseDocument,
      groupsById: referenceMaps.groupsById,
      usersById: referenceMaps.usersById,
    }),
    description: expenseDocument.description,
    participants,
    receiptId: expenseDocument.receiptId,
    reviewStatus: expenseDocument.reviewStatus,
  };
}
