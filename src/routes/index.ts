import { Router } from "express";
import authRoutes from "./auth.routes";
import healthRoutes from "./health.routes";
import ledgerRoutes from "./ledger.routes";

const api = Router();

api.use(healthRoutes);
api.use("/auth", authRoutes);
api.use(ledgerRoutes);

export default api;
