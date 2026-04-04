import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/http";
import { loginUser, registerUser } from "./auth.service";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await registerUser(req.body);
  sendSuccess(res, 201, result);
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await loginUser(req.body);
  sendSuccess(res, 200, result);
});
