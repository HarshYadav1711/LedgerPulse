import { Router } from "express";
import { Permission } from "../../authz/policy";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import * as usersController from "./users.controller";
import {
  listUsersQuerySchema,
  updateUserBodySchema,
  userIdParamSchema,
} from "./users.schemas";

const usersRouter = Router();

usersRouter.get("/me", authenticate, usersController.me);

usersRouter.get(
  "/",
  authenticate,
  requirePermission(Permission.USERS_MANAGE),
  validate({ query: listUsersQuerySchema }),
  usersController.list
);

usersRouter.get(
  "/:id",
  authenticate,
  requirePermission(Permission.USERS_MANAGE),
  validate({ params: userIdParamSchema }),
  usersController.getById
);

usersRouter.patch(
  "/:id",
  authenticate,
  requirePermission(Permission.USERS_MANAGE),
  validate({ params: userIdParamSchema, body: updateUserBodySchema }),
  usersController.update
);

export default usersRouter;
