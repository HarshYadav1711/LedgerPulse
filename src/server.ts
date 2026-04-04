import { createApp } from "./app";
import { loadEnv } from "./config/env";
import { prisma } from "./db/prisma";

const env = loadEnv();
const app = createApp();

const server = app.listen(env.PORT, () => {
  console.info(`LedgerPulse listening on http://localhost:${env.PORT}`);
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${env.PORT} is already in use (EADDRINUSE). Stop the other process or set a different PORT in .env.\n` +
        `Windows (PowerShell): Get-NetTCPConnection -LocalPort ${env.PORT} | Select-Object OwningProcess\n` +
        `Then: Stop-Process -Id <pid> -Force`
    );
    process.exit(1);
  }
  throw err;
});

async function shutdown(signal: string) {
  console.info(`Received ${signal}, shutting down…`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
