import { openApiDocument } from "./openapi/openapi.document";

/**
 * OpenAPI spec is fully defined in `openapi.document.ts`. We do not run swagger-jsdoc file
 * scanning here — on Vercel the bundled `api/` layout has no `src/openapi/*.js`, which caused
 * cold-start crashes when the glob was resolved at runtime.
 */
export function createSwaggerSpec(): object {
  return openApiDocument as object;
}
