import { Prisma, RecordType } from "../../db/client";
import { prisma } from "../../db/prisma";
import { AppError } from "../../errors/AppError";
import { stringifyCsv } from "../../utils/csv";
import {
  buildFinancialRecordWhere,
  endOfUtcDay,
  startOfUtcDay,
} from "./records.filters";
import type { CreateRecordBody, ListRecordsQuery, RecordsExportQuery, UpdateRecordBody } from "./records.schemas";

const MAX_EXPORT_ROWS = 50_000;

function toRecordDto(row: {
  id: string;
  amount: Prisma.Decimal;
  type: RecordType;
  category: string;
  date: Date;
  notes: string | null;
  createdById: string;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: row.id,
    amount: row.amount.toString(),
    type: row.type,
    category: row.category,
    date: row.date.toISOString(),
    notes: row.notes,
    createdById: row.createdById,
    isDeleted: row.isDeleted,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createRecord(createdById: string, input: CreateRecordBody) {
  const row = await prisma.financialRecord.create({
    data: {
      amount: new Prisma.Decimal(input.amount),
      type: input.type as RecordType,
      category: input.category,
      date: startOfUtcDay(input.date),
      notes: input.notes ?? null,
      createdById,
    },
  });
  return toRecordDto(row);
}

function listFiltersFromQuery(query: ListRecordsQuery) {
  return buildFinancialRecordWhere({
    from: query.from,
    to: query.to,
    category: query.category,
    type: query.type as RecordType | undefined,
    search: query.search,
  });
}

function exportFiltersFromQuery(query: RecordsExportQuery) {
  return buildFinancialRecordWhere({
    from: query.from,
    to: query.to,
    category: query.category,
    type: query.type as RecordType | undefined,
    search: query.search,
  });
}

export async function listRecords(query: ListRecordsQuery) {
  const where = listFiltersFromQuery(query);
  const skip = (query.page - 1) * query.limit;
  const [rows, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: query.limit,
      skip,
    }),
    prisma.financialRecord.count({ where }),
  ]);
  const totalPages = total === 0 ? 0 : Math.ceil(total / query.limit);
  return {
    page: query.page,
    limit: query.limit,
    total,
    totalPages,
    data: rows.map(toRecordDto),
  };
}

export async function getRecordById(id: string) {
  const row = await prisma.financialRecord.findFirst({
    where: { id, isDeleted: false },
  });
  if (!row) {
    throw new AppError(404, "Record not found", "NOT_FOUND");
  }
  return toRecordDto(row);
}

export async function updateRecord(id: string, input: UpdateRecordBody) {
  await getRecordById(id);
  const data: Prisma.FinancialRecordUpdateInput = {};
  if (input.amount !== undefined) {
    data.amount = new Prisma.Decimal(input.amount);
  }
  if (input.type !== undefined) {
    data.type = input.type as RecordType;
  }
  if (input.category !== undefined) {
    data.category = input.category;
  }
  if (input.date !== undefined) {
    data.date = startOfUtcDay(input.date);
  }
  if (input.notes !== undefined) {
    data.notes = input.notes; // null clears notes
  }
  const row = await prisma.financialRecord.update({
    where: { id },
    data,
  });
  return toRecordDto(row);
}

export async function softDeleteRecord(id: string) {
  await getRecordById(id);
  const row = await prisma.financialRecord.update({
    where: { id },
    data: { isDeleted: true },
  });
  return toRecordDto(row);
}

type CsvRow = {
  id: string;
  amount: string;
  type: string;
  category: string;
  date: string;
  notes: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
};

const csvColumns: { header: string; key: keyof CsvRow }[] = [
  { header: "id", key: "id" },
  { header: "amount", key: "amount" },
  { header: "type", key: "type" },
  { header: "category", key: "category" },
  { header: "date", key: "date" },
  { header: "notes", key: "notes" },
  { header: "createdById", key: "createdById" },
  { header: "createdAt", key: "createdAt" },
  { header: "updatedAt", key: "updatedAt" },
];

export async function buildFilteredRecordsCsv(query: RecordsExportQuery): Promise<{
  csv: string;
  filename: string;
  rowCount: number;
  truncated: boolean;
}> {
  const where = exportFiltersFromQuery(query);
  const totalMatching = await prisma.financialRecord.count({ where });
  const truncated = totalMatching > MAX_EXPORT_ROWS;
  const rows = await prisma.financialRecord.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: MAX_EXPORT_ROWS,
    select: {
      id: true,
      amount: true,
      type: true,
      category: true,
      date: true,
      notes: true,
      createdById: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const flat: CsvRow[] = rows.map((r) => ({
    id: r.id,
    amount: r.amount.toString(),
    type: r.type,
    category: r.category,
    date: r.date.toISOString(),
    notes: r.notes ?? "",
    createdById: r.createdById,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  const headers = csvColumns.map((c) => c.header);
  const dataRows = flat.map((row) => csvColumns.map((c) => row[c.key] ?? ""));
  const body = stringifyCsv(headers, dataRows);
  const csv = `\uFEFF${body}`;
  const stamp = new Date().toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "Z");
  const filename = `ledger-pulse-records_${stamp}.csv`;

  return {
    csv,
    filename,
    rowCount: flat.length,
    truncated,
  };
}
