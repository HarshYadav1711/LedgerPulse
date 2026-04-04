import type { Response } from "express";
import { Router } from "express";
import { validate } from "../../middleware/validate";
import { sendError } from "../../utils/http";
import * as authController from "./auth.controller";
import { loginBodySchema, registerBodySchema } from "./auth.schemas";

const authRouter = Router();

function methodNotAllowedPostOnly(res: Response, postSummary: string) {
  res.setHeader("Allow", "POST");
  sendError(
    res,
    405,
    `This URL only supports POST (${postSummary}). Use Swagger at /api/docs, curl, or Postman — browser address bar sends GET.`,
    "METHOD_NOT_ALLOWED"
  );
}

/** Browsers default to GET; registration and login are POST-only. */
authRouter.get("/register", (_req, res) => {
  methodNotAllowedPostOnly(res, "JSON { email, password }");
});

authRouter.get("/login", (_req, res) => {
  methodNotAllowedPostOnly(res, "JSON { email, password }");
});

authRouter.post("/register", validate({ body: registerBodySchema }), authController.register);

authRouter.post("/login", validate({ body: loginBodySchema }), authController.login);

export default authRouter;
