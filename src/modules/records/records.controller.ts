import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/http";
import type { ListRecordsQuery } from "./records.schemas";
import * as recordsService from "./records.service";

export const create = asyncHandler(async (req: Request, res: Response) => {
  const createdById = req.user!.id;
  const record = await recordsService.createRecord(createdById, req.body);
  sendSuccess(res, 201, record);
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as ListRecordsQuery;
  const page = await recordsService.listRecords(query);
  sendSuccess(res, 200, page);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const record = await recordsService.getRecordById(id);
  sendSuccess(res, 200, record);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const record = await recordsService.updateRecord(id, req.body);
  sendSuccess(res, 200, record);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const record = await recordsService.softDeleteRecord(id);
  sendSuccess(res, 200, { deleted: true, record });
});
