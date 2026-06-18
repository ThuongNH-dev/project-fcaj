import type { Request, Response } from "express";
import { signAuthToken } from "./auth.token.js";
import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPasswordWithToken,
} from "./auth.service.js";

const PASSWORD_RESET_RESPONSE_MESSAGE =
  "If an account with this email exists, a password reset link has been sent.";

export async function registerUserHandler(req: Request, res: Response) {
  const {
    firstName,
    lastName,
    email,
    password,
    bio,
    avatarUrl,
    defaultCurrency,
    role,
  } = req.body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    bio?: string;
    avatarUrl?: string;
    defaultCurrency?: string;
    role?: "admin" | "user";
  };

  if (!firstName?.trim() || !lastName?.trim() || !email?.trim() || !password) {
    return res.status(400).json({
      ok: false,
      message: "First name, last name, email, and password are required.",
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      ok: false,
      message: "Password must be at least 6 characters.",
    });
  }

  try {
    const user = await registerUser({
      firstName,
      lastName,
      email,
      password,
      bio,
      avatarUrl,
      defaultCurrency,
      role,
    });

    return res.status(201).json({
      ok: true,
      message: "Account created successfully. You can sign in now.",
      user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to register user.";

    const statusCode =
      message === "An account with this email already exists." ? 409 : 503;

    return res.status(statusCode).json({
      ok: false,
      message,
    });
  }
}

export async function loginUserHandler(req: Request, res: Response) {
  const { email, password } = req.body as {
    email?: string;
    password?: string;
  };

  if (!email?.trim() || !password) {
    return res.status(400).json({
      ok: false,
      message: "Email and password are required.",
    });
  }

  try {
    const user = await loginUser({
      email,
      password,
    });
    const token = signAuthToken(user);

    return res.status(200).json({
      ok: true,
      message: "Login successful.",
      token,
      user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to login user.";

    const statusCode = message === "Invalid email or password." ? 401 : 503;

    return res.status(statusCode).json({
      ok: false,
      message,
    });
  }
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  const { email } = req.body as {
    email?: string;
  };

  if (!email?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Email is required.",
    });
  }

  try {
    await requestPasswordReset({
      email,
    });

    return res.status(200).json({
      ok: true,
      message: PASSWORD_RESET_RESPONSE_MESSAGE,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to request password reset.";

    return res.status(503).json({
      ok: false,
      message,
    });
  }
}

export async function resetPasswordHandler(req: Request, res: Response) {
  const { token, newPassword } = req.body as {
    token?: string;
    newPassword?: string;
  };

  if (!token?.trim() || !newPassword) {
    return res.status(400).json({
      ok: false,
      message: "Password reset token and new password are required.",
    });
  }

  try {
    await resetPasswordWithToken({
      token,
      newPassword,
    });

    return res.status(200).json({
      ok: true,
      message: "Password reset successfully. You can sign in now.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to reset password.";

    const statusCode =
      message === "Password reset token is required." ||
      message === "Password must be at least 6 characters." ||
      message === "Password reset token is invalid or has expired."
        ? 400
        : 503;

    return res.status(statusCode).json({
      ok: false,
      message,
    });
  }
}
