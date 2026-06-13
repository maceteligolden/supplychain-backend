-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('COLLECTION_CENTRE', 'PROCESSOR', 'WAREHOUSE', 'EXPORTER', 'CARRIER');

-- CreateEnum
CREATE TYPE "ActorStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "Actor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "ActorType" NOT NULL,
    "addressLine1" TEXT,
    "addressCity" TEXT NOT NULL,
    "addressRegion" TEXT NOT NULL,
    "addressCountry" TEXT NOT NULL,
    "status" "ActorStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Actor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Actor_code_key" ON "Actor"("code");

-- CreateIndex
CREATE INDEX "Actor_name_idx" ON "Actor"("name");

-- CreateIndex
CREATE INDEX "Actor_status_idx" ON "Actor"("status");
