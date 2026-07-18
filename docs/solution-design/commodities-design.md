# Commodities — Solution Design

> Status: **implemented** — PostgreSQL/Prisma CRUD at `/api/v1/commodities`; frontend BFF proxies when `USE_MOCK_API=false`.

## Introduction

Commodity management (FR-2) for the Traceability Platform POC. Commodities are master data used by farms, batches, and supply chains. The frontend already implements full CRUD against mock data; this backend module replaces the mock store with MongoDB.

## Requirements

- Super Admin only (auth required on all routes)
- Full CRUD: list, get by id, create, update, delete
- Unique immutable inventory `code` per commodity (`COM-YYYY-NNNN`), generated server-side
- Unit enum: `KG`, `TON`, `LITRE`, `BAG`, `UNIT`
- Image URL stub (no file storage in POC)
- Seed Cocoa and Gum Arabic on first startup when collection is empty
- Response shapes match existing frontend contracts

## Use cases

| ID    | Actor       | Use case                         |
| ----- | ----------- | -------------------------------- |
| UC-C1 | Super Admin | List all commodities             |
| UC-C2 | Super Admin | View commodity details           |
| UC-C3 | Super Admin | Create a new commodity           |
| UC-C4 | Super Admin | Update commodity name/unit/image |
| UC-C5 | Super Admin | Delete an unused commodity       |

## Data model — MongoDB `Commodity`

| Field       | Type     | Description                         |
| ----------- | -------- | ----------------------------------- |
| `_id`       | ObjectId | Primary key (mapped to `id` in API) |
| `name`      | string   | Display name (2–100 chars)          |
| `code`      | string   | Unique immutable inventory code     |
| `imageUrl`  | string   | Stub path under `/commodities/`     |
| `unit`      | enum     | Measurement unit                    |
| `createdAt` | Date     | Auto timestamp                      |
| `updatedAt` | Date     | Auto timestamp                      |

**Indexes:** unique on `code`; index on `name`.

## Endpoints

| Method   | Path                      | Access      | Body / params                       | Response `data`            |
| -------- | ------------------------- | ----------- | ----------------------------------- | -------------------------- |
| `GET`    | `/api/v1/commodities`     | Super Admin | —                                   | `{ commodities[], total }` |
| `POST`   | `/api/v1/commodities`     | Super Admin | `{ name, unit }` (+ optional image) | `Commodity` (201)          |
| `GET`    | `/api/v1/commodities/:id` | Super Admin | `id` param                          | `Commodity`                |
| `PATCH`  | `/api/v1/commodities/:id` | Super Admin | partial body (min 1 field)          | `Commodity`                |
| `DELETE` | `/api/v1/commodities/:id` | Super Admin | `id` param                          | `{ success: true, id }`    |

### Commodity DTO

```json
{
  "id": "674a...",
  "name": "Cocoa",
  "code": "COM-2026-0001",
  "imageUrl": "/commodities/cocoa.png",
  "unit": "KG",
  "createdAt": "2025-01-10T08:00:00.000Z",
  "updatedAt": "2025-01-10T08:00:00.000Z"
}
```

## Business rules

- `code` is allocated by `InventoryCodeRepository` as `COM-YYYY-NNNN` and is immutable after create
- Missing commodity returns 404
- Delete should reject commodities still referenced by farms/batches (see deletion fix task)

## Architecture

```
CommodityController → CommodityService → CommodityRepository → Prisma (PostgreSQL)
```

- Validation: Zod in `commodity.validation.ts`
- Mapping: `commodity.mapper.ts`
- Seed: `commodity.seed.ts` called after DB connect in `bootstrapServer`

## Frontend integration

BFF routes proxy to backend when mock is disabled:

- `GET/POST /api/commodities` → `/api/v1/commodities`
- `GET/PATCH/DELETE /api/commodities/:id` → `/api/v1/commodities/:id`

Cookies from login are forwarded automatically by `proxyRequest`.

## Assumptions

- PostgreSQL required (Docker `postgres` or local Homebrew)
- List returns all items (client-side pagination on frontend)
- Image upload is stored under `/uploads/commodities`
