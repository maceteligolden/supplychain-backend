-- CreateEnum
CREATE TYPE "FarmStatus" AS ENUM ('DRAFT', 'MAPPED', 'READY_FOR_ASSESSMENT', 'UNDER_REVIEW', 'ASSESSED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SupplyChainStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('CREATED', 'PARTIALLY_ALLOCATED', 'FULLY_ALLOCATED');

-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "status" "FarmStatus" NOT NULL DEFAULT 'DRAFT',
    "ownerFirstName" TEXT NOT NULL DEFAULT '',
    "ownerLastName" TEXT NOT NULL DEFAULT '',
    "ownerPhone" TEXT NOT NULL DEFAULT '',
    "ownerEmail" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "region" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "annualProductionEstimateKg" DOUBLE PRECISION,
    "areaHectares" DOUBLE PRECISION,
    "declarationAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmCommodity" (
    "farmId" TEXT NOT NULL,
    "commodityId" TEXT NOT NULL,

    CONSTRAINT "FarmCommodity_pkey" PRIMARY KEY ("farmId","commodityId")
);

-- CreateTable
CREATE TABLE "SupplyChain" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" "SupplyChainStatus" NOT NULL DEFAULT 'ACTIVE',
    "commodityId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplyChain_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "commodityId" TEXT NOT NULL,
    "harvestDate" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" "CommodityUnit" NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'CREATED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchAllocation" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "supplyChainId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "allocatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BatchAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Farm_code_key" ON "Farm"("code");

-- CreateIndex
CREATE INDEX "Farm_name_idx" ON "Farm"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SupplyChain_code_key" ON "SupplyChain"("code");

-- CreateIndex
CREATE INDEX "SupplyChain_status_idx" ON "SupplyChain"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_batchNumber_key" ON "Batch"("batchNumber");

-- CreateIndex
CREATE INDEX "Batch_farmId_idx" ON "Batch"("farmId");

-- CreateIndex
CREATE INDEX "BatchAllocation_batchId_idx" ON "BatchAllocation"("batchId");

-- CreateIndex
CREATE INDEX "BatchAllocation_supplyChainId_idx" ON "BatchAllocation"("supplyChainId");

-- AddForeignKey
ALTER TABLE "FarmCommodity" ADD CONSTRAINT "FarmCommodity_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmCommodity" ADD CONSTRAINT "FarmCommodity_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "Commodity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyChain" ADD CONSTRAINT "SupplyChain_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "Commodity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_commodityId_fkey" FOREIGN KEY ("commodityId") REFERENCES "Commodity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchAllocation" ADD CONSTRAINT "BatchAllocation_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchAllocation" ADD CONSTRAINT "BatchAllocation_supplyChainId_fkey" FOREIGN KEY ("supplyChainId") REFERENCES "SupplyChain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
