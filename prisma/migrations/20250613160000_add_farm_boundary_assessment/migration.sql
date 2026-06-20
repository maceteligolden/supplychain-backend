-- CreateEnum
CREATE TYPE "AssessmentRiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "FarmAssessmentStatus" AS ENUM ('PENDING', 'RUNNING', 'COMPLETE', 'FAILED');

-- CreateEnum
CREATE TYPE "FarmAssessmentSource" AS ENUM ('GFW_WDPA', 'FALLBACK');

-- CreateEnum
CREATE TYPE "FarmLandCoverSource" AS ENUM ('BASELINE', 'ASSESSMENT');

-- CreateTable
CREATE TABLE "FarmBoundary" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "coordinates" JSONB NOT NULL,
    "areaHectares" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmBoundary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmAssessment" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "riskLevel" "AssessmentRiskLevel",
    "analysis" JSONB,
    "assessedAt" TIMESTAMP(3),
    "boundaryAreaHectares" DOUBLE PRECISION,
    "status" "FarmAssessmentStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "source" "FarmAssessmentSource" NOT NULL DEFAULT 'GFW_WDPA',
    "providerMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmLandCoverPoint" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "forestCoverPercent" DOUBLE PRECISION NOT NULL,
    "deforestationPercent" DOUBLE PRECISION NOT NULL,
    "source" "FarmLandCoverSource" NOT NULL,
    "assessmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmLandCoverPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FarmBoundary_farmId_key" ON "FarmBoundary"("farmId");

-- CreateIndex
CREATE INDEX "FarmAssessment_farmId_idx" ON "FarmAssessment"("farmId");

-- CreateIndex
CREATE INDEX "FarmAssessment_status_idx" ON "FarmAssessment"("status");

-- CreateIndex
CREATE INDEX "FarmAssessment_assessedAt_idx" ON "FarmAssessment"("assessedAt");

-- CreateIndex
CREATE INDEX "FarmLandCoverPoint_farmId_idx" ON "FarmLandCoverPoint"("farmId");

-- CreateIndex
CREATE INDEX "FarmLandCoverPoint_observedAt_idx" ON "FarmLandCoverPoint"("observedAt");

-- AddForeignKey
ALTER TABLE "FarmBoundary" ADD CONSTRAINT "FarmBoundary_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmAssessment" ADD CONSTRAINT "FarmAssessment_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmLandCoverPoint" ADD CONSTRAINT "FarmLandCoverPoint_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmLandCoverPoint" ADD CONSTRAINT "FarmLandCoverPoint_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "FarmAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
