"use strict";

const { spawnSync } = require("node:child_process");
const path = require("node:path");
const { syncDatasourceProvider, resolveProvider } = require("./sync-datasource-provider");

syncDatasourceProvider();

const root = path.join(__dirname, "..");
const provider = resolveProvider();

if (provider === "sqlite") {
  let r = spawnSync("npx", ["prisma", "db", "push", "--force-reset", "--accept-data-loss"], {
    cwd: root,
    shell: true,
    stdio: "inherit",
    env: process.env,
  });
  if (r.status !== 0) process.exit(r.status === null ? 1 : r.status);
  r = spawnSync("npx", ["tsx", "prisma/seed.ts"], {
    cwd: root,
    shell: true,
    stdio: "inherit",
    env: process.env,
  });
  process.exit(r.status === null ? 1 : r.status);
}

const r = spawnSync("npx", ["prisma", "migrate", "reset", "--force"], {
  cwd: root,
  shell: true,
  stdio: "inherit",
  env: process.env,
});
process.exit(r.status === null ? 1 : r.status);
