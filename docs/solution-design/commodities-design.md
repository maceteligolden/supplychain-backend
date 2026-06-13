# Commodities — Solution Design

> Status: **implemented** — MongoDB-backed CRUD at `/api/v1/commodities`; frontend BFF proxies when `NEXT_PUBLIC_USE_MOCK_API=false`.

## Introduction

Commodity management (FR-2) for the Traceability Platform POC. Commodities are master data used by farms, batches, and supply chains. The frontend already implements full CRUD against mock data; this backend module replaces the mock store with MongoDB.

## Requirements

- Super Admin only (auth required on all routes)
- Full CRUD: list, get by id, create, update, delete
- Unique uppercase `code` per commodity
- Unit enum: `KG`, `TON`, `LITRE`, `BAG`, `UNIT`
- Image URL stub (no file storage in POC)
- Seed Cocoa and Gum Arabic on first startup when collection is empty
- Response shapes match existing frontend contracts

## Use cases

| ID    | Actor       | Use case                        |
| ----- | ----------- | ------------------------------- |
| UC-C1 | Super Admin | List all commodities            |
| UC-C2 | Super Admin | View commodity details          |
| UC-C3 | Super Admin | Create a new commodity          |
| UC-C4 | Super Admin | Update commodity name/code/unit |
| UC-C5 | Super Admin | Delete an unused commodity      |

## Data model — MongoDB `Commodity`

| Field       | Type     | Description                         |
| ----------- | -------- | ----------------------------------- |
| `_id`       | ObjectId | Primary key (mapped to `id` in API) |
| `name`      | string   | Display name (2–100 chars)          |
| `code`      | string   | Unique uppercase code               |
| `imageUrl`  | string   | Stub path under `/commodities/`     |
| `unit`      | enum     | Measurement unit                    |
| `createdAt` | Date     | Auto timestamp                      |
| `updatedAt` | Date     | Auto timestamp                      |

**Indexes:** unique on `code`; index on `name`.

## Endpoints

| Method   | Path                      | Access      | Body / params                          | Response `data`            |
| -------- | ------------------------- | ----------- | -------------------------------------- | -------------------------- |
| `GET`    | `/api/v1/commodities`     | Super Admin | —                                      | `{ commodities[], total }` |
| `POST`   | `/api/v1/commodities`     | Super Admin | `{ name, code, unit, imageFileName? }` | `Commodity` (201)          |
| `GET`    | `/api/v1/commodities/:id` | Super Admin | `id` param                             | `Commodity`                |
| `PATCH`  | `/api/v1/commodities/:id` | Super Admin | partial body (min 1 field)             | `Commodity`                |
| `DELETE` | `/api/v1/commodities/:id` | Super Admin | `id` param                             | `{ success: true, id }`    |

### Commodity DTO

```json
{
  "id": "674a...",
  "name": "Cocoa",
  "code": "COCOA",
  "imageUrl": "/commodities/cocoa.png",
  "unit": "KG",
  "createdAt": "2025-01-10T08:00:00.000Z",
  "updatedAt": "2025-01-10T08:00:00.000Z"
}
```

## Business rules

- `code` is normalized to uppercase on write
- Duplicate `code` returns 400 with `{ issues: [{ path: "code", message: "Code must be unique" }] }`
- Missing commodity returns 404
- Delete does not check downstream references in POC (farms/batches still mock)

## Architecture

```
CommodityController → CommodityService → CommodityRepository → Mongoose (MongoDB)
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

- MongoDB required in Docker (`mongo` service on port 27017)
- List returns all items (client-side pagination on frontend)
- Real image upload deferred; `imageFileName` only affects stub URL
