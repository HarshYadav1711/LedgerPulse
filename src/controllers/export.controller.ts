import { Parser } from "json2csv";
import type { Request, Response } from "express";
import { listEntriesForExport } from "../services/entry.service";
import { asyncHandler } from "../utils/asyncHandler";

const fields = [
  { label: "id", value: "id" },
  { label: "type", value: "type" },
  { label: "amount", value: "amount" },
  { label: "description", value: "description" },
  { label: "occurredAt", value: "occurredAt" },
  { label: "createdAt", value: "createdAt" },
];

export const entriesCsv = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId as string;
  const rows = await listEntriesForExport(userId);
  const parser = new Parser({ fields });
  const csv = parser.parse(rows);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="ledger-entries.csv"');
  res.status(200).send(csv);
});
