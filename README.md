# LedgerPulse

Backend assessment API: JWT-authenticated personal ledger (credits/debits), balance summary, and CSV export. No frontend.

## Requirements

- Node.js **24 LTS**
- npm

## Assumptions (assignment not fully specified)

- **Domain**: Each user owns a private ledger. **CREDIT** increases balance, **DEBIT** decreases it. Net **balance** = sum(CREDIT amounts) − sum(DEBIT amounts). Amounts are stored as decimals; API returns amounts as **strings** to avoid floating-point surprises.
- **CSV tooling**: CSV export uses **`json2csv@6.0.0-alpha.2`**, the current published line on npm (v5 is deprecated). If you prefer a stable non-alpha release, swapping to **`@json2csv/plainjs@7`** is a small change in `export.controller.ts`.
- **Auth**: Bearer JWT in `Authorization: Bearer <token>`, default expiry **7 days**.

## Run locally (one command)

1. Copy environment file: create `.env` from `.env.example` (same directory as `package.json`).
2. Start the server:

```bash
npm install && npm start
```

`npm start` applies Prisma migrations to the SQLite file from `DATABASE_URL`, compiles TypeScript, and runs the API. Open **http://localhost:3000/api/docs** for Swagger UI.

## Scripts

| Script        | Purpose                                      |
|---------------|----------------------------------------------|
| `npm start`   | Migrate + build + run API                    |
| `npm run build` | TypeScript compile to `dist/`              |
| `npm test`    | Jest + Supertest integration tests           |

## API overview

Base path: `/api`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Liveness |
| POST | `/auth/register` | No | Register |
| POST | `/auth/login` | No | Login |
| GET | `/me` | Yes | Current user |
| GET/POST | `/entries` | Yes | List / create entries |
| GET/PATCH/DELETE | `/entries/:id` | Yes | Read / update / delete |
| GET | `/summary` | Yes | Totals and balance |
| GET | `/exports/entries` | Yes | CSV download |

## Response shape

JSON endpoints use:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Errors:

```json
{
  "success": false,
  "data": null,
  "error": { "message": "...", "code": "...", "details": {} }
}
```

The CSV export endpoint returns `text/csv` instead of JSON.

## Stack

Express, Prisma + SQLite, Zod, JWT (jsonwebtoken), bcryptjs, swagger-jsdoc + swagger-ui-express, json2csv, Jest + Supertest.
