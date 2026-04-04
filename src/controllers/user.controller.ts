import type { Request, Response } from "express";
import { getUserById } from "../services/user.service";
import { sendSuccess } from "../utils/http";
import { asyncHandler } from "../utils/asyncHandler";

export const me = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const user = await getUserById(userId);
  sendSuccess(res, 200, user);
});
