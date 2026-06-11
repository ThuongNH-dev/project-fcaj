import type { Request, Response } from "express";
import { loginUser, registerUser } from "./auth.service.js";

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

    return res.status(200).json({
      ok: true,
      message: "Login successful.",
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
