import path from "path";
import swaggerJSDoc from "swagger-jsdoc";

export function createSwaggerSpec() {
  return swaggerJSDoc({
    definition: {
      openapi: "3.0.0",
      info: {
        title: "LedgerPulse API",
        version: "1.0.0",
        description: "Personal ledger API with JWT authentication and CSV export.",
      },
      servers: [{ url: "/api" }],
      tags: [
        { name: "Health", description: "Service health" },
        { name: "Auth", description: "Registration and login" },
        { name: "User", description: "Current user profile" },
        { name: "Ledger", description: "Entries and balance summary" },
        { name: "Export", description: "CSV downloads" },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [],
    },
    apis: [path.join(__dirname, "routes", "*.js")],
  });
}
