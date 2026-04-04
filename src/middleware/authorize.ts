import type { NextFunction, Request, Response } from "express";
import { roleHasAllPermissions, type Permission } from "../authz/policy";
import { AppError } from "../errors/AppError";

/**
 * Requires `authenticate` to run first. Enforces RBAC using centralized policy in `authz/policy.ts`.
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) {
      next(new AppError(401, "Authentication required", "UNAUTHORIZED"));
      return;
    }
    if (!roleHasAllPermissions(user.role, permissions)) {
      next(new AppError(403, "Insufficient permissions for this resource", "FORBIDDEN"));
      return;
    }
    next();
  };
}
