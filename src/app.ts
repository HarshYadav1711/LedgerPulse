import express from "express";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import { authRouter } from "./modules/auth";
import { dashboardRouter } from "./modules/dashboard";
import { recordsRouter } from "./modules/records";
import { usersRouter } from "./modules/users";
import { sendSuccess } from "./utils/http";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    sendSuccess(res, 200, { status: "ok" });
  });

  app.use("/api/auth", authRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/records", recordsRouter);
  app.use("/api/dashboard", dashboardRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
