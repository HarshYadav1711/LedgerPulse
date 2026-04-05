import express from "express";
import { createApp } from "../src/createApp";

/**
 * Vercel serverless entry: all traffic is rewritten here (see `vercel.json`).
 * A direct `express` import satisfies Vercel’s Express preset static analysis
 * (“No entrypoint found which imports express”) if the dashboard preset is Express.
 * Runtime uses `createApp()` — do not use `src/server.ts` here (no `listen()` on serverless).
 */
const app = createApp();
export default app;
