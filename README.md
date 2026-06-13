# Supply Chain Backend

Express + TypeScript API for the Traceability Platform frontend (`../supplychain`).

## Quick start

```bash
cd supplychain-backend
cp .env.example .env
yarn install
yarn prisma:generate
yarn dev
```

- API: `http://localhost:5009`
- Swagger: `http://localhost:5009/api-docs`
- Health: `http://localhost:5009/health`

## Docker

```bash
cp .env.example .env
yarn docker:up
yarn docker:build   # build API image
```

Services: API (`5009`), PostgreSQL (`5432`).

## Scripts

| Script | Description |
| --- | --- |
| `yarn dev` | Nodemon + tsx local server |
| `yarn build` | Compile TypeScript to `dist/` |
| `yarn start` | Run compiled server |
| `yarn lint` / `yarn lint:fix` | ESLint (no `any`, unused imports) |
| `yarn format` / `yarn format:check` | Prettier |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn test:run` | Vitest unit tests |
| `yarn test:integration` | Supertest integration tests |
| `yarn prisma:migrate` | Run Prisma migrations |
| `yarn seed` | Seed default superadmin |
| `yarn setup` | Migrate + seed (Docker/production) |
| `yarn docker:up` | Start PostgreSQL + API |

## Architecture

- **Modular features** under `src/modules/<feature>/` (controller, service, routes, validation, index).
- **Shared layer** under `src/shared/` (constants, middleware, database, DI, utils).
- **PostgreSQL (Prisma)** for all persisted data (auth, commodities, refresh tokens).
- **tsyringe** dependency injection; **Zod** validation at routes; **Pino** logging.
- Controllers orchestrate services only; business logic lives in services.

## Documentation

See [`docs/GET_STARTED.md`](./docs/GET_STARTED.md) for setup details and [`docs/solution-design/`](./docs/solution-design/) for feature design docs.

## Git hooks

- **pre-commit**: lint-staged (ESLint + Prettier on staged files)
- **pre-push**: typecheck, lint, format check, unit + integration tests, build

## Frontend integration

The Next.js frontend lives in the sibling `../supplychain/` folder. When implementing endpoints, follow the workflow in `.cursor/rules/backend-feature-workflow.mdc`.
