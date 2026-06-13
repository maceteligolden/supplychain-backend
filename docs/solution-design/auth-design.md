# Auth — Solution Design

> Status: **implemented** — backend auth module with refresh tokens; frontend proxies via BFF when `NEXT_PUBLIC_USE_MOCK_API=false`.

## Introduction

Authentication for the Traceability Platform POC. The frontend calls same-origin `/api/auth/*` routes which proxy to `supplychain-backend` at `/api/v1/auth/*`.

## Requirements

- Super Admin role only (POC)
- Secure password storage (bcrypt)
- Short-lived access JWT + long-lived refresh token in httpOnly cookies
- Automatic refresh token rotation
- Protected routes reject unauthenticated requests
- Default superadmin seeded on setup

## Use cases

| ID    | Actor       | Use case                              |
| ----- | ----------- | ------------------------------------- |
| UC-A1 | Super Admin | Log in with email/password            |
| UC-A2 | Super Admin | View current profile                  |
| UC-A3 | Super Admin | Log out and invalidate session        |
| UC-A4 | Super Admin | Silently refresh expired access token |

## Flows

### Login

1. Client sends credentials to `POST /api/v1/auth/login`
2. `AdminAuthService` validates user (PostgreSQL via Prisma)
3. Access JWT + opaque refresh token issued; httpOnly cookies `sc_access` and `sc_refresh` set
4. User profile returned

### Session check

1. Client calls `GET /api/v1/auth/me` with cookies
2. Silent refresh attempted if access expired but refresh valid
3. Auth middleware validates access JWT
4. User profile returned or 401

### Refresh

1. Client calls `POST /api/v1/auth/refresh` with refresh cookie (automatic via BFF on 401)
2. Old refresh token revoked; new pair issued (rotation)
3. Reuse of revoked refresh token revokes all user refresh tokens

### Logout

1. Client calls `POST /api/v1/auth/logout`
2. Refresh tokens revoked in DB; cookies cleared

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

### PostgreSQL — `RefreshToken`

| Field       | Type      | Description                    |
| ----------- | --------- | ------------------------------ |
| `id`        | string    | Primary key                    |
| `userId`    | string    | FK to User                     |
| `tokenHash` | string    | SHA-256 hash of refresh token  |
| `expiresAt` | DateTime  | Expiry timestamp               |
| `revokedAt` | DateTime? | Set when rotated or logged out |

## Endpoints

| Method | Path                   | Access        | Body / query          |
| ------ | ---------------------- | ------------- | --------------------- |
| POST   | `/api/v1/auth/login`   | Public        | `{ email, password }` |
| POST   | `/api/v1/auth/refresh` | Public        | refresh cookie        |
| GET    | `/api/v1/auth/me`      | Authenticated | —                     |
| POST   | `/api/v1/auth/logout`  | Authenticated | —                     |

## Cookies

| Name         | Purpose              | Default TTL |
| ------------ | -------------------- | ----------- |
| `sc_access`  | JWT access token     | 15 minutes  |
| `sc_refresh` | Opaque refresh token | 7 days      |

## Default superadmin (seed)

Created automatically by `yarn seed`:

| Email              | Password         |
| ------------------ | ---------------- |
| `john@example.com` | `SuperAdmin123!` |

Override via `SUPER_ADMIN_*` env vars in `.env`.

## Future updates (deferred)

- Multi-role RBAC (farm owner, auditor)
- OAuth / SSO
- Rate limiting per IP on login
- Account lockout after failed attempts

## Constraints

- POC uses a single Super Admin; `AdminAuthService` is separate from future customer auth services per SOLID actor rule.
