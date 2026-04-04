import type { Request, Response } from "express";
import {
  createEntry,
  deleteEntry,
  getEntry,
  getSummary,
  listEntries,
  updateEntry,
} from "../services/entry.service";
import type { ListEntriesQuery, SummaryQuery } from "../validation/entry.schemas";
import { sendSuccess } from "../utils/http";
import { asyncHandler } from "../utils/asyncHandler";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const entry = await createEntry(userId, req.body);
  sendSuccess(res, 201, entry);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const page = await listEntries(userId, req.query as unknown as ListEntriesQuery);
  sendSuccess(res, 200, page);
});

export const getOne = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const { id } = req.params;
  const entry = await getEntry(userId, id);
  sendSuccess(res, 200, entry);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const { id } = req.params;
  const entry = await updateEntry(userId, id, req.body);
  sendSuccess(res, 200, entry);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const { id } = req.params;
  await deleteEntry(userId, id);
  sendSuccess(res, 200, { deleted: true, id });
});

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const data = await getSummary(userId, req.query as unknown as SummaryQuery);
  sendSuccess(res, 200, data);
});
