import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { loadEnv } from "../config/env";
import { prisma } from "../db/prisma";
import { AppError } from "../errors/AppError";
import type { AuthUser } from "../authz/types";

type JwtPayload = { sub: string };

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
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
  let decoded: JwtPayload;
  try {
    const { JWT_SECRET } = loadEnv();
    decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    next(new AppError(401, "Invalid or expired token", "UNAUTHORIZED"));
    return;
  }
  if (!decoded.sub) {
    next(new AppError(401, "Invalid token payload", "UNAUTHORIZED"));
    return;
  }
  try {
    const row = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: { id: true, email: true, role: true, isActive: true },
    });
    if (!row) {
      next(new AppError(401, "User no longer exists", "UNAUTHORIZED"));
      return;
    }
    if (!row.isActive) {
      next(new AppError(403, "Account is deactivated", "USER_INACTIVE"));
      return;
    }
    const user: AuthUser = {
      id: row.id,
      email: row.email,
      role: row.role,
      isActive: row.isActive,
    };
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}
