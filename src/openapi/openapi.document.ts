/**
 * OpenAPI 3.0 document (consumed by swagger-jsdoc + swagger-ui-express).
 * Paths are absolute from the server root (e.g. `/api/health`).
 */

const jsonEnvelope = {
  ApiSuccess: {
    type: "object",
    required: ["success", "data", "error"],
    properties: {
      success: { type: "boolean", example: true },
      data: {},
      error: { type: "null" },
    },
  },
  ApiError: {
    type: "object",
    required: ["success", "data", "error"],
    properties: {
      success: { type: "boolean", example: false },
      data: { type: "null" },
      error: {
        type: "object",
        properties: {
          message: { type: "string" },
          code: { type: "string" },
          details: {},
        },
      },
    },
  },
  PublicUser: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      email: { type: "string", format: "email" },
      role: { type: "string", enum: ["viewer", "analyst", "admin"] },
      isActive: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  AuthResponse: {
    type: "object",
    properties: {
      token: { type: "string" },
      user: { $ref: "#/components/schemas/PublicUser" },
    },
  },
  FinancialRecord: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
      amount: { type: "string", description: "Decimal as string" },
      type: { type: "string", enum: ["income", "expense"] },
      category: { type: "string" },
      date: { type: "string", format: "date-time" },
      notes: { type: "string", nullable: true },
      createdById: { type: "string", format: "uuid" },
      isDeleted: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
};

export const openApiDocument = {
  openapi: "3.0.0",
  info: {
    title: "LedgerPulse API",
    version: "1.0.0",
    description:
      "Finance ledger API with JWT auth, RBAC, financial records, dashboard analytics, and CSV export. JSON responses use a consistent `{ success, data, error }` envelope except CSV export. " +
      "No JWT required: `GET /` (redirects to docs), `GET /api/health`, `GET /api/docs`, `GET /api/openapi.json`, `POST /api/auth/register`, `POST /api/auth/login`.",
  },
  tags: [
    { name: "Health", description: "Liveness" },
    { name: "Auth", description: "Registration and login" },
    { name: "Users", description: "Profiles and admin user management" },
    { name: "Records", description: "Financial records (RBAC: admin writes, all roles read)" },
    {
      name: "Dashboard",
      description:
        "Aggregations (analyst and admin only). Filters: date range, category, type — same as records list but without `search` or pagination.",
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "JWT from `POST /api/auth/login` or `register`",
      },
    },
    schemas: jsonEnvelope,
  },
  paths: {
    "/": {
      get: {
        tags: ["Health"],
        summary: "Redirect site root to Swagger UI",
        responses: {
          "302": {
            description: "`Location: /api/docs`",
            headers: {
              Location: {
                schema: { type: "string", example: "/api/docs" },
              },
            },
          },
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Liveness check",
        responses: {
          "200": {
            description: "OK",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    { $ref: "#/components/schemas/ApiSuccess" },
                    {
                      type: "object",
                      properties: {
                        data: {
                          type: "object",
                          properties: { status: { type: "string", example: "ok" } },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    "/api/openapi.json": {
      get: {
        tags: ["Health"],
        summary: "OpenAPI 3.0 document (same spec served to Swagger UI)",
        responses: {
          "200": {
            description: "OpenAPI JSON",
            content: { "application/json": { schema: { type: "object" } } },
          },
        },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register (first user becomes admin; others default to viewer)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", maxLength: 254 },
                  password: { type: "string", minLength: 8, maxLength: 72 },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created" },
          "400": { description: "Validation error" },
          "409": { description: "Email already registered" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email", maxLength: 254 },
                  password: { type: "string", maxLength: 72 },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Token issued" },
          "401": { description: "Invalid credentials" },
          "403": { description: "Account deactivated" },
        },
      },
    },
    "/api/users/me": {
      get: {
        tags: ["Users"],
        summary: "Current user profile",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "Public user" },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/users": {
      get: {
        tags: ["Users"],
        summary: "List users (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 20, minimum: 1, maximum: 100 } },
          { name: "offset", in: "query", schema: { type: "integer", default: 0, minimum: 0 } },
        ],
        responses: {
          "200": {
            description: "`{ items: PublicUser[], total, limit, offset }` (offset-based, not page/limit pages)",
          },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/users/{id}": {
      get: {
        tags: ["Users"],
        summary: "Get user by id (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Public user" },
          "404": { description: "Not found" },
          "403": { description: "Forbidden" },
        },
      },
      patch: {
        tags: ["Users"],
        summary: "Update role and/or isActive (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  role: { type: "string", enum: ["viewer", "analyst", "admin"] },
                  isActive: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "Updated user" },
          "403": { description: "Forbidden (e.g. self-deactivate)" },
          "404": { description: "Not found" },
        },
      },
    },
    "/api/records": {
      get: {
        tags: ["Records"],
        summary: "List records (paginated, filterable, searchable)",
        description:
          "`search` applies together with `page`/`limit` and other filters (subset of rows, then paginated). Non-deleted records only.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 50 } },
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "type", in: "query", schema: { type: "string", enum: ["income", "expense"] } },
          { name: "search", in: "query", schema: { type: "string", maxLength: 200 } },
        ],
        responses: {
          "200": { description: "{ page, limit, total, totalPages, data } — `isDeleted` is always false for listed rows" },
          "403": { description: "Forbidden" },
        },
      },
      post: {
        tags: ["Records"],
        summary: "Create record (admin)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amount", "type", "category", "date"],
                properties: {
                  amount: { type: "number", exclusiveMinimum: 0 },
                  type: { type: "string", enum: ["income", "expense"] },
                  category: { type: "string" },
                  date: { type: "string", format: "date-time" },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created record" },
          "403": { description: "Forbidden" },
        },
      },
    },
    "/api/records/export": {
      get: {
        tags: ["Records"],
        summary: "Export filtered records as CSV (same filters as list except pagination)",
        description: "Uses the same filter pipeline as `GET /api/records` (including `search`); non-deleted rows only.",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "type", in: "query", schema: { type: "string", enum: ["income", "expense"] } },
          { name: "search", in: "query", schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "text/csv; UTF-8 BOM. Header `X-LedgerPulse-Export-Truncated` if capped at 50k rows.",
            content: { "text/csv": { schema: { type: "string", format: "binary" } } },
          },
        },
      },
    },
    "/api/records/{id}": {
      get: {
        tags: ["Records"],
        summary: "Get record by id",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Record" },
          "404": { description: "Not found or soft-deleted" },
        },
      },
      patch: {
        tags: ["Records"],
        summary: "Update record (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Updated" },
          "403": { description: "Forbidden" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        tags: ["Records"],
        summary: "Soft-delete record (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "{ deleted: true, record }" },
          "403": { description: "Forbidden" },
          "404": { description: "Not found" },
        },
      },
    },
    "/api/dashboard": {
      get: {
        tags: ["Dashboard"],
        summary: "Full dashboard bundle (summary, by-category, recent, trends)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "type", in: "query", schema: { type: "string", enum: ["income", "expense"] } },
          {
            name: "granularity",
            in: "query",
            schema: { type: "string", enum: ["week", "month"], default: "month" },
          },
          { name: "recentLimit", in: "query", schema: { type: "integer", default: 20, maximum: 50 } },
        ],
        responses: {
          "200": { description: "Nested summary, byCategory, recent, trends" },
          "403": { description: "Forbidden (viewer)" },
        },
      },
    },
    "/api/dashboard/summary": {
      get: {
        tags: ["Dashboard"],
        summary: "Totals: income, expense, net, count",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "type", in: "query", schema: { type: "string", enum: ["income", "expense"] } },
        ],
        responses: { "200": { description: "Summary object" }, "403": { description: "Forbidden" } },
      },
    },
    "/api/dashboard/by-category": {
      get: {
        tags: ["Dashboard"],
        summary: "Category breakdown",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "type", in: "query", schema: { type: "string", enum: ["income", "expense"] } },
        ],
        responses: { "200": { description: "Categories array" }, "403": { description: "Forbidden" } },
      },
    },
    "/api/dashboard/recent": {
      get: {
        tags: ["Dashboard"],
        summary: "Recent activity",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 50 } },
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "type", in: "query", schema: { type: "string", enum: ["income", "expense"] } },
        ],
        responses: { "200": { description: "Recent items" }, "403": { description: "Forbidden" } },
      },
    },
    "/api/dashboard/trends": {
      get: {
        tags: ["Dashboard"],
        summary: "Monthly or weekly trends",
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: "granularity",
            in: "query",
            schema: { type: "string", enum: ["week", "month"], default: "month" },
          },
          { name: "from", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "to", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "category", in: "query", schema: { type: "string" } },
          { name: "type", in: "query", schema: { type: "string", enum: ["income", "expense"] } },
        ],
        responses: { "200": { description: "Buckets" }, "403": { description: "Forbidden" } },
      },
    },
  },
};
