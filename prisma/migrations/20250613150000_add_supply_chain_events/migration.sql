-- CreateEnum
CREATE TYPE "SupplyChainEventType" AS ENUM ('HARVEST', 'COLLECTION', 'PROCESSING', 'WAREHOUSING', 'EXPORT', 'IN_TRANSIT', 'DELIVERED');

-- CreateTable
CREATE TABLE "SupplyChainEvent" (
    "id" TEXT NOT NULL,
    "supplyChainId" TEXT NOT NULL,
    "type" "SupplyChainEventType" NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "actorId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplyChainEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplyChainEvent_supplyChainId_idx" ON "SupplyChainEvent"("supplyChainId");

-- CreateIndex
CREATE INDEX "SupplyChainEvent_occurredAt_idx" ON "SupplyChainEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "SupplyChainEvent_actorId_idx" ON "SupplyChainEvent"("actorId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplyChainEvent_supplyChainId_type_key" ON "SupplyChainEvent"("supplyChainId", "type");

-- AddForeignKey
ALTER TABLE "SupplyChainEvent" ADD CONSTRAINT "SupplyChainEvent_supplyChainId_fkey" FOREIGN KEY ("supplyChainId") REFERENCES "SupplyChain"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplyChainEvent" ADD CONSTRAINT "SupplyChainEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "Actor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
