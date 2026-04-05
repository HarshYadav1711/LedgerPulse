import { PrismaClient } from "./client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const log: ("error" | "warn")[] =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" ? ["error", "warn"] : ["error"];

/**
 * Reuse one client across hot reload (dev) and serverless warm invocations (e.g. Vercel).
 * Tests use a fresh client per worker via NODE_ENV=test.
 */
const useGlobalCache = process.env.NODE_ENV !== "test";

export const prisma =
  (useGlobalCache ? globalForPrisma.prisma : undefined) ??
  new PrismaClient({
    log,
  });

if (useGlobalCache) {
  globalForPrisma.prisma = prisma;
}
