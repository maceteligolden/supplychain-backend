# Backend — Get Started

Developer setup for the Supply Chain Traceability API.

## Prerequisites

- Node.js 22+
- Yarn (Corepack: `corepack enable`)
- Docker (optional, for MongoDB + PostgreSQL)

## 1. Install

```bash
cd supplychain-backend
cp .env.example .env
yarn install
yarn prisma:generate
```

## 2. Start databases

### Option A — Docker (recommended)

```bash
yarn docker:up
```

### Option B — Local services

Ensure MongoDB and PostgreSQL are running and match `.env`.

## 3. Run the API

```bash
yarn dev
```

Verify:

- `GET http://localhost:5009/health`
- Open `http://localhost:5009/api-docs`

## 4. Quality checks

```bash
yarn typecheck
yarn lint
yarn format:check
yarn test:run
yarn test:integration
yarn build
```

## 5. Project layout

```
supplychain-backend/
├── docs/                  # Feature design docs
├── prisma/                # PostgreSQL schema (Prisma)
├── src/
│   ├── modules/           # Feature modules (auth, farms, …)
│   ├── shared/            # Cross-cutting concerns
│   ├── __tests__/         # Unit + integration tests
│   ├── app.ts             # Express app factory
│   └── index.ts           # Server bootstrap
├── .cursor/rules/         # Cursor agent standards
├── docker-compose.yml
└── Dockerfile
```

## 6. Adding a feature

1. Read the frontend pages and existing design doc.
2. Document endpoints in `docs/solution-design/<feature>.md`.
3. Write unit tests first, get approval, then implement service logic.
4. Wire routes with Zod validation and Swagger JSDoc.
5. Run the full quality pipeline before pushing.

See `.cursor/rules/backend-feature-workflow.mdc` for the full workflow.

## 7. Environment variables

| Variable       | Description                                 |
| -------------- | ------------------------------------------- |
| `PORT`         | HTTP port (default `5009`)                  |
| `MONGODB_URI`  | MongoDB connection string                   |
| `DATABASE_URL` | PostgreSQL connection string for Prisma     |
| `CORS_ORIGIN`  | Allowed frontend origin(s), comma-separated |
| `JWT_SECRET`   | Auth signing secret                         |
| `LOG_LEVEL`    | Pino log level                              |

Only `src/shared/constants/env.ts` may read `process.env`.
