import { Prisma } from "@prisma/client";
import { AppError } from "../errors/AppError";
import { prisma } from "../db/prisma";
import type {
  CreateEntryBody,
  ListEntriesQuery,
  SummaryQuery,
  UpdateEntryBody,
} from "../validation/entry.schemas";

function toEntryDto(entry: {
  id: string;
  userId: string;
  amount: Prisma.Decimal;
  type: "CREDIT" | "DEBIT";
  description: string;
  occurredAt: Date;
  createdAt: Date;
}) {
  return {
    id: entry.id,
    userId: entry.userId,
    amount: entry.amount.toString(),
    type: entry.type,
    description: entry.description,
    occurredAt: entry.occurredAt.toISOString(),
    createdAt: entry.createdAt.toISOString(),
  };
}

function dateRangeFilter(from?: Date, to?: Date) {
  if (!from && !to) {
    return undefined;
  }
  return {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
  };
}

export async function createEntry(userId: string, input: CreateEntryBody) {
  const entry = await prisma.ledgerEntry.create({
    data: {
      userId,
      amount: new Prisma.Decimal(input.amount),
      type: input.type,
      description: input.description,
      occurredAt: input.occurredAt,
    },
  });
  return toEntryDto(entry);
}

export async function listEntries(userId: string, query: ListEntriesQuery) {
  const occurredAt = dateRangeFilter(query.from, query.to);
  const where = {
    userId,
    ...(occurredAt ? { occurredAt } : {}),
  };
  const [items, total] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where,
      orderBy: { occurredAt: "desc" },
      take: query.limit,
      skip: query.offset,
    }),
    prisma.ledgerEntry.count({ where }),
  ]);
  return {
    items: items.map(toEntryDto),
    total,
    limit: query.limit,
    offset: query.offset,
  };
}

export async function getEntry(userId: string, id: string) {
  const entry = await prisma.ledgerEntry.findFirst({
    where: { id, userId },
  });
  if (!entry) {
    throw new AppError(404, "Ledger entry not found", "ENTRY_NOT_FOUND");
  }
  return toEntryDto(entry);
}

export async function updateEntry(userId: string, id: string, input: UpdateEntryBody) {
  await getEntry(userId, id);
  const data: Prisma.LedgerEntryUpdateInput = {};
  if (input.amount !== undefined) {
    data.amount = new Prisma.Decimal(input.amount);
  }
  if (input.type !== undefined) {
    data.type = input.type;
  }
  if (input.description !== undefined) {
    data.description = input.description;
  }
  if (input.occurredAt !== undefined) {
    data.occurredAt = input.occurredAt;
  }
  const entry = await prisma.ledgerEntry.update({
    where: { id },
    data,
  });
  return toEntryDto(entry);
}

export async function deleteEntry(userId: string, id: string) {
  await getEntry(userId, id);
  await prisma.ledgerEntry.delete({ where: { id } });
}

export async function getSummary(userId: string, query: SummaryQuery) {
  const occurredAt = dateRangeFilter(query.from, query.to);
  const whereBase = {
    userId,
    ...(occurredAt ? { occurredAt } : {}),
  };

  const [creditAgg, debitAgg, count] = await Promise.all([
    prisma.ledgerEntry.aggregate({
      where: { ...whereBase, type: "CREDIT" },
      _sum: { amount: true },
    }),
    prisma.ledgerEntry.aggregate({
      where: { ...whereBase, type: "DEBIT" },
      _sum: { amount: true },
    }),
    prisma.ledgerEntry.count({ where: whereBase }),
  ]);

  const credits = creditAgg._sum.amount ?? new Prisma.Decimal(0);
  const debits = debitAgg._sum.amount ?? new Prisma.Decimal(0);
  const balance = credits.minus(debits);

  return {
    entryCount: count,
    totalCredits: credits.toString(),
    totalDebits: debits.toString(),
    balance: balance.toString(),
    from: query.from?.toISOString() ?? null,
    to: query.to?.toISOString() ?? null,
  };
}

export async function listEntriesForExport(userId: string) {
  const items = await prisma.ledgerEntry.findMany({
    where: { userId },
    orderBy: { occurredAt: "asc" },
  });
  return items.map((e) => ({
    id: e.id,
    type: e.type,
    amount: e.amount.toString(),
    description: e.description,
    occurredAt: e.occurredAt.toISOString(),
    createdAt: e.createdAt.toISOString(),
  }));
}
