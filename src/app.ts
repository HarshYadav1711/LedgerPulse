import express from "express";
import swaggerUi from "swagger-ui-express";
import { errorHandler } from "./middleware/errorHandler";
import api from "./routes";
import { createSwaggerSpec } from "./swagger";
import { sendError } from "./utils/http";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());

  const spec = createSwaggerSpec();
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(spec));
  app.get("/api/docs.json", (_req, res) => {
    res.status(200).json(spec);
  });

  app.use("/api", api);

  app.use((_req, res) => {
    sendError(res, 404, "Resource not found", "NOT_FOUND");
  });

  app.use(errorHandler);

  return app;
}
