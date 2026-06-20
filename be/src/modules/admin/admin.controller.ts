import type { Request, Response } from "express";
import { getUserById } from "../auth/auth.service.js";
import {
  deleteGroupById,
  getAllGroups,
  getGroupById,
} from "../groups/groups.service.js";
import { getAdminDashboardStats } from "./admin.service.js";

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
