import type { Request, Response } from "express";
import { env } from "../../config/env.js";
import { sendPasswordResetEmail } from "./auth.email.js";
import { signAuthToken } from "./auth.token.js";
import type { UserRole } from "./auth.types.js";
import {
  loginOrRegisterWithGoogle,
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
    role,
  } = req.body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    bio?: string;
    avatarUrl?: string;
    defaultCurrency?: string;
    role?: string;
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
      role: role as UserRole | undefined,
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

interface GoogleTokenInfo {
  aud?: string;
  azp?: string;
  scope?: string;
  expires_in?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  picture?: string;
}

async function fetchVerifiedGoogleProfile(accessToken: string): Promise<GoogleUserInfo> {
  const tokenInfoResponse = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
  );

  if (!tokenInfoResponse.ok) {
    throw new Error("Google session is invalid or has expired.");
  }

  const tokenInfo = (await tokenInfoResponse.json()) as GoogleTokenInfo;

  if (env.googleClientId) {
    const audience = tokenInfo.aud || tokenInfo.azp;

    if (audience !== env.googleClientId) {
      throw new Error("Google session was issued for a different application.");
    }
  }

  const userInfoResponse = await fetch(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!userInfoResponse.ok) {
    throw new Error("Unable to fetch Google account profile.");
  }

  return (await userInfoResponse.json()) as GoogleUserInfo;
}

export async function googleAuthHandler(req: Request, res: Response) {
  const { accessToken } = req.body as {
    accessToken?: string;
  };

  if (!accessToken?.trim()) {
    return res.status(400).json({
      ok: false,
      message: "Google access token is required.",
    });
  }

  if (!env.googleClientId) {
    return res.status(503).json({
      ok: false,
      message: "Google sign-in is not configured on the server.",
    });
  }

  try {
    const googleProfile = await fetchVerifiedGoogleProfile(accessToken);

    if (!googleProfile.email || googleProfile.email_verified === false) {
      return res.status(401).json({
        ok: false,
        message: "Google account does not have a verified email address.",
      });
    }

    const [firstName, ...lastNameParts] = (
      googleProfile.name ||
      `${googleProfile.given_name ?? ""} ${googleProfile.family_name ?? ""}`
    )
      .trim()
      .split(" ");

    const user = await loginOrRegisterWithGoogle({
      email: googleProfile.email,
      firstName: googleProfile.given_name || firstName || "Google",
      lastName: googleProfile.family_name || lastNameParts.join(" ") || "User",
      avatarUrl: googleProfile.picture,
    });
    const token = signAuthToken(user);

    return res.status(200).json({
      ok: true,
      message: "Signed in with Google successfully.",
      token,
      user,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to sign in with Google.";

    const statusCode =
      message === "Google session is invalid or has expired." ||
      message === "Google session was issued for a different application."
        ? 401
        : 503;

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
