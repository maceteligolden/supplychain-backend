# Auth — Solution Design

> Status: **planned** — backend scaffold only. Frontend auth currently uses Next.js mock API routes.

## Introduction

Authentication for the Traceability Platform POC. The frontend expects session-based auth via httpOnly cookies (`POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`).

## Requirements

- Super Admin role only (POC)
- Secure password storage (bcrypt)
- JWT or session token in httpOnly cookie
- Protected routes reject unauthenticated requests

## Use cases

| ID    | Actor       | Use case                       |
| ----- | ----------- | ------------------------------ |
| UC-A1 | Super Admin | Log in with email/password     |
| UC-A2 | Super Admin | View current profile           |
| UC-A3 | Super Admin | Log out and invalidate session |

## Flows

### Login

1. Client sends credentials to `POST /api/v1/auth/login`
2. AuthService validates user (PostgreSQL via Prisma)
3. Token/session issued; httpOnly cookie set
4. Profile returned

### Session check

1. Client calls `GET /api/v1/auth/me` with cookie
2. Middleware validates session
3. User profile returned or 401

## Data models

### PostgreSQL — `User` (Prisma)

| Field       | Type   | Description             |
| ----------- | ------ | ----------------------- |
| `id`        | string | Primary key             |
| `email`     | string | Unique login identifier |
| `password`  | string | Bcrypt hash             |
| `firstName` | string | Display name            |
| `lastName`  | string | Display name            |
| `role`      | enum   | `SUPER_ADMIN` in POC    |

## Endpoints (planned)

| Method | Path                  | Access        | Body / query          |
| ------ | --------------------- | ------------- | --------------------- |
| POST   | `/api/v1/auth/login`  | Public        | `{ email, password }` |
| GET    | `/api/v1/auth/me`     | Authenticated | —                     |
| POST   | `/api/v1/auth/logout` | Authenticated | —                     |

## Future updates (deferred)

- Refresh tokens and rotation
- Multi-role RBAC (farm owner, auditor)
- OAuth / SSO
- Rate limiting per IP on login
- Account lockout after failed attempts

## Constraints

- POC uses a single Super Admin; separate admin/customer auth services per SOLID actor rule when roles expand.
