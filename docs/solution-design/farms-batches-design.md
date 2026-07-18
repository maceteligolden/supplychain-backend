# Farms, Batches & Batch Allocations — Solution Design

> Status: **implemented** — PostgreSQL-backed CRUD at `/api/v1/farms`, `/api/v1/batches`, `/api/v1/batch-allocations`; frontend BFF proxies when `NEXT_PUBLIC_USE_MOCK_API=false`.

## Introduction

Farm management, harvest batches, and batch-to-supply-chain allocations for the Traceability Platform POC. Farms link to commodities; batches record harvest quantities per farm; allocations assign batch quantity to active supply chains. Farm boundary, assessment, and land-cover sub-routes remain mock-only until those modules are implemented.

## Requirements

- Super Admin only (auth required on all routes)
- **Farms:** full CRUD; immutable server-generated `code` (`FARM-YYYY-NNNN`); M2M commodities via `FarmCommodity`; nested `owner` and `location` in API
- **Batches:** list by `farmId` (required query); create returns `{ batch, assessment: null, steps }` with assessment step skipped
- **Allocations:** list by `farmId` **or** `supplyChainId` (mutually exclusive); quantity capped by batch remaining; batch status derived after writes
- **Supply chains:** minimal model + seed only (no CRUD routes yet) for allocation FK validation
- Delete farm blocked when batches exist; delete batch blocked when allocations exist

## Data model

### `Farm`

Flat owner/location columns plus `FarmCommodity` join to `Commodity`. Status enum: `DRAFT` … `REJECTED`.

### `Batch`

Denormalized `commodityId` and `unit` from commodity at creation. Unique `batchNumber`. Status: `CREATED` | `PARTIALLY_ALLOCATED` | `FULLY_ALLOCATED`.

### `BatchAllocation`

Links `batchId` → `supplyChainId` with `quantity` and `allocatedAt`.

### `SupplyChain`

Seeded records `GH_COCOA_EXPORT` and `SD_GUM_EXPORT` with optional `commodityId`.

## Endpoints

| Method   | Path                                                     | Response `data`                      |
| -------- | -------------------------------------------------------- | ------------------------------------ |
| `GET`    | `/api/v1/farms`                                          | `{ farms[], total }`                 |
| `POST`   | `/api/v1/farms`                                          | `Farm` (201)                         |
| `GET`    | `/api/v1/farms/:id`                                      | `Farm`                               |
| `PATCH`  | `/api/v1/farms/:id`                                      | `Farm`                               |
| `DELETE` | `/api/v1/farms/:id`                                      | `{ success: true, id }`              |
| `GET`    | `/api/v1/batches?farmId=`                                | `{ batches[], total }`               |
| `POST`   | `/api/v1/batches`                                        | `{ batch, assessment, steps }` (201) |
| `GET`    | `/api/v1/batches/:id`                                    | `Batch`                              |
| `PATCH`  | `/api/v1/batches/:id`                                    | `Batch`                              |
| `DELETE` | `/api/v1/batches/:id`                                    | `{ success: true, id }`              |
| `GET`    | `/api/v1/batch-allocations?farmId=` or `?supplyChainId=` | `{ allocations[], total }`           |
| `POST`   | `/api/v1/batch-allocations`                              | `Allocation` (201)                   |
| `PATCH`  | `/api/v1/batch-allocations/:id`                          | `Allocation`                         |
| `DELETE` | `/api/v1/batch-allocations/:id`                          | `{ success: true, id }`              |

## Business rules

- Batch number pattern: `BAT-YYYY-NNNN` (server-generated, immutable)
- Batch quantity on update must be ≥ total allocated
- Allocation quantity must not exceed batch remaining (batch qty − other allocations)
- Supply chain must exist and be `ACTIVE`
- Batch status recalculated via `deriveBatchStatus(quantity, allocatedTotal)` after allocation create/update/delete

## Seed order

1. Commodities → 2. Actors → 3. Supply chains → 4. Farms → 5. Batches → 6. Batch allocations

## Architecture

```
FarmController → FarmService → FarmRepository → Prisma (Farm + FarmCommodity)
BatchController → BatchService → BatchRepository + FarmRepository + CommodityRepository
BatchAllocationController → BatchAllocationService → BatchAllocationRepository + BatchRepository + SupplyChainRepository
```

## Out of scope (mock-only frontend routes)

- `/api/farms/:id/boundary`
- `/api/farms/:id/assessments`
- `/api/farms/:id/land-cover-timeline`

## Frontend proxy

When `NEXT_PUBLIC_USE_MOCK_API=false`, BFF routes under `supplychain/src/app/api/farms`, `batches`, and `batch-allocations` forward to the backend with cookie auth.
