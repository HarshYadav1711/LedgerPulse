import { createApp } from "./app";
import { loadEnv } from "./config/env";

const env = loadEnv();
const app = createApp();

const server = app.listen(env.PORT, () => {
  console.info(`LedgerPulse listening on http://localhost:${env.PORT}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
