import { createApp } from "./app";
import { loadEnv } from "./config/env";
import { prisma } from "./db/prisma";

const env = loadEnv();
const app = createApp();

const server = app.listen(env.PORT, () => {
  console.info(`LedgerPulse listening on http://localhost:${env.PORT}`);
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
