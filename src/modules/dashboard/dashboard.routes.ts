import { Router } from "express";
import { Permission } from "../../authz/policy";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/authorize";
import * as dashboardController from "./dashboard.controller";

const dashboardRouter = Router();

dashboardRouter.get(
  "/",
  authenticate,
  requirePermission(Permission.DASHBOARD_READ),
  dashboardController.summary
);

export default dashboardRouter;
