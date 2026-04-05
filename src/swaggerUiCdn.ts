import type { RequestHandler } from "express";

/** Pin version for stable CDN URLs (Swagger UI 5.x). */
const SWAGGER_UI_VER = "5.11.2";
const SWAGGER_UI_BASE = `https://unpkg.com/swagger-ui-dist@${SWAGGER_UI_VER}`;

/**
 * Serves Swagger UI HTML that loads CSS/JS from unpkg. Use this instead of
 * `swagger-ui-express` static middleware so Vercel bundles do not depend on
 * `node_modules/swagger-ui-dist` (often missing from the function, → blank /api/docs).
 */
export function swaggerUiCdnHandler(): RequestHandler {
  return (_req, res) => {
    res
      .type("html")
      .set("Cache-Control", "public, max-age=300")
      .send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>LedgerPulse API</title>
  <link rel="stylesheet" href="${SWAGGER_UI_BASE}/swagger-ui.css" crossorigin="anonymous"/>
  <style>
    html { box-sizing: border-box; overflow-y: scroll; }
    *, *:before, *:after { box-sizing: inherit; }
    body { margin: 0; background: #fafafa; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_UI_BASE}/swagger-ui-bundle.js" crossorigin="anonymous"></script>
  <script src="${SWAGGER_UI_BASE}/swagger-ui-standalone-preset.js" crossorigin="anonymous"></script>
  <script>
    window.onload = function () {
      window.ui = SwaggerUIBundle({
        url: window.location.origin + "/api/openapi.json",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>`);
  };
}
