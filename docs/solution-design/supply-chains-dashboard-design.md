# Supply Chains, Events & Dashboard — Solution Design

> Status: **implemented** — PostgreSQL-backed supply chain CRUD, lifecycle events, risk/report composites, and dashboard summary at `/api/v1/*`; frontend BFF proxies when `NEXT_PUBLIC_USE_MOCK_API=false`.

## Introduction

Completes supply chain management for the Traceability Platform POC: full CRUD with allocation sync, lifecycle events, deforestation risk summary, traceability report export payload, dashboard KPIs/charts, and actor involvement wired to real events.

## Backend modules

| Module                | Routes                                                                   |
| --------------------- | ------------------------------------------------------------------------ |
| `supply-chains`       | CRUD, `PUT /:id/allocations`, `GET /:id/risk-summary`, `GET /:id/report` |
| `supply-chain-events` | Nested `GET/POST /supply-chains/:id/events`, `PATCH .../:eventId`        |
| `dashboard`           | `GET /dashboard`                                                         |

## Data model additions

- **SupplyChainEvent** — `type` (7 lifecycle enums), `supplyChainId`, `actorId`, `occurredAt`, `notes`
- Unique `(supplyChainId, type)` — no duplicate lifecycle steps per chain

## Business rules

- Supply chain code uniqueness; delete blocked when allocations exist
- Allocation sync replaces all chain allocations; quantity capped across chains
- Events: forward-only sequence; API still accepts skips, but the UI records the **immediate next** lifecycle type automatically (no type picker)
- Event `type` / `occurredAt` immutable after create; `notes` / `actorId` editable
- Actor and commodity selectors display **names** (IDs remain in payloads only)

## Frontend UX (current)

- **Create / edit wizard** — commodity select shows the commodity name; allocation step shows live available / good / exceeded feedback against batch max
- **Allocate more** — detail-page action opens an allocation-focused wizard that preserves existing allocations and syncs via `PUT /:id/allocations`
- **Chain of custody graph** — fixed node width with wrapped text; column/row spacing uses node size + explicit gaps so boxes do not overlap
- **Deforestation risk** — chain detail can **run/rerun all linked farms** by calling existing `POST /farms/:id/assessments` per farm, then refreshing `GET /:id/risk-summary`. Farms without boundaries fail individually and remain linked for retry

## Seed order

commodities → actors → supply chains → farms → batches → allocations → **supply chain events**

## Frontend BFF

All routes proxy when `NEXT_PUBLIC_USE_MOCK_API=false`:

- `/api/supply-chains/*`
- `/api/supply-chains/[id]/events/*`
- `/api/supply-chains/[id]/risk-summary`, `/report`
- `/api/dashboard/summary` → `/api/v1/dashboard`
- `/api/farms/[id]/assessments` (used by chain-level run/rerun orchestration)

## Out of scope

- Dedicated chain-level assessment backend endpoint (frontend fans out to per-farm POST)
- Role-based access beyond authenticated admin session
