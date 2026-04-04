import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/http";
import type { ListUsersQuery } from "./users.schemas";
import * as usersService from "./users.service";

export const me = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const user = await usersService.getMe(userId);
  sendSuccess(res, 200, user);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const actor = req.user!;
  const query = req.query as unknown as ListUsersQuery;
  const page = await usersService.listUsers(actor, query);
  sendSuccess(res, 200, page);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const actor = req.user!;
  const { id } = req.params;
  const user = await usersService.getUserById(actor, id);
  sendSuccess(res, 200, user);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const actor = req.user!;
  const { id } = req.params;
  const user = await usersService.updateUser(actor, id, req.body);
  sendSuccess(res, 200, user);
});
