"use strict";

/**
 * Prisma generates into src/generated/; tsc only emits src → dist, so runtime
 * require("../generated/prisma-client") from dist/db/*.js must see dist/generated/.
 */

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const src = path.join(root, "src", "generated", "prisma-client");
const dest = path.join(root, "dist", "generated", "prisma-client");

if (!fs.existsSync(src)) {
  console.error("LedgerPulse: Prisma client missing at src/generated/prisma-client");
  console.error("Run: npx prisma generate   (or npm install)");
  process.exit(1);
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.cpSync(src, dest, { recursive: true });
