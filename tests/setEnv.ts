import { execSync } from "child_process";
import path from "path";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-16chars-min";
/** Force SQLite for tests even if developer `.env` targets PostgreSQL. */
process.env.DB_PROVIDER = "sqlite";

const testDbPath = path.resolve(__dirname, "../prisma/test.db").replace(/\\/g, "/");
process.env.DATABASE_URL = `file:${testDbPath}`;

/** Faster integration tests; production uses default 12 in auth.service when unset. */
process.env.BCRYPT_ROUNDS = "4";

/**
 * `npm install` postinstall may have run `prisma generate` with PostgreSQL from `.env`.
 * Regenerate the client for SQLite before any test file imports `src/db/prisma`.
 */
const root = path.resolve(__dirname, "..");
execSync("node scripts/sync-datasource-provider.js && npx prisma generate", {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});
