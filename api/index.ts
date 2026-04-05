import { createApp } from "../src/app";

/**
 * Vercel serverless entry: all traffic is rewritten here (see `vercel.json`).
 * Do not use `src/server.ts` on Vercel — there is no long-lived HTTP server.
 */
const app = createApp();
export default app;
