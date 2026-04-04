import { Router } from "express";
import { Permission } from "../../authz/policy";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import * as dashboardController from "./dashboard.controller";
import {
  dashboardFiltersSchema,
  dashboardOverviewQuerySchema,
  dashboardRecentQuerySchema,
  dashboardTrendsQuerySchema,
} from "./dashboard.schemas";

const dashboardRouter = Router();

const analystOrAdmin = [authenticate, requirePermission(Permission.DASHBOARD_READ)] as const;

dashboardRouter.get(
  "/",
  ...analystOrAdmin,
  validate({ query: dashboardOverviewQuerySchema }),
  dashboardController.overview
);

dashboardRouter.get(
  "/summary",
  ...analystOrAdmin,
  validate({ query: dashboardFiltersSchema }),
  dashboardController.summary
);

dashboardRouter.get(
  "/by-category",
  ...analystOrAdmin,
  validate({ query: dashboardFiltersSchema }),
  dashboardController.byCategory
);

dashboardRouter.get(
  "/recent",
  ...analystOrAdmin,
  validate({ query: dashboardRecentQuerySchema }),
  dashboardController.recent
);

dashboardRouter.get(
  "/trends",
  ...analystOrAdmin,
  validate({ query: dashboardTrendsQuerySchema }),
  dashboardController.trends
);

export default dashboardRouter;
