# Actors — Solution Design

> Status: **implemented** — PostgreSQL-backed CRUD at `/api/v1/actors`; frontend BFF proxies when `NEXT_PUBLIC_USE_MOCK_API=false`.

## Introduction

Actor management (FR-4) for the Traceability Platform POC. Actors are supply chain participants (collection centres, processors, exporters, etc.) referenced by supply chain events. The frontend already implements full CRUD and an involvement detail view against mock data.

## Requirements

- Super Admin only (auth required on all routes)
- Full CRUD: list, get by id, create, update, delete
- Unique immutable inventory `code` per actor (`ACT-YYYY-NNNN`), generated server-side
- Nested `address` object in API (flat columns in PostgreSQL)
- `type` enum: `COLLECTION_CENTRE`, `PROCESSOR`, `WAREHOUSE`, `EXPORTER`, `CARRIER`
- `status` enum: `ACTIVE`, `INACTIVE` — only ACTIVE actors selectable on new events (enforced when events module exists)
- Delete blocked when referenced by supply chain events
- Involvement endpoint returns actor profile + empty events until supply chain module lands
- Seed three default Ghana actors on first startup

## Data model — PostgreSQL `Actor`

| Column           | Type        | Description                     |
| ---------------- | ----------- | ------------------------------- |
| `id`             | cuid        | Primary key                     |
| `name`           | string      | Display name (2–100 chars)      |
| `code`           | string      | Unique immutable inventory code |
| `type`           | ActorType   | Role in supply chain            |
| `addressLine1`   | string?     | Optional street line            |
| `addressCity`    | string      | City                            |
| `addressRegion`  | string      | Region/state                    |
| `addressCountry` | string      | Country                         |
| `status`         | ActorStatus | ACTIVE or INACTIVE              |
| `createdAt`      | DateTime    | Auto timestamp                  |
| `updatedAt`      | DateTime    | Auto timestamp                  |

**Indexes:** unique on `code`; index on `name` and `status`.

## Endpoints

| Method   | Path                             | Access      | Response `data`         |
| -------- | -------------------------------- | ----------- | ----------------------- |
| `GET`    | `/api/v1/actors`                 | Super Admin | `{ actors[], total }`   |
| `POST`   | `/api/v1/actors`                 | Super Admin | `Actor` (201)           |
| `GET`    | `/api/v1/actors/:id`             | Super Admin | `Actor`                 |
| `PATCH`  | `/api/v1/actors/:id`             | Super Admin | `Actor`                 |
| `DELETE` | `/api/v1/actors/:id`             | Super Admin | `{ success: true, id }` |
| `GET`    | `/api/v1/actors/:id/involvement` | Super Admin | `ActorInvolvement`      |

### Actor DTO

```json
{
  "id": "clx...",
  "name": "Kumasi Collection Centre",
  "code": "ACT-2026-0001",
  "type": "COLLECTION_CENTRE",
  "address": {
    "line1": "Plot 12, Industrial Area",
    "city": "Kumasi",
    "region": "Ashanti",
    "country": "Ghana"
  },
  "status": "ACTIVE",
  "createdAt": "2025-01-10T08:00:00.000Z",
  "updatedAt": "2025-01-10T08:00:00.000Z"
}
```

## Business rules

- `code` allocated as `ACT-YYYY-NNNN` on create and immutable thereafter
- Missing actor → 404
- Delete when referenced by events → 400 `"Cannot delete actor referenced by supply chain events"`
- Involvement returns empty `events` / `supplyChains` until supply chain events are persisted

## Architecture

```
ActorController → ActorService → ActorRepository → Prisma (PostgreSQL)
```

## Frontend integration

BFF routes proxy to backend when mock is disabled:

- `/api/actors` → `/api/v1/actors`
- `/api/actors/:id` → `/api/v1/actors/:id`
- `/api/actors/:id/involvement` → `/api/v1/actors/:id/involvement`

## Assumptions

- List returns all items (client-side pagination on frontend)
- Event reference check stubbed (`isReferencedByEvents` returns false) until supply chain module exists
- Involvement populated when events module lands
