import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError";
import { sendError } from "../utils/http";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    sendError(res, 400, "Validation failed", "VALIDATION_ERROR", err.flatten());
    return;
  }
  if (err instanceof AppError) {
    sendError(res, err.statusCode, err.message, err.code, err.details);
    return;
  }
  const message = err instanceof Error ? err.message : "Internal server error";
  console.error(err);
  sendError(res, 500, message, "INTERNAL_ERROR");
}
