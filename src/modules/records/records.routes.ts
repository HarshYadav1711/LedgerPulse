import { Router } from "express";
import { Permission } from "../../authz/policy";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/authorize";
import * as recordsController from "./records.controller";

const recordsRouter = Router();

recordsRouter.get(
  "/",
  authenticate,
  requirePermission(Permission.RECORDS_READ),
  recordsController.list
);

recordsRouter.post(
  "/",
  authenticate,
  requirePermission(Permission.RECORDS_WRITE),
  recordsController.create
);

export default recordsRouter;
