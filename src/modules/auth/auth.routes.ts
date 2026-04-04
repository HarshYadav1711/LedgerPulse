import { Router } from "express";
import { validate } from "../../middleware/validate";
import * as authController from "./auth.controller";
import { loginBodySchema, registerBodySchema } from "./auth.schemas";

const authRouter = Router();

authRouter.post("/register", validate({ body: registerBodySchema }), authController.register);

authRouter.post("/login", validate({ body: loginBodySchema }), authController.login);

export default authRouter;
