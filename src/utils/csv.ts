/**
 * Minimal RFC 4180-style CSV serialization (no external deps).
 * Double quotes in values are escaped; commas, CR/LF, and quotes trigger quoting.
 */
export function escapeCsvCell(raw: string): string {
  if (raw.includes('"') || raw.includes(",") || raw.includes("\r") || raw.includes("\n")) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

/** First row is headers; each data row must have the same length as headers. */
export function stringifyCsv(headers: string[], rows: string[][]): string {
  const headerLine = headers.map(escapeCsvCell).join(",");
  if (rows.length === 0) {
    return `${headerLine}\n`;
  }
  const lines = rows.map((r) => r.map(escapeCsvCell).join(","));
  return `${headerLine}\n${lines.join("\n")}\n`;
}
