
# LedgerPulse

A role-aware financial data backend engineered for clarity, correctness, and analytics-ready performance.

---

## Overview

LedgerPulse is a backend system built to manage financial records with strict role-based access control and deliver clean, aggregated data for dashboard consumption.

The system emphasizes:
- predictable data flow
- strong access control guarantees
- efficient aggregation for analytics
- maintainable and extensible architecture

---

## Architecture

### System Design (Modular Monolith)

```
Client → Routes → Controllers → Services → Prisma → Database
                     ↓
                 Middleware
         (Auth + RBAC + Validation)
```

### Request Lifecycle

```
Incoming Request
   ↓
Authentication Middleware (JWT)
   ↓
Authorization Middleware (RBAC)
   ↓
Validation Layer (Zod)
   ↓
Controller
   ↓
Service Layer (Business Logic)
   ↓
Database (Prisma)
   ↓
Response Formatter
```

---

## Core Features

### Role-Based Access Control

| Role    | Permissions |
|--------|------------|
| Viewer | Read-only access |
| Analyst | Read + analytics |
| Admin | Full system control |

RBAC is enforced centrally via middleware to ensure consistency.

---

### Financial Records Management

- Create, update, delete records
- Filter by:
  - type (income/expense)
  - category
  - date range
- Soft delete support
- Ownership tracking

---

### Dashboard Analytics

Efficient aggregation at the database layer:

- Total income
- Total expenses
- Net balance
- Category-wise totals
- Monthly trends
- Recent activity

---

### Data Handling

- Pagination (page, limit, total, totalPages)
- Search (notes + category)
- CSV export for reporting

---

### API Experience

- RESTful design
- Consistent response format
- Proper HTTP status codes
- Swagger documentation

---

## Feature Mapping

| Feature | Implementation |
|--------|----------------|
| User & role management | `POST /api/auth/register`, `POST /api/auth/login`; `src/modules/auth/`; JWT in `authenticate` middleware |
| Access control (RBAC) | `src/authz/policy.ts`; `requirePermission` in `src/middleware/authorize.ts` (with `authenticate`) |
| Financial records | `GET|POST|PATCH|DELETE /api/records`; `src/modules/records/` (controllers, services, Zod schemas) |
| Record filters, pagination & search | Query validation in `records.schemas.ts`; `buildFinancialRecordWhere` in `records.filters.ts` |
| CSV export | `GET /api/records/export`; `buildFilteredRecordsCsv` in `records.service.ts`; `src/utils/csv.ts` |
| Dashboard analytics | `GET /api/dashboard`, `/summary`, `/by-category`, `/recent`, `/trends`; `src/modules/dashboard/` |
| Admin user directory | `GET|PATCH /api/users`, `GET /api/users/me`; `src/modules/users/` |
| API contract & docs | `src/openapi/openapi.document.ts`; Swagger UI at `/api/docs`; `GET /api/openapi.json` |
| Persistence | Prisma schema `prisma/schema.prisma`; client `src/db/prisma.ts` + `src/generated/prisma-client` |

---

## API Design

### Authentication

**POST /api/auth/register**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

*(Do not send `role`: the first user in the database becomes admin; later signups are viewers.)*

---

**POST /api/auth/login**

```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

Response:

```json
{
  "token": "jwt_token_here"
}
```

---

### Users

- **GET /api/users/me** — Current user (JWT).
- **GET /api/users** — List users, paginated (`limit`, `offset`); admin only.
- **GET /api/users/:id** — User by id; admin only.
- **PATCH /api/users/:id** — Update `role` and/or `isActive`; admin only.

---

### Records

**GET /api/records?page=1&limit=10&search=salary**

Response:

```json
{
  "page": 1,
  "totalPages": 3,
  "total": 25,
  "data": [
    {
      "id": "uuid",
      "amount": 5000,
      "type": "INCOME",
      "category": "Salary",
      "date": "2024-01-01"
    }
  ]
}
```

---

### Dashboard

**GET /api/dashboard/summary**

```json
{
  "totalIncome": 50000,
  "totalExpense": 20000,
  "netBalance": 30000
}
```

---

### Export

**GET /api/records/export**

Returns:
- CSV file download

---

## Tech Stack

- Node.js (Express)
- Prisma ORM
- PostgreSQL / SQLite
- JWT Authentication
- Zod Validation
- Swagger (OpenAPI)

---

## Deploying to Vercel

This app runs as a **single serverless function** (`api/index.ts`) with rewrites from `vercel.json`. `vercel.json` sets **`"framework": null`** (“Other”) so Vercel does not run the Express preset scan that errors with “No entrypoint found which imports express.” The API file still imports `express` explicitly for compatibility if the dashboard preset is Express.

Express is wired in **`src/createApp.ts`** (not `src/app.ts`): Vercel treats `src/app` like a Next.js entry and expects a **default export** that is a function, which caused `Invalid export found in module "/var/task/src/app.js"` when the file only exported `createApp` by name.

**SQLite (`file:…`) does not work** on Vercel: the filesystem is ephemeral and not shared across invocations. Use a **hosted PostgreSQL** database (Neon, Supabase, Vercel Postgres, etc.).

1. Create a Postgres database and copy its connection string (`postgresql://…`).
2. In the Vercel project → **Settings → Environment Variables**, add (for **Production**, **Preview**, and **Build**):
   - `DB_PROVIDER` = `postgresql`
   - `DATABASE_URL` = your `postgresql://…` URL (must not start with `file:`)
   - `JWT_SECRET` = at least 16 characters
   - `NODE_ENV` = `production` (optional; Vercel usually sets this)
3. Apply migrations to that database **once** (from your machine or CI), for example:

   ```bash
   set DB_PROVIDER=postgresql
   set DATABASE_URL=postgresql://USER:PASSWORD@HOST/DB?schema=public
   node scripts/sync-datasource-provider.js
   npx prisma migrate deploy
   ```

4. Redeploy. The build runs `npm run vercel-build`, which checks Vercel + Postgres, syncs the Prisma datasource, runs `prisma generate`, then compiles the app.

Local development can stay on SQLite; only Vercel (where `VERCEL=1`) enforces Postgres for the build.

**If the site returns `500` / `FUNCTION_INVOCATION_FAILED`:** open the deployment → **Functions** → **Logs**. Common causes: missing `JWT_SECRET` or `DATABASE_URL` on Vercel (set for **Production** and **Preview**, not only Build); password characters in the URL (`@` → `%40`). **Supabase + Vercel:** the direct host (`db.*.supabase.co:5432`) can be IPv6-only; use Supabase’s **connection pooler** URI (often port `6543`) and add `?pgbouncer=true` for Prisma if the dashboard recommends it.

---

## Database Design

### User

```
id (UUID)
email (unique)
password
role
isActive
createdAt
```

### Record

```
id (UUID)
amount
type
category
date
notes
createdBy (FK)
isDeleted
createdAt
updatedAt
```

---

## Setup

```bash
git clone <repo-url>
cd ledgerpulse
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

`npm run dev` applies pending migrations (`migrate deploy`), then starts the API with **nodemon** + **tsx** (TypeScript directly from `src/`, reload on `.ts` changes). No separate build step or second terminal.

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DB_PROVIDER` | `sqlite` (default) or `postgresql`. Drives the Prisma datasource **before** CLI runs (Prisma forbids `provider = env(...)` in `schema.prisma`; see `scripts/sync-datasource-provider.js`). |
| `DATABASE_URL` | SQLite: `file:./dev.db`. PostgreSQL: `postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public` |
| `JWT_SECRET` | ≥ 16 characters |
| `PORT`, `NODE_ENV`, `BCRYPT_ROUNDS` | Optional; see `.env.example` |

**PostgreSQL / SQLite:** SQL in `prisma/migrations/` is **PostgreSQL** (enums, `TIMESTAMP(3)`, etc.). With `DB_PROVIDER=postgresql`, `npm run dev` / `db:seed` run **`prisma migrate deploy`**. With **`DB_PROVIDER=sqlite`**, the same files cannot be applied, so the repo uses **`prisma db push`** for local file DBs (see `scripts/migrate-or-push.js`). `scripts/sync-datasource-provider.js` keeps `schema.prisma` and `migration_lock.toml` in sync so you do not hit **P3019**. Use `node scripts/run-prisma.js` or the npm scripts above so sync runs before Prisma; raw `npx prisma` skips sync unless you run `node scripts/sync-datasource-provider.js` first.

---

## API Documentation

With the server running (default port `3000`):

- **Swagger UI:** `http://localhost:3000/api/docs`
- **OpenAPI JSON:** `http://localhost:3000/api/openapi.json`

---

## Design Decisions

- Modular monolith to balance simplicity and scalability
- RBAC enforced via middleware to avoid duplication
- Aggregation handled at database level for performance
- SQLite for local development, PostgreSQL for production

---

## Performance Considerations

- Pagination reduces query load
- Indexed queries for filters
- Aggregations optimized at DB level

---

## Future Enhancements

- Caching layer (Redis)
- Rate limiting
- Multi-tenant architecture
- Advanced permission system

---

## Summary

LedgerPulse is designed to reflect production-grade backend engineering principles, with a strong focus on correctness, scalability, and clean system design.
