import type { Role } from "../db/client";

/** Active user attached by `authenticate` (no password hash). */
export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
};
