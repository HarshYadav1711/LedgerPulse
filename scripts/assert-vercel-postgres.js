"use strict";

/**
 * Fail fast on Vercel when the project is still configured for local SQLite.
 * Serverless has no durable writable disk for `file:` databases.
 */
if (process.env.VERCEL === "1") {
  const raw = (process.env.DB_PROVIDER || "sqlite").trim().toLowerCase();
  const p = raw === "postgres" ? "postgresql" : raw;
  if (p !== "postgresql") {
    console.error(
      "[LedgerPulse] Vercel build: set DB_PROVIDER=postgresql in Project → Environment Variables " +
        "(enable for Production, Preview, and **Build**). SQLite is not supported on serverless."
    );
    process.exit(1);
  }
  const url = (process.env.DATABASE_URL || "").trim();
  if (!url || url.startsWith("file:")) {
    console.error(
      "[LedgerPulse] Vercel build: set DATABASE_URL to a hosted Postgres URL (postgresql://…), " +
        "e.g. Neon, Supabase, or Vercel Postgres — not file:./…"
    );
    process.exit(1);
  }
}
