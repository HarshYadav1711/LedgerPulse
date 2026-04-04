import { Router } from "express";
import { Permission } from "../../authz/policy";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import * as recordsController from "./records.controller";
import {
  createRecordBodySchema,
  listRecordsQuerySchema,
  recordIdParamSchema,
  recordsExportQuerySchema,
  updateRecordBodySchema,
} from "./records.schemas";

const recordsRouter = Router();

recordsRouter.get(
  "/",
  authenticate,
  requirePermission(Permission.RECORDS_READ),
  validate({ query: listRecordsQuerySchema }),
  recordsController.list
);

recordsRouter.get(
  "/export",
  authenticate,
  requirePermission(Permission.RECORDS_READ),
  validate({ query: recordsExportQuerySchema }),
  recordsController.exportCsv
);

recordsRouter.post(
  "/",
  authenticate,
  requirePermission(Permission.RECORDS_WRITE),
  validate({ body: createRecordBodySchema }),
  recordsController.create
);

recordsRouter.get(
  "/:id",
  authenticate,
  requirePermission(Permission.RECORDS_READ),
  validate({ params: recordIdParamSchema }),
  recordsController.getById
);

recordsRouter.patch(
  "/:id",
  authenticate,
  requirePermission(Permission.RECORDS_WRITE),
  validate({ params: recordIdParamSchema, body: updateRecordBodySchema }),
  recordsController.update
);

recordsRouter.delete(
  "/:id",
  authenticate,
  requirePermission(Permission.RECORDS_WRITE),
  validate({ params: recordIdParamSchema }),
  recordsController.remove
);

export default recordsRouter;
