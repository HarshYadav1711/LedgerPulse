
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

## API Design

### Authentication

**POST /api/auth/register**

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "role": "ADMIN"
}
```

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

**PostgreSQL notes:** Migrations in `prisma/migrations/` are **SQLite-specific**. For Postgres, point `DATABASE_URL` at an empty database, set `DB_PROVIDER=postgresql`, run `npm run prisma:generate`, then **`npm run db:push`** to create tables (or author Postgres migrations separately). Use `node scripts/run-prisma.js` or npm scripts (`db:migrate`, `db:seed`, …) so the provider sync runs; raw `npx prisma` skips sync unless you run `node scripts/sync-datasource-provider.js` first.

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
