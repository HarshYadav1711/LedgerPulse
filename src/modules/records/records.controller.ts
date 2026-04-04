import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/http";

/** Placeholder until record persistence exists; enforces RBAC on routes. */
export const list = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, 200, { items: [] });
});

export const create = asyncHandler(async (_req: Request, res: Response) => {
  sendSuccess(res, 201, { accepted: true });
});
