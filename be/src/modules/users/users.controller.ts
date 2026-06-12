import type { Request, Response } from "express";
import {
  getUserById,
  updateCurrentUserProfile,
} from "../auth/auth.service.js";

export async function getCurrentUserHandler(req: Request, res: Response) {
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
      message: "User profile fetched successfully.",
      user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch user profile.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function updateCurrentUserHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  const body = req.body as {
    firstName?: string;
    lastName?: string;
    bio?: string;
    avatar?: string;
    avatarUrl?: string;
    defaultCurrency?: string;
    email?: string;
    role?: string;
    password?: string;
  };

  if (body.email !== undefined || body.role !== undefined || body.password !== undefined) {
    return res.status(400).json({
      ok: false,
      message: "Email, role, and password cannot be updated from this route.",
    });
  }

  if (body.firstName !== undefined && !body.firstName.trim()) {
    return res.status(400).json({
      ok: false,
      message: "First name cannot be empty.",
    });
  }

  if (body.lastName !== undefined && !body.lastName.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Last name cannot be empty.",
    });
  }

  try {
    const user = await updateCurrentUserProfile(userId, {
      firstName: body.firstName,
      lastName: body.lastName,
      bio: body.bio,
      avatarUrl: body.avatarUrl ?? body.avatar,
      defaultCurrency:
        body.defaultCurrency?.trim().toUpperCase() as "USD" | "VND" | undefined,
    });

    if (!user) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "User profile updated successfully.",
      user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update user profile.";

    const statusCode =
      message === "At least one profile field is required." ||
      message === "Default currency must be either USD or VND."
        ? 400
        : 503;

    return res.status(statusCode).json({
      ok: false,
      message,
    });
  }
}
