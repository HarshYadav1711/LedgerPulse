import path from "path";
import swaggerJSDoc from "swagger-jsdoc";
import { openApiDocument } from "./openapi/openapi.document";

export function createSwaggerSpec(): object {
  return swaggerJSDoc({
    definition: openApiDocument as any,
    apis: [path.join(__dirname, "openapi", "*.js")],
  });
}
