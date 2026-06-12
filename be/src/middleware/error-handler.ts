import type { NextFunction, Request, Response } from "express";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const message =
    error instanceof Error ? error.message : "Internal server error";

  console.error(error);

  res.status(500).json({
    ok: false,
    message,
  });
}
