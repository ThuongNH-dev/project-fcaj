import type { Request, Response } from "express";
import { getUserById } from "../auth/auth.service.js";
import {
  createGroup,
  deleteGroup,
  getGroupByIdForUser,
  getGroupsByUserId,
  updateGroup,
} from "./groups.service.js";

export async function getGroupsHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  try {
    const currentUser = await getUserById(userId);

    if (!currentUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    const groups = await getGroupsByUserId(currentUser.id);

    return res.status(200).json({
      ok: true,
      message: "Groups fetched successfully.",
      groups,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch groups.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function createGroupHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  const { name, icon, color } = req.body as {
    name?: string;
    icon?: string;
    color?: string;
    members?: string[];
  };

  if (!name?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Group name is required.",
    });
  }

  if (!icon?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Group icon is required.",
    });
  }

  if (!color?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Group color is required.",
    });
  }

  if (req.body.members !== undefined) {
    if (
      !Array.isArray(req.body.members) ||
      req.body.members.some((memberId: unknown) => typeof memberId !== "string")
    ) {
      return res.status(400).json({
        ok: false,
        message: "Members must be an array of email addresses.",
      });
    }
  }

  try {
    const currentUser = await getUserById(userId);

    if (!currentUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    const group = await createGroup({
      name,
      icon,
      color,
      createdBy: currentUser.id,
      members: req.body.members,
    });

    return res.status(201).json({
      ok: true,
      message: "Group created successfully.",
      group,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to create group.";

    const statusCode =
      message === "One or more member emails do not exist."
        ? 400
        : 503;

    return res.status(statusCode).json({
      ok: false,
      message,
    });
  }
}

export async function getGroupByIdHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;
  const groupId =
    typeof req.params.groupId === "string" ? req.params.groupId : "";

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  try {
    const currentUser = await getUserById(userId);

    if (!currentUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    const group = await getGroupByIdForUser(groupId, currentUser.id);

    if (!group) {
      return res.status(404).json({
        ok: false,
        message: "Group not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Group fetched successfully.",
      group,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch group.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function updateGroupHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;
  const groupId =
    typeof req.params.groupId === "string" ? req.params.groupId : "";

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  const { name, icon, color } = req.body as {
    name?: string;
    icon?: string;
    color?: string;
  };

  if (!name?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Group name is required.",
    });
  }

  if (!icon?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Group icon is required.",
    });
  }

  if (!color?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Group color is required.",
    });
  }

  try {
    const currentUser = await getUserById(userId);

    if (!currentUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    const group = await updateGroup({
      groupId,
      userId: currentUser.id,
      name,
      icon,
      color,
    });

    if (!group) {
      return res.status(404).json({
        ok: false,
        message: "Group not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Group updated successfully.",
      group,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update group.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function deleteGroupHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;
  const groupId =
    typeof req.params.groupId === "string" ? req.params.groupId : "";

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  try {
    const currentUser = await getUserById(userId);

    if (!currentUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    const deleted = await deleteGroup(groupId, currentUser.id);

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
      error instanceof Error ? error.message : "Unable to delete group.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}
