import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "./client";

function assertDatabaseUrlMatchesSchemaProvider(): void {
  const schemaPath = path.join(__dirname, "..", "..", "prisma", "schema.prisma");
  let raw: string;
  try {
    raw = fs.readFileSync(schemaPath, "utf8");
  } catch {
    return;
  }
  const m = raw.match(/datasource\s+db\s*\{[\s\S]*?provider\s*=\s*"(sqlite|postgresql)"/);
  const provider = m?.[1];
  if (!provider) {
    return;
  }
  const url = (process.env.DATABASE_URL ?? "").trim();
  const isFile = url.startsWith("file:");
  const isPostgres = url.startsWith("postgresql:") || url.startsWith("postgres:");
  const ok =
    (provider === "sqlite" && isFile) ||
    (provider === "postgresql" && isPostgres) ||
    url === "";
  if (ok) {
    return;
  }
  const hint =
    provider === "sqlite" && isPostgres
      ? "You are using a PostgreSQL URL but the schema is still SQLite. Set DB_PROVIDER=postgresql to match DATABASE_URL, then run:\n  node scripts/sync-datasource-provider.js\n  npx prisma generate\nOr restart with: npm run dev"
      : provider === "postgresql" && isFile
        ? "You are using a file: SQLite URL but the schema is PostgreSQL. Set DB_PROVIDER=sqlite or switch DATABASE_URL to postgresql://…, then sync + generate (see above)."
        : "Align DB_PROVIDER, DATABASE_URL, and prisma/schema.prisma (run node scripts/sync-datasource-provider.js && npx prisma generate).";
  throw new Error(`[LedgerPulse] Prisma datasource mismatch.\n${hint}`);
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const log: ("error" | "warn")[] =
  process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test" ? ["error", "warn"] : ["error"];

/**
 * Reuse one client across hot reload (dev) and serverless warm invocations (e.g. Vercel).
 * Tests use a fresh client per worker via NODE_ENV=test.
 */
const useGlobalCache = process.env.NODE_ENV !== "test";

assertDatabaseUrlMatchesSchemaProvider();

export const prisma =
  (useGlobalCache ? globalForPrisma.prisma : undefined) ??
  new PrismaClient({
    log,
  });

if (useGlobalCache) {
  globalForPrisma.prisma = prisma;
}
