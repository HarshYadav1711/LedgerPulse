import express from "express";
import swaggerUi from "swagger-ui-express";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import { authRouter } from "./modules/auth";
import { dashboardRouter } from "./modules/dashboard";
import { recordsRouter } from "./modules/records";
import { usersRouter } from "./modules/users";
import { createSwaggerSpec } from "./swagger";
import { sendSuccess } from "./utils/http";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());

  /** Browsers opening the site root land here; API lives under `/api`. */
  app.get("/", (_req, res) => {
    res.redirect(302, "/api/docs");
  });

  const openApiSpec = createSwaggerSpec();
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: "LedgerPulse API" }));
  app.get("/api/openapi.json", (_req, res) => {
    res.status(200).json(openApiSpec);
  });

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
