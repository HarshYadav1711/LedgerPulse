import type { Prisma, RecordType } from "../../db/client";

/** Shared filter shape for list, export, and dashboard aggregations (non-deleted only). */
export type FinancialRecordFilters = {
  from?: Date;
  to?: Date;
  category?: string;
  type?: RecordType;
  /** Text match on category and notes (SQLite `LIKE` is ASCII case-insensitive). */
  search?: string;
};

export function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function endOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999));
}

export function buildFinancialRecordWhere(filters: FinancialRecordFilters): Prisma.FinancialRecordWhereInput {
  const and: Prisma.FinancialRecordWhereInput[] = [{ isDeleted: false }];

  if (filters.from !== undefined || filters.to !== undefined) {
    and.push({
      date: {
        ...(filters.from !== undefined ? { gte: startOfUtcDay(filters.from) } : {}),
        ...(filters.to !== undefined ? { lte: endOfUtcDay(filters.to) } : {}),
      },
    });
  }
  if (filters.category !== undefined) {
    and.push({ category: filters.category });
  }
  if (filters.type !== undefined) {
    and.push({ type: filters.type });
  }
  const q = filters.search?.trim();
  if (q !== undefined && q.length > 0) {
    and.push({
      OR: [{ category: { contains: q } }, { notes: { contains: q } }],
    });
  }

  return { AND: and };
}
