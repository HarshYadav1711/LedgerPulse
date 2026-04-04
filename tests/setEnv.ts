process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret-must-be-16+";
process.env.DATABASE_URL = "file:./prisma/test.db";
