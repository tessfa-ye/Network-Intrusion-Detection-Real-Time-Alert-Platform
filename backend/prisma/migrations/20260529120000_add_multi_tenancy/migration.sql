-- ============================================================
-- NIDAS Multi-Tenancy Migration
-- Handles existing data by creating a default tenant first,
-- then backfilling tenantId on all existing records.
-- ============================================================

-- 1. Create UserRole enum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'ANALYST', 'VIEWER');

-- 2. Create Tenant table
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "plan" TEXT NOT NULL DEFAULT 'free',
    "logo" TEXT,
    "primaryColor" TEXT DEFAULT '#6366f1',
    "secondaryColor" TEXT DEFAULT '#818cf8',
    "notificationConfig" JSONB NOT NULL DEFAULT '{"channels":{"email":{"enabled":true,"recipients":[]},"slack":{"enabled":false,"webhookUrl":""},"webhook":{"enabled":false,"url":"","secret":""},"push":{"enabled":true,"minSeverity":"high"}}}',
    "encryptionKeyId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Tenant_slug_key" ON "Tenant"("slug");
CREATE UNIQUE INDEX "Tenant_apiKey_key" ON "Tenant"("apiKey");
CREATE INDEX "Tenant_slug_idx" ON "Tenant"("slug");
CREATE INDEX "Tenant_apiKey_idx" ON "Tenant"("apiKey");

-- 3. Insert default tenant for existing data
INSERT INTO "Tenant" ("id", "name", "slug", "updatedAt")
VALUES ('00000000-0000-0000-0000-000000000001', 'NIDAS Default Organization', 'nidas-default', CURRENT_TIMESTAMP);

-- 4. Create AuditLog table
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "details" JSONB NOT NULL DEFAULT '{}',
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- 5. Add tenantId (nullable first) to all existing tables, backfill, then make NOT NULL

-- === User ===
ALTER TABLE "User" ADD COLUMN "tenantId" TEXT;
UPDATE "User" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
ALTER TABLE "User" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "User_tenantId_idx" ON "User"("tenantId");

-- Convert role from String to UserRole enum
-- Map existing string roles to enum values
ALTER TABLE "User" ADD COLUMN "role_new" "UserRole" NOT NULL DEFAULT 'ANALYST';
UPDATE "User" SET "role_new" = CASE
    WHEN LOWER("role") = 'admin' THEN 'ADMIN'::"UserRole"
    WHEN LOWER("role") = 'super_admin' THEN 'SUPER_ADMIN'::"UserRole"
    WHEN LOWER("role") = 'analyst' THEN 'ANALYST'::"UserRole"
    WHEN LOWER("role") = 'viewer' THEN 'VIEWER'::"UserRole"
    WHEN LOWER("role") = 'security_officer' THEN 'ANALYST'::"UserRole"
    ELSE 'ANALYST'::"UserRole"
END;
ALTER TABLE "User" DROP COLUMN "role";
ALTER TABLE "User" RENAME COLUMN "role_new" TO "role";

-- === SecurityEvent ===
ALTER TABLE "SecurityEvent" ADD COLUMN "tenantId" TEXT;
UPDATE "SecurityEvent" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
ALTER TABLE "SecurityEvent" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "SecurityEvent_tenantId_idx" ON "SecurityEvent"("tenantId");

-- === Alert ===
ALTER TABLE "Alert" ADD COLUMN "tenantId" TEXT;
UPDATE "Alert" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
ALTER TABLE "Alert" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "Alert_tenantId_idx" ON "Alert"("tenantId");

-- === InvestigationNote ===
ALTER TABLE "InvestigationNote" ADD COLUMN "tenantId" TEXT;
UPDATE "InvestigationNote" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
ALTER TABLE "InvestigationNote" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "InvestigationNote_tenantId_idx" ON "InvestigationNote"("tenantId");

-- === DetectionRule ===
ALTER TABLE "DetectionRule" ADD COLUMN "tenantId" TEXT;
UPDATE "DetectionRule" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
ALTER TABLE "DetectionRule" ALTER COLUMN "tenantId" SET NOT NULL;
CREATE INDEX "DetectionRule_tenantId_idx" ON "DetectionRule"("tenantId");

-- === Blacklist ===
-- Drop old unique constraint on ip alone, replace with (tenantId, ip)
ALTER TABLE "Blacklist" ADD COLUMN "tenantId" TEXT;
UPDATE "Blacklist" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
ALTER TABLE "Blacklist" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX IF EXISTS "Blacklist_ip_key";
CREATE UNIQUE INDEX "Blacklist_tenantId_ip_key" ON "Blacklist"("tenantId", "ip");
CREATE INDEX "Blacklist_tenantId_idx" ON "Blacklist"("tenantId");

-- === Allowlist ===
-- Drop old unique constraint on ip alone, replace with (tenantId, ip)
ALTER TABLE "Allowlist" ADD COLUMN "tenantId" TEXT;
UPDATE "Allowlist" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
ALTER TABLE "Allowlist" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX IF EXISTS "Allowlist_ip_key";
CREATE UNIQUE INDEX "Allowlist_tenantId_ip_key" ON "Allowlist"("tenantId", "ip");
CREATE INDEX "Allowlist_tenantId_idx" ON "Allowlist"("tenantId");

-- === IPBaseline ===
-- Drop old unique constraint, replace with (tenantId, sourceIP, eventType)
ALTER TABLE "IPBaseline" ADD COLUMN "tenantId" TEXT;
UPDATE "IPBaseline" SET "tenantId" = '00000000-0000-0000-0000-000000000001' WHERE "tenantId" IS NULL;
ALTER TABLE "IPBaseline" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX IF EXISTS "IPBaseline_sourceIP_eventType_key";
CREATE UNIQUE INDEX "IPBaseline_tenantId_sourceIP_eventType_key" ON "IPBaseline"("tenantId", "sourceIP", "eventType");
CREATE INDEX "IPBaseline_tenantId_idx" ON "IPBaseline"("tenantId");

-- 6. Add foreign key constraints
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SecurityEvent" ADD CONSTRAINT "SecurityEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InvestigationNote" ADD CONSTRAINT "InvestigationNote_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DetectionRule" ADD CONSTRAINT "DetectionRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Blacklist" ADD CONSTRAINT "Blacklist_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Allowlist" ADD CONSTRAINT "Allowlist_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "IPBaseline" ADD CONSTRAINT "IPBaseline_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
