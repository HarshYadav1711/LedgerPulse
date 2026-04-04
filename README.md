# LedgerPulse

## Project overview

LedgerPulse is a **modular monolith** HTTP API for managing financial ledger entries: users authenticate with JWTs, roles control access, records support filtering and pagination, the dashboard exposes analytics, and admins can export filtered data as CSV. The codebase is organized by feature modules (auth, users, records, dashboard) inside a single deployable Node process, sharing one SQLite database via Prisma.

## Stack

| Layer | Choice |
|--------|--------|
| Runtime | Node.js 24+ |
| HTTP | Express 4 |
| Persistence | SQLite + Prisma ORM |
| Validation | Zod |
| Auth | bcrypt password hashes, JWT (`jsonwebtoken`) |
| CSV | `json2csv` |
| API docs | OpenAPI 3.0 hand-authored document + `swagger-jsdoc` merge + `swagger-ui-express` |
| Tests | Jest, `supertest`, `ts-jest`, `tsx` (seed) |

All runtime and dev dependencies are **public npm packages** (open-source or free-tier tooling). Nothing in this repo requires a paid vendor account, API subscription, or cloud sign-up to build, run, or test locally.

## Setup

1. **Prerequisites:** Node.js 24 LTS and npm.

2. **Environment:** Copy `.env.example` to `.env` in the project root and set at least `DATABASE_URL` and `JWT_SECRET` (≥ 16 characters).

3. **Install and run:**

   ```bash
   npm install
   npm start
   ```

   `npm start` runs `prisma migrate deploy`, compiles TypeScript (`tsconfig.build.json`), and starts the server with `node --env-file=.env`.

   **`EADDRINUSE` (port already in use):** Another app (often a previous LedgerPulse) is bound to `PORT` (default `3000`). Stop that process, or set e.g. `PORT=3001` in `.env`. On Windows PowerShell: `Get-NetTCPConnection -LocalPort 3000 | Select-Object OwningProcess` then `Stop-Process -Id <pid> -Force`.

   **Windows (`EPERM` on `prisma generate`):** The client is generated under `src/generated/prisma-client` (not under `node_modules/.prisma`) so Windows Defender and file indexers are less likely to lock the query engine during rename. `postinstall` still runs `scripts/prisma-generate.js`, which retries on failure and clears old output folders. If install still errors: close other terminals and any running `node` using this repo, then `npm run prisma:generate`. You can also add a Defender exclusion for the project folder.

4. **Optional demo data:**

   ```bash
   npm run db:seed
   ```

   This runs `prisma migrate deploy` (so tables exist), then clears `financial_records` and `users` and inserts demo accounts and sample ledger rows (see [Sample credentials](#sample-credentials-and-seed-instructions)).

   **Prisma `P3009` (failed migration):** Your SQLite file has a migration marked as failed (often from an interrupted run). For **local dev only**, reset the DB and reapply all migrations (then seed):

   ```bash
   npm run db:reset
   ```

   That runs `prisma migrate reset --force`: it **drops** the SQLite database at `DATABASE_URL`, reapplies every migration from `prisma/migrations`, then runs `prisma.seed` (`prisma/seed.ts`). Use only on **local dev** data, never on production. To re-seed without wiping the file, use `npm run db:seed` instead (migrations must already succeed).

5. **Development:** `npm run dev` runs migrations, a full `tsc` build, copies `src/generated/prisma-client` into `dist/generated/` (required at runtime), then `tsc --watch`. Run the server in another terminal, for example:

   ```bash
   node --env-file=.env dist/server.js
   ```

   After `npx prisma generate` while using watch mode, run `npm run build:copy-client` (or a full `npm run build`) so `dist/generated` stays in sync.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite URL, e.g. `file:./dev.db` |
| `JWT_SECRET` | Yes | Secret for signing JWTs (minimum 16 characters) |
| `PORT` | No | HTTP port (default `3000`) |
| `NODE_ENV` | No | `development` \| `test` \| `production` (default `development` in schema) |
| `BCRYPT_ROUNDS` | No | bcrypt cost factor; default `12` in code. Tests set `4` via `tests/setEnv.ts` for speed. |

Jest sets `NODE_ENV=test`, `JWT_SECRET`, `DATABASE_URL` (absolute path to `prisma/test.db`), and `BCRYPT_ROUNDS` before loading application code.

## API documentation

With the server running (default `http://localhost:3000`):

- **Root URL:** [`http://localhost:3000/`](http://localhost:3000/) redirects to Swagger UI.

- **Swagger UI:** [`http://localhost:3000/api/docs`](http://localhost:3000/api/docs)
- **OpenAPI JSON:** [`http://localhost:3000/api/openapi.json`](http://localhost:3000/api/openapi.json)

The machine-readable spec is defined in `src/openapi/openapi.document.ts` and merged in `src/swagger.ts`.

## Assumptions

- **First registered user** becomes `admin`; subsequent registrations default to `viewer` (see `registerUser` in `src/modules/auth/auth.service.ts`).
- **Ledger rows** are **soft-deleted** (`isDeleted`); list, CSV export, and dashboard aggregations exclude deleted rows (`buildFinancialRecordWhere` and raw trend SQL use `isDeleted = 0`).
- **Dashboard** filters match record list filters **except** there is no `search` query on dashboard routes (only `from`, `to`, `category`, `type`, plus trend/granularity options).
- **Unknown server failures** return a generic `500` message (`INTERNAL_ERROR`); details are logged server-side only.
- **Dates** on records are normalized to **UTC midnight** for the given calendar day on create/update (`records.service.ts`).
- **CSV export** is capped (large exports set `X-LedgerPulse-Export-Truncated`); see OpenAPI and `records.service.ts`.
- **SQLite** is sufficient for coursework/demo; production would typically use a managed RDBMS and connection pooling.

## Tradeoffs

- **SQLite + single process:** Simple submission and CI story; no separate DB service. Limits concurrent writers and horizontal scaling compared to PostgreSQL.
- **JWT in Authorization header:** Stateless and easy to test; no refresh-token rotation or server-side revocation list (deactivation is enforced on each request via DB lookup in `authenticate`).
- **OpenAPI maintained alongside code:** Accurate high-level contract without codegen coupling; must be updated when routes change (mitigated by integration test hitting `/api/openapi.json`).
- **Integration tests over heavy unit mocks:** Higher confidence for HTTP + DB + auth together; slower than isolated unit tests (mitigated with `--runInBand` and lower `BCRYPT_ROUNDS` in test).

## Role model

Roles are stored on `User` (`prisma/schema.prisma`). Effective permissions are centralized in `src/authz/policy.ts`:

| Role | Permissions |
|------|-------------|
| **viewer** | Read records (`records:read`) |
| **analyst** | Read records + read dashboard (`dashboard:read`) |
| **admin** | Read/write records, read dashboard, manage users (`users:manage`) |

Routes apply `authenticate` and `requirePermission(...)` from `src/middleware/authorize.ts`.

## Feature-to-requirement mapping

Use this table to tie a typical assignment rubric to the implementation. Rename the “Requirement” column to match your brief if needed.

| Requirement (typical) | Implementation |
|------------------------|----------------|
| User registration / login | `POST /api/auth/register`, `POST /api/auth/login` — `src/modules/auth/*` |
| JWT authentication | `auth.service.ts` (sign), `src/middleware/authenticate.ts` (verify + load user) |
| RBAC / role-based access | `src/authz/policy.ts`, `src/middleware/authorize.ts`, route-level `requirePermission` |
| CRUD on domain entities | Financial records: `POST/GET/PATCH/DELETE /api/records` — `src/modules/records/*` |
| Pagination | List response `{ page, limit, total, totalPages, data }` — `records.service.ts` + Zod `listRecordsQuerySchema` |
| Filtering / search | Query params `from`, `to`, `category`, `type`, `search` — `records.filters.ts` |
| Analytics / reporting | `GET /api/dashboard`, `/summary`, `/by-category`, `/recent`, `/trends` — `src/modules/dashboard/*` |
| CSV export | `GET /api/records/export` — `records.controller.ts` + `records.service.ts` |
| Admin user management | `GET/PATCH /api/users` (offset pagination: `items`, `total`, `limit`, `offset`), `GET /api/users/me` — `src/modules/users/*` |
| Consistent JSON errors | `src/middleware/errorHandler.ts`, `src/utils/http.ts` (`success` / `error` envelope) |
| API documentation | OpenAPI + Swagger UI (`src/openapi/openapi.document.ts`, `src/app.ts`) |
| Automated tests | `tests/integration.test.ts` (auth, RBAC, CRUD, filters, pagination, analytics, CSV, OpenAPI) |
| Seed / demo data | `prisma/seed.ts`, `npm run db:seed` |

## Sample credentials and seed instructions

After `npm run db:seed`:

| Email | Password | Role |
|-------|----------|------|
| `admin@demo.local` | `DemoPass123` | admin |
| `analyst@demo.local` | `DemoPass123` | analyst |
| `viewer@demo.local` | `DemoPass123` | viewer |

**Without seed:** register the first account via `POST /api/auth/register` (becomes admin), then either register more users (they become viewers) or promote roles with an admin `PATCH /api/users/:id`.

## Why a modular monolith?

Feature boundaries are enforced in **folders and imports** (`modules/auth`, `modules/records`, etc.), shared **authz** and **middleware**, and a **single** Express app and database. There is one deployment artifact and no network hops between modules, which keeps the assignment small and testable, while the structure still maps cleanly to future extraction (e.g. records service behind HTTP) if requirements grow.

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Migrate, build, run production server |
| `npm run dev` | Migrate once, then TypeScript watch |
| `npm run build` | Compile `src/` → `dist/`, copy Prisma client into `dist/generated/prisma-client` |
| `npm run build:copy-client` | Copy generated Prisma client only (after `prisma generate` in watch mode) |
| `npm test` | Jest integration suite (`--runInBand`) |
| `npm run db:migrate` | Prisma migrate (development) |
| `npm run db:studio` | Prisma Studio |
| `npm run db:seed` | `migrate deploy`, then `prisma/seed.ts` |
| `npm run db:reset` | `migrate reset --force` + seed (fixes local **P3009** / broken dev DB) |

## Project layout

```
src/
  authz/            # Permissions and role → permission map
  config/           # Env validation (Zod)
  db/               # Prisma singleton + re-exports generated client
  generated/        # Prisma Client output (gitignored; created by postinstall / prisma generate)
  errors/           # AppError
  middleware/       # Auth, authorize, validate, errors
  modules/
    auth/           # Register, login
    users/          # Me, admin user CRUD
    records/        # Ledger CRUD, list, CSV export
    dashboard/      # Aggregations and trends
  openapi/          # OpenAPI document + swagger-jsdoc stub
  utils/            # asyncHandler, HTTP helpers
  app.ts            # Express factory (routes, Swagger UI)
  server.ts         # listen + graceful shutdown
  swagger.ts        # Builds merged OpenAPI spec
prisma/             # schema, migrations, seed.ts
tests/              # setEnv.ts, integration.test.ts
```

## License

(Add your license.)
