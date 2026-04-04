import path from "path";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-16chars-min";

const testDbPath = path.resolve(__dirname, "../prisma/test.db").replace(/\\/g, "/");
process.env.DATABASE_URL = `file:${testDbPath}`;

/** Faster integration tests; production uses default 12 in auth.service when unset. */
process.env.BCRYPT_ROUNDS = "4";
