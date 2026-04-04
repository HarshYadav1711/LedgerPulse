"use strict";

/**
 * Prisma does not allow `provider = env("DB_PROVIDER")` in schema.prisma (P1012 — migrations must be deterministic).
 * This script mirrors DB_PROVIDER from the environment (or .env) into the literal `provider = "…"` line before any
 * Prisma CLI command. DATABASE_URL is still read by Prisma only via env("DATABASE_URL") in the schema.
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const schemaPath = path.join(root, "prisma", "schema.prisma");

function readDbProviderFromDotEnvFile() {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) {
    return null;
  }
  const text = fs.readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || !trimmed) continue;
    const m = /^\s*DB_PROVIDER\s*=\s*(?:"([^"]*)"|'([^']*)'|([^#\s]+))/.exec(line);
    if (m) {
      return (m[1] ?? m[2] ?? m[3] ?? "").trim();
    }
  }
  return null;
}

function resolveProvider() {
  let p = (process.env.DB_PROVIDER || readDbProviderFromDotEnvFile() || "sqlite").trim().toLowerCase();
  if (p === "postgres") p = "postgresql";
  if (p !== "sqlite" && p !== "postgresql") {
    console.error(`sync-datasource-provider: invalid DB_PROVIDER "${p}". Use sqlite or postgresql.`);
    process.exit(1);
  }
  return p;
}

function syncDatasourceProvider() {
  const provider = resolveProvider();
  const original = fs.readFileSync(schemaPath, "utf8");
  const re = /(datasource db\s*\{[\s\S]*?provider\s*=\s*")(?:sqlite|postgresql)(")/;
  if (!re.test(original)) {
    console.error("sync-datasource-provider: could not find datasource db { … provider = \"sqlite\"|\"postgresql\" in prisma/schema.prisma");
    process.exit(1);
  }
  const next = original.replace(re, `$1${provider}$2`);
  if (next !== original) {
    fs.writeFileSync(schemaPath, next, "utf8");
  }
}

module.exports = { syncDatasourceProvider };

if (require.main === module) {
  syncDatasourceProvider();
}
