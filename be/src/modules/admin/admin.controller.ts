import type { Request, Response } from "express";
import { getUserById } from "../auth/auth.service.js";
import {
  deleteGroupById,
  getAllGroups,
  getGroupById,
} from "../groups/groups.service.js";
import {
  getAdminActivityLogs,
  getAdminDashboardStats,
  getAdminRejectedRecords,
  getAdminSettlementRecordById,
  getAdminSettlementRecords,
  getAdminUploadRecords,
} from "./admin.service.js";

export async function getAdminSessionHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  try {
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Admin session fetched successfully.",
      user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch admin session.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function getAdminDashboardHandler(_req: Request, res: Response) {
  try {
    const stats = await getAdminDashboardStats();

    return res.status(200).json({
      ok: true,
      message: "Admin dashboard fetched successfully.",
      stats,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch admin dashboard.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function getAdminGroupsHandler(_req: Request, res: Response) {
  try {
    const groups = await getAllGroups();

    return res.status(200).json({
      ok: true,
      message: "Admin groups fetched successfully.",
      groups,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch admin groups.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function getAdminGroupByIdHandler(req: Request, res: Response) {
  const groupId =
    typeof req.params.groupId === "string" ? req.params.groupId : "";

  try {
    const group = await getGroupById(groupId);

    if (!group) {
      return res.status(404).json({
        ok: false,
        message: "Group not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Admin group fetched successfully.",
      group,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch admin group.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function deleteAdminGroupHandler(req: Request, res: Response) {
  const groupId =
    typeof req.params.groupId === "string" ? req.params.groupId : "";

  try {
    const deleted = await deleteGroupById(groupId);

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        message: "Group not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Group deleted successfully.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete admin group.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function getAdminUploadsHandler(_req: Request, res: Response) {
  try {
    const uploads = await getAdminUploadRecords();

    return res.status(200).json({
      ok: true,
      message: "Admin uploads fetched successfully.",
      uploads,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch admin uploads.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function getAdminRejectedHandler(_req: Request, res: Response) {
  try {
    const rejectedItems = await getAdminRejectedRecords();

    return res.status(200).json({
      ok: true,
      message: "Admin rejected items fetched successfully.",
      rejectedItems,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to fetch admin rejected items.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function getAdminActivityLogsHandler(_req: Request, res: Response) {
  try {
    const activityLogs = await getAdminActivityLogs();

    return res.status(200).json({
      ok: true,
      message: "Admin activity logs fetched successfully.",
      activityLogs,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to fetch admin activity logs.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function getAdminSettlementsHandler(req: Request, res: Response) {
  const status =
    typeof req.query.status === "string" ? req.query.status.trim().toLowerCase() : "";
  const search = typeof req.query.search === "string" ? req.query.search : undefined;
  const groupId = typeof req.query.groupId === "string" ? req.query.groupId : undefined;
  const paidByUserId =
    typeof req.query.paidByUserId === "string" ? req.query.paidByUserId : undefined;

  if (status && status !== "pending" && status !== "settled") {
    return res.status(400).json({
      ok: false,
      message: "Settlement status filter must be either pending or settled.",
    });
  }

  try {
    const settlements = await getAdminSettlementRecords({
      status: status ? (status as "pending" | "settled") : undefined,
      search,
      groupId,
      paidByUserId,
    });

    return res.status(200).json({
      ok: true,
      message: "Admin settlements fetched successfully.",
      settlements,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch admin settlements.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function getAdminSettlementByIdHandler(req: Request, res: Response) {
  const expenseId =
    typeof req.params.expenseId === "string" ? req.params.expenseId : "";

  try {
    const settlement = await getAdminSettlementRecordById(expenseId);

    if (!settlement) {
      return res.status(404).json({
        ok: false,
        message: "Settlement not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Admin settlement fetched successfully.",
      settlement,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch admin settlement.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}
