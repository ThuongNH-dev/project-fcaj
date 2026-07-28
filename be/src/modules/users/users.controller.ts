import type { Request, Response } from "express";
import { getAdminUserDependencySummary } from "../admin/admin.service.js";
import {
  countUsersByRole,
  changeCurrentUserPassword,
  deleteUserById,
  getCurrentUserBillingSummary,
  getUserById,
  updateCurrentUserBillingAutoRenew,
  updateCurrentUserBillingPlan,
  updateCurrentUserProfile,
} from "../auth/auth.service.js";
import type {
  UpdateCurrentUserBillingAutoRenewInput,
  UpdateCurrentUserBillingInput,
} from "../auth/auth.types.js";
import { getBillingPaymentHistory } from "../payments/payments.service.js";

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

export async function changeCurrentUserPasswordHandler(
  req: Request,
  res: Response,
) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      ok: false,
      message: "Current password and new password are required.",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      ok: false,
      message: "Password must be at least 6 characters.",
    });
  }

  try {
    const isPasswordChanged = await changeCurrentUserPassword(userId, {
      currentPassword,
      newPassword,
    });

    if (!isPasswordChanged) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update password.";

    const statusCode = message === "Current password is incorrect." ? 401 : 503;

    return res.status(statusCode).json({
      ok: false,
      message,
    });
  }
}



export async function deleteCurrentUserHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  try {
    const existingUser = await getUserById(userId);

    if (!existingUser) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    if (existingUser.role === "admin") {
      const totalAdmins = await countUsersByRole("admin");

      if (totalAdmins <= 1) {
        return res.status(400).json({
          ok: false,
          message: "At least one admin account must remain.",
        });
      }
    }

    const dependencies = await getAdminUserDependencySummary(userId);

    if (!dependencies) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    if (
      dependencies.groupCount > 0 ||
      dependencies.ownedGroupCount > 0 ||
      dependencies.expenseCount > 0 ||
      dependencies.receiptUploadCount > 0
    ) {
      return res.status(400).json({
        ok: false,
        message:
          `Cannot delete account while linked data still exists ` +
          `(groups: ${dependencies.groupCount}, owned groups: ${dependencies.ownedGroupCount}, ` +
          `expenses: ${dependencies.expenseCount}, receipts: ${dependencies.receiptUploadCount}).`,
      });
    }

    const deleted = await deleteUserById(userId);

    if (!deleted) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Account deleted successfully.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to delete account.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function getCurrentUserBillingHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  try {
    const billing = await getCurrentUserBillingSummary(userId);

    if (!billing) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Billing summary fetched successfully.",
      billing,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch billing summary.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function updateCurrentUserBillingHandler(
  req: Request,
  res: Response,
) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  const body = req.body as Partial<UpdateCurrentUserBillingInput>;

  if (!body.plan || typeof body.plan !== "string") {
    return res.status(400).json({
      ok: false,
      message: "Billing plan is required.",
    });
  }

  try {
    const billing = await updateCurrentUserBillingPlan(userId, {
      plan: body.plan,
    });

    if (!billing) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Billing plan updated successfully.",
      billing,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update billing plan.";
    const statusCode =
      message === "Billing plan must be either free or pro." ? 400 : 503;

    return res.status(statusCode).json({
      ok: false,
      message,
    });
  }
}

export async function updateCurrentUserBillingAutoRenewHandler(
  req: Request,
  res: Response,
) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  const body = req.body as Partial<UpdateCurrentUserBillingAutoRenewInput>;

  if (typeof body.autoRenew !== "boolean") {
    return res.status(400).json({
      ok: false,
      message: "Auto renew flag is required.",
    });
  }

  try {
    const billing = await updateCurrentUserBillingAutoRenew(userId, {
      autoRenew: body.autoRenew,
    });

    if (!billing) {
      return res.status(404).json({
        ok: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      ok: true,
      message: `Auto renew ${body.autoRenew ? "enabled" : "disabled"} successfully.`,
      billing,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update auto renew.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function getCurrentUserBillingHistoryHandler(req: Request, res: Response) {
  const userId = req.auth?.userId;

  if (!userId) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  try {
    const history = await getBillingPaymentHistory(userId);

    return res.status(200).json({
      ok: true,
      message: "Billing history fetched successfully.",
      history,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to fetch billing history.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}
