import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { sendPasswordResetEmail } from "./auth.email.js";
import { signAuthToken } from "./auth.token.js";
import {
  loginUser,
  registerUser,
  requestPasswordReset,
  resetPasswordWithToken,
  verifyPasswordResetOtp,
} from "./auth.service.js";

const PASSWORD_RESET_RESPONSE_MESSAGE =
  "otp đã được gửi đên email.";

function buildPasswordResetUrl(token: string) {
  const resetUrl = new URL("/reset-password", env.frontendUrl);
  resetUrl.searchParams.set("token", token);

  return resetUrl.toString();
}

export async function registerUserHandler(req: Request, res: Response) {
  const {
    firstName,
    lastName,
    email,
    password,
    bio,
    avatarUrl,
    defaultCurrency,
  } = req.body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    bio?: string;
    avatarUrl?: string;
    defaultCurrency?: string;
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
    const passwordReset = await requestPasswordReset({
      email,
    });
    const resetUrl = passwordReset.resetToken
      ? buildPasswordResetUrl(passwordReset.resetToken)
      : null;

    if (resetUrl && passwordReset.otpCode && passwordReset.expiresAt) {
      await sendPasswordResetEmail({
        email: email.trim().toLowerCase(),
        resetUrl,
        otpCode: passwordReset.otpCode,
        expiresAt: passwordReset.expiresAt,
      });
    }

    const responseBody = {
      ok: true,
      message: PASSWORD_RESET_RESPONSE_MESSAGE,
    };

    return res.status(200).json(responseBody);
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
  const { token, email, otp, newPassword } = req.body as {
    token?: string;
    email?: string;
    otp?: string;
    newPassword?: string;
  };

  if ((!token?.trim() && (!email?.trim() || !otp?.trim())) || !newPassword) {
    return res.status(400).json({
      ok: false,
      message: "Password reset token or email, OTP, and new password are required.",
    });
  }

  try {
    await resetPasswordWithToken({
      token,
      email,
      otp,
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
      message === "Password reset token or email and OTP are required." ||
      message === "Password must be at least 6 characters." ||
      message === "Password reset token or OTP is invalid or has expired."
        ? 400
        : 503;

    return res.status(statusCode).json({
      ok: false,
      message,
    });
  }
}

export async function verifyResetOtpHandler(req: Request, res: Response) {
  const { email, otp } = req.body as {
    email?: string;
    otp?: string;
  };

  if (!email?.trim() || !otp?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Email and OTP are required.",
    });
  }

  try {
    await verifyPasswordResetOtp({
      email,
      otp,
    });

    return res.status(200).json({
      ok: true,
      message: "OTP verified. You can reset your password now.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to verify OTP.";

    const statusCode =
      message === "Email and OTP are required." ||
      message === "OTP is invalid or has expired."
        ? 400
        : 503;

    return res.status(statusCode).json({
      ok: false,
      message,
    });
  }
}
