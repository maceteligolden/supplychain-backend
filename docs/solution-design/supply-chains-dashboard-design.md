# Supply Chains, Events & Dashboard — Solution Design

> Status: **implemented** — PostgreSQL-backed supply chain CRUD, lifecycle events, risk/report composites, and dashboard summary at `/api/v1/*`; frontend BFF proxies when `NEXT_PUBLIC_USE_MOCK_API=false`.

## Introduction

Completes supply chain management for the Traceability Platform POC: full CRUD with allocation sync, lifecycle events, deforestation risk summary (degraded without farm assessments), traceability report export payload, dashboard KPIs/charts, and actor involvement wired to real events.

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
- Events: forward-only sequence, skips allowed, actor must be `ACTIVE`
- Event `type` / `occurredAt` immutable after create; `notes` / `actorId` editable
- Risk/report/dashboard use empty assessment map → `UNASSESSED` / `NO_FARMS` until farm assessment module lands

## Seed order

commodities → actors → supply chains → farms → batches → allocations → **supply chain events**

## Frontend BFF

All routes proxy when `NEXT_PUBLIC_USE_MOCK_API=false`:

- `/api/supply-chains/*`
- `/api/supply-chains/[id]/events/*`
- `/api/supply-chains/[id]/risk-summary`, `/report`
- `/api/dashboard/summary` → `/api/v1/dashboard`

## Out of scope

- Farm boundary + assessment backend (needed for real MEDIUM/HIGH risk KPIs)
