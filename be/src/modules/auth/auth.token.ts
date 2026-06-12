import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import type { PublicUser, UserRole } from "./auth.types.js";

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export function signAuthToken(user: PublicUser) {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    env.jwtSecret,
    {
      expiresIn: "7d",
    },
  );
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, env.jwtSecret) as AuthTokenPayload;
}
