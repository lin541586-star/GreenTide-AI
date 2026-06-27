-- CreateTable
CREATE TABLE "AiRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "AiRule_tenantId_idx" ON "AiRule"("tenantId");

-- CreateIndex
CREATE INDEX "AiRule_tenantId_enabled_idx" ON "AiRule"("tenantId", "enabled");
