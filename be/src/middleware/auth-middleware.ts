import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../modules/auth/auth.token.js";

declare module "express-serve-static-core" {
  interface Request {
    auth?: {
      userId: string;
      email: string;
      role: "admin" | "user";
    };
  }
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  const token = authorizationHeader.slice("Bearer ".length).trim();

  if (!token) {
    return res.status(401).json({
      ok: false,
      message: "Authorization token is required.",
    });
  }

  try {
    const payload = verifyAuthToken(token);

    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({
      ok: false,
      message: "Invalid or expired authorization token.",
    });
  }
}
