import { PrismaClient } from "./client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const log: ("error" | "warn")[] =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" ? ["error", "warn"] : ["error"];

/** Reuse one client in dev (hot reload). Test/production get a normal module singleton without `globalThis`. */
const useGlobalDevCache = process.env.NODE_ENV === "development";

export const prisma =
  (useGlobalDevCache ? globalForPrisma.prisma : undefined) ??
  new PrismaClient({
    log,
  });

if (useGlobalDevCache) {
  globalForPrisma.prisma = prisma;
}
