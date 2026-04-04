import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { loadEnv } from "../config/env";
import { AppError } from "../errors/AppError";
import type { JwtPayload } from "../types/jwt";

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    next(new AppError(401, "Missing or invalid Authorization header", "UNAUTHORIZED"));
    return;
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    next(new AppError(401, "Missing bearer token", "UNAUTHORIZED"));
    return;
  }
  try {
    const { JWT_SECRET } = loadEnv();
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded.sub) {
      next(new AppError(401, "Invalid token payload", "UNAUTHORIZED"));
      return;
    }
    req.userId = decoded.sub;
    next();
  } catch {
    next(new AppError(401, "Invalid or expired token", "UNAUTHORIZED"));
  }
}
