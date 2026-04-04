"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");

require("./sync-datasource-provider").syncDatasourceProvider();

const root = path.join(__dirname, "..");
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/run-prisma.js <prisma-args…>  e.g. migrate deploy");
  process.exit(1);
}

const r = spawnSync("npx", ["prisma", ...args], {
  cwd: root,
  shell: true,
  stdio: "inherit",
  env: process.env,
});

if (r.error) {
  console.error(r.error);
  process.exit(1);
}
process.exit(r.status === null ? 1 : r.status);
