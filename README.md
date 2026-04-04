
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

**POST /auth/register**

```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "role": "ADMIN"
}
```

---

**POST /auth/login**

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

### Records

**GET /records?page=1&limit=10&search=salary**

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

**GET /dashboard/summary**

```json
{
  "totalIncome": 50000,
  "totalExpense": 20000,
  "netBalance": 30000
}
```

---

### Export

**GET /records/export**

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

---

## Environment Variables

```
DATABASE_URL=
DB_PROVIDER=
JWT_SECRET=
```

---

## API Documentation

Available at:

```
/api-docs
```

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
