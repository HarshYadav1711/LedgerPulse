import type { Request, Response } from "express";
import { sendError } from "../utils/http";

export function notFoundHandler(_req: Request, res: Response): void {
  sendError(res, 404, "Resource not found", "NOT_FOUND");
}
