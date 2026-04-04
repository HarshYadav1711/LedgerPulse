# LedgerPulse

Backend API scaffold (Express + Prisma + SQLite + Zod).

## Prerequisites

- Node.js 24 LTS
- npm

## Setup

1. Copy `.env.example` to `.env` in the project root.
2. Install and start:

```bash
npm install && npm start
```

`npm start` runs database migrations, compiles TypeScript, and starts the server with `node --env-file=.env`.

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Migrate, build, run production server |
| `npm run dev` | Migrate once, then `tsc --watch` (run server in another terminal after build) |
| `npm run build` | Compile `src/` to `dist/` |
| `npm run db:migrate` | Create/apply migrations (development) |
| `npm run db:studio` | Open Prisma Studio |

## Project layout

```
src/
  config/           # Environment and app configuration
  middleware/       # Error handling, validation helpers, etc.
  modules/
    auth/           # Auth routes (stub)
    users/          # User routes (stub)
    records/        # Records routes (stub)
    dashboard/      # Dashboard routes (stub)
  utils/            # Shared helpers (HTTP envelope, async handler)
  validation/       # Optional shared Zod schemas (see `src/validation/index.ts`)
  app.ts            # Express app factory
  server.ts         # HTTP listener + graceful shutdown
prisma/             # Schema and migrations
```

## API

- **Health:** `GET /api/health` — process liveness (JSON envelope).

Module routers are mounted under `/api/auth`, `/api/users`, `/api/records`, and `/api/dashboard` with no business routes yet.

## Response format

JSON responses use:

```json
{ "success": true, "data": {}, "error": null }
```

Errors:

```json
{ "success": false, "data": null, "error": { "message": "...", "code": "..." } }
```

## TODO

- [ ] Replace `SchemaPlaceholder` in `prisma/schema.prisma` with domain models.
- [ ] Implement module routes, controllers, services, and Zod schemas.
- [ ] Add authentication, tests, and API documentation as required.

## License

(Add your license.)
