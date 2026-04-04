import { Prisma, RecordType } from "@prisma/client";
import { prisma } from "../../db/prisma";
import { AppError } from "../../errors/AppError";
import {
  buildFinancialRecordWhere,
  endOfUtcDay,
  startOfUtcDay,
} from "./records.filters";
import type { CreateRecordBody, ListRecordsQuery, UpdateRecordBody } from "./records.schemas";

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

function buildListWhere(query: ListRecordsQuery): Prisma.FinancialRecordWhereInput {
  return buildFinancialRecordWhere({
    from: query.from,
    to: query.to,
    category: query.category,
    type: query.type as RecordType | undefined,
  });
}

export async function listRecords(query: ListRecordsQuery) {
  const where = buildListWhere(query);
  const [items, total] = await Promise.all([
    prisma.financialRecord.findMany({
      where,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      take: query.limit,
      skip: query.offset,
    }),
    prisma.financialRecord.count({ where }),
  ]);
  return {
    items: items.map(toRecordDto),
    total,
    limit: query.limit,
    offset: query.offset,
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
