import type { AuthUser } from "../authz/types";

export {};

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
