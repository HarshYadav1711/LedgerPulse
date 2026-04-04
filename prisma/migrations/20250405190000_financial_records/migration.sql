-- CreateTable
CREATE TABLE "financial_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "amount" REAL NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "isDeleted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "financial_records_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "financial_records_createdById_date_idx" ON "financial_records"("createdById", "date");

-- CreateIndex
CREATE INDEX "financial_records_isDeleted_date_idx" ON "financial_records"("isDeleted", "date");

-- CreateIndex
CREATE INDEX "financial_records_isDeleted_category_idx" ON "financial_records"("isDeleted", "category");

-- CreateIndex
CREATE INDEX "financial_records_isDeleted_type_idx" ON "financial_records"("isDeleted", "type");
