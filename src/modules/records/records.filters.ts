import type { Prisma, RecordType } from "@prisma/client";

/** Shared filter shape for list + dashboard aggregations (non-deleted only). */
export type FinancialRecordFilters = {
  from?: Date;
  to?: Date;
  category?: string;
  type?: RecordType;
};

export function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function endOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

export function buildFinancialRecordWhere(filters: FinancialRecordFilters): Prisma.FinancialRecordWhereInput {
  const where: Prisma.FinancialRecordWhereInput = {
    isDeleted: false,
  };
  if (filters.from !== undefined || filters.to !== undefined) {
    where.date = {};
    if (filters.from !== undefined) {
      where.date.gte = startOfUtcDay(filters.from);
    }
    if (filters.to !== undefined) {
      where.date.lte = endOfUtcDay(filters.to);
    }
  }
  if (filters.category !== undefined) {
    where.category = filters.category;
  }
  if (filters.type !== undefined) {
    where.type = filters.type;
  }
  return where;
}
