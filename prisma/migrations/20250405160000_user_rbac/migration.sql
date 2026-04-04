-- Remove legacy / scaffold tables so this migration is idempotent on dirty dev DBs
DROP TABLE IF EXISTS "LedgerEntry";
DROP TABLE IF EXISTS "SchemaPlaceholder";
DROP TABLE IF EXISTS "User";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "isActive" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
