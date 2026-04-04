import { Router } from "express";
import { sendSuccess } from "../utils/http";

const router = Router();

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Liveness check
 *     responses:
 *       200:
 *         description: OK
 */
router.get("/health", (_req, res) => {
  sendSuccess(res, 200, { status: "ok" });
});

export default router;
