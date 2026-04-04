"use strict";

/**
 * Windows often fails prisma generate with EPERM when renaming the query engine DLL
 * (Defender, indexer, or another Node process holds a lock). Retries after removing
 * node_modules/.prisma/client so the next run does a clean extract.
 */

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const prismaClientDir = path.join(root, "node_modules", ".prisma", "client");
const generatedClientDir = path.join(root, "src", "generated", "prisma-client");

function delayMs(ms) {
  try {
    if (process.platform === "win32") {
      spawnSync(
        "powershell.exe",
        ["-NoProfile", "-NonInteractive", "-Command", `Start-Sleep -Milliseconds ${ms}`],
        { stdio: "ignore" }
      );
    } else {
      spawnSync("sleep", [String(Math.ceil(ms / 1000))], { stdio: "ignore" });
    }
  } catch {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      /* last-resort busy wait */
    }
  }
}

function rmDir(dir) {
  try {
    if (process.platform === "win32") {
      spawnSync("cmd.exe", ["/c", `rd /s /q "${dir}"`], { stdio: "ignore", shell: false });
    }
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

function rmClientDirs() {
  rmDir(prismaClientDir);
  rmDir(generatedClientDir);
}

function runGenerate() {
  const r = spawnSync("npx prisma generate", {
    cwd: root,
    shell: true,
    stdio: "inherit",
    env: process.env,
  });
  if (r.error) {
    throw r.error;
  }
  if (r.status !== 0) {
    throw new Error(`prisma generate exited with code ${r.status}`);
  }
}

const attempts = 5;
let lastErr;
for (let i = 0; i < attempts; i++) {
  try {
    runGenerate();
    process.exit(0);
  } catch (err) {
    lastErr = err;
    const last = i === attempts - 1;
    console.warn(
      `\n[postinstall] prisma generate failed (attempt ${i + 1}/${attempts})` +
        (last ? ".\n" : "; removing Prisma client output dirs and retrying...\n")
    );
    if (last) {
      break;
    }
    rmClientDirs();
    delayMs(600 * (i + 1));
  }
}

console.error(lastErr);
process.exit(1);
