import type { Role } from "../db/client";

/**
 * Fine-grained permissions. Route handlers declare what they need;
 * `requirePermission` maps roles → permissions in one place.
 */
export const Permission = {
  RECORDS_READ: "records:read",
  RECORDS_WRITE: "records:write",
  DASHBOARD_READ: "dashboard:read",
  USERS_MANAGE: "users:manage",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

const ROLE_PERMISSIONS: Record<Role, ReadonlySet<Permission>> = {
  viewer: new Set([Permission.RECORDS_READ]),
  analyst: new Set([Permission.RECORDS_READ, Permission.DASHBOARD_READ]),
  admin: new Set([
    Permission.RECORDS_READ,
    Permission.RECORDS_WRITE,
    Permission.DASHBOARD_READ,
    Permission.USERS_MANAGE,
  ]),
};

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

/** Caller must have every listed permission. */
export function roleHasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => roleHasPermission(role, p));
}
