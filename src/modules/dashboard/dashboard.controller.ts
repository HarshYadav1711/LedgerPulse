import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/http";

/** Placeholder analytics payload; RBAC gates analyst/admin access. */
export const summary = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, 200, { aggregates: {} });
});
