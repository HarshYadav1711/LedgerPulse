"use strict";

/**
 * Applies schema to the database in a provider-aware way:
 * - PostgreSQL: `prisma migrate deploy` (uses SQL in prisma/migrations/, written for Postgres).
 * - SQLite: `prisma db push` (migrations are not SQLite-compatible; push syncs from schema.prisma).
 *
 * Run via `node scripts/run-prisma.js` by passing through, or call this script directly.
 */

const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { syncDatasourceProvider, resolveProvider } = require("./sync-datasource-provider");

syncDatasourceProvider();

const root = path.join(__dirname, "..");
const provider = resolveProvider();
const acceptLoss = process.env.PRISMA_DB_PUSH_ACCEPT_LOSS === "1";

const args =
  provider === "sqlite"
    ? acceptLoss
      ? ["db", "push", "--accept-data-loss"]
      : ["db", "push"]
    : ["migrate", "deploy"];

const r = spawnSync("npx", ["prisma", ...args], {
  cwd: root,
  shell: true,
  stdio: "inherit",
  env: process.env,
});

process.exit(r.status === null ? 1 : r.status);
