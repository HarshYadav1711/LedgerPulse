import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/http";
import type {
  DashboardFiltersInput,
  DashboardOverviewQuery,
  DashboardRecentQuery,
  DashboardTrendsQuery,
} from "./dashboard.schemas";
import * as dashboardService from "./dashboard.service";

export const overview = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as DashboardOverviewQuery;
  const data = await dashboardService.getOverview(query);
  sendSuccess(res, 200, data);
});

export const summary = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as DashboardFiltersInput;
  const data = await dashboardService.getSummary(query);
  sendSuccess(res, 200, data);
});

export const byCategory = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as DashboardFiltersInput;
  const data = await dashboardService.getByCategory(query);
  sendSuccess(res, 200, data);
});

export const recent = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as DashboardRecentQuery;
  const data = await dashboardService.getRecent(query);
  sendSuccess(res, 200, data);
});

export const trends = asyncHandler(async (req: Request, res: Response) => {
  const query = req.query as unknown as DashboardTrendsQuery;
  const data = await dashboardService.getTrends(query);
  sendSuccess(res, 200, data);
});
