import { Prisma, RecordType } from "@prisma/client";
import { prisma } from "../../db/prisma";
import {
  buildFinancialRecordWhere,
  endOfUtcDay,
  startOfUtcDay,
  type FinancialRecordFilters,
} from "../records/records.filters";
import type {
  DashboardFiltersInput,
  DashboardOverviewQuery,
  DashboardRecentQuery,
  DashboardTrendsQuery,
} from "./dashboard.schemas";

function toFilters(input: DashboardFiltersInput): FinancialRecordFilters {
  return {
    from: input.from,
    to: input.to,
    category: input.category,
    type: input.type as RecordType | undefined,
  };
}

function serializeFilters(f: FinancialRecordFilters) {
  return {
    from: f.from?.toISOString() ?? null,
    to: f.to?.toISOString() ?? null,
    category: f.category ?? null,
    type: f.type ?? null,
  };
}

function decStr(v: Prisma.Decimal | null | undefined): string {
  return (v ?? new Prisma.Decimal(0)).toString();
}

function addUtcMonths(d: Date, deltaMonths: number): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + deltaMonths, d.getUTCDate())
  );
}

/** Default trends window when dates omitted: last 12 UTC months ending at `to`. */
function resolveTrendsRange(filters: FinancialRecordFilters): { from: Date; to: Date } {
  const now = new Date();
  if (filters.from !== undefined && filters.to !== undefined) {
    return {
      from: startOfUtcDay(filters.from),
      to: endOfUtcDay(filters.to),
    };
  }
  if (filters.to !== undefined) {
    const to = endOfUtcDay(filters.to);
    return {
      from: startOfUtcDay(addUtcMonths(filters.to, -12)),
      to,
    };
  }
  if (filters.from !== undefined) {
    return {
      from: startOfUtcDay(filters.from),
      to: endOfUtcDay(now),
    };
  }
  const to = endOfUtcDay(now);
  return {
    from: startOfUtcDay(addUtcMonths(now, -12)),
    to,
  };
}

export async function getSummary(input: DashboardFiltersInput) {
  const filters = toFilters(input);
  const where = buildFinancialRecordWhere(filters);
  const [incomeAgg, expenseAgg, recordCount] = await Promise.all([
    prisma.financialRecord.aggregate({
      where: { ...where, type: "income" },
      _sum: { amount: true },
    }),
    prisma.financialRecord.aggregate({
      where: { ...where, type: "expense" },
      _sum: { amount: true },
    }),
    prisma.financialRecord.count({ where }),
  ]);
  const totalIncome = decStr(incomeAgg._sum.amount);
  const totalExpense = decStr(expenseAgg._sum.amount);
  const net = new Prisma.Decimal(totalIncome).minus(new Prisma.Decimal(totalExpense));
  return {
    filters: serializeFilters(filters),
    totals: {
      totalIncome,
      totalExpense,
      netBalance: net.toString(),
      recordCount,
    },
    empty: recordCount === 0,
  };
}

export async function getByCategory(input: DashboardFiltersInput) {
  const filters = toFilters(input);
  const where = buildFinancialRecordWhere(filters);
  const groups = await prisma.financialRecord.groupBy({
    by: ["category", "type"],
    where,
    _sum: { amount: true },
    _count: { _all: true },
    orderBy: { category: "asc" },
  });

  type CatAgg = {
    category: string;
    totalIncome: string;
    totalExpense: string;
    net: string;
    recordCount: number;
  };
  const byCategory = new Map<string, CatAgg>();

  for (const g of groups) {
    if (!byCategory.has(g.category)) {
      byCategory.set(g.category, {
        category: g.category,
        totalIncome: "0",
        totalExpense: "0",
        net: "0",
        recordCount: 0,
      });
    }
    const row = byCategory.get(g.category)!;
    row.recordCount += g._count._all;
    const sum = decStr(g._sum.amount);
    if (g.type === "income") {
      row.totalIncome = sum;
    } else {
      row.totalExpense = sum;
    }
  }

  for (const row of byCategory.values()) {
    row.net = new Prisma.Decimal(row.totalIncome).minus(new Prisma.Decimal(row.totalExpense)).toString();
  }

  const categories = [...byCategory.values()].sort((a, b) => a.category.localeCompare(b.category));
  return {
    filters: serializeFilters(filters),
    categories,
    empty: categories.length === 0,
  };
}

export async function getRecent(input: DashboardRecentQuery) {
  const filters = toFilters(input);
  const where = buildFinancialRecordWhere(filters);
  const rows = await prisma.financialRecord.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: input.limit,
    select: {
      id: true,
      amount: true,
      type: true,
      category: true,
      date: true,
      notes: true,
      createdById: true,
      createdAt: true,
    },
  });
  const items = rows.map((r) => ({
    id: r.id,
    amount: r.amount.toString(),
    type: r.type,
    category: r.category,
    date: r.date.toISOString(),
    notes: r.notes,
    createdById: r.createdById,
    createdAt: r.createdAt.toISOString(),
  }));
  return {
    filters: serializeFilters(filters),
    limit: input.limit,
    items,
    empty: items.length === 0,
  };
}

type RawTrendRow = {
  bucket: string;
  type: string;
  total: number;
  cnt: number;
};

export async function getTrends(input: DashboardTrendsQuery) {
  const filters = toFilters(input);
  const { from, to } = resolveTrendsRange(filters);
  const category = filters.category;
  const typeFilter = filters.type;

  // Week buckets use SQLite strftime('%Y-%W') (0–53, week starts Sunday). Month buckets use '%Y-%m'.
  const rows =
    input.granularity === "month"
      ? await prisma.$queryRaw<RawTrendRow[]>`
          SELECT strftime('%Y-%m', date) AS bucket,
                 type,
                 CAST(SUM(amount) AS REAL) AS total,
                 COUNT(*) AS cnt
          FROM financial_records
          WHERE isDeleted = 0
            AND date >= ${from}
            AND date <= ${to}
            ${category !== undefined ? Prisma.sql`AND category = ${category}` : Prisma.empty}
            ${typeFilter !== undefined ? Prisma.sql`AND type = ${typeFilter}` : Prisma.empty}
          GROUP BY strftime('%Y-%m', date), type
          ORDER BY strftime('%Y-%m', date) ASC
        `
      : await prisma.$queryRaw<RawTrendRow[]>`
          SELECT strftime('%Y-%W', date) AS bucket,
                 type,
                 CAST(SUM(amount) AS REAL) AS total,
                 COUNT(*) AS cnt
          FROM financial_records
          WHERE isDeleted = 0
            AND date >= ${from}
            AND date <= ${to}
            ${category !== undefined ? Prisma.sql`AND category = ${category}` : Prisma.empty}
            ${typeFilter !== undefined ? Prisma.sql`AND type = ${typeFilter}` : Prisma.empty}
          GROUP BY strftime('%Y-%W', date), type
          ORDER BY strftime('%Y-%W', date) ASC
        `;

  type Bucket = {
    period: string;
    totalIncome: string;
    totalExpense: string;
    net: string;
    recordCount: number;
  };
  const map = new Map<string, Bucket>();

  for (const r of rows) {
    if (!map.has(r.bucket)) {
      map.set(r.bucket, {
        period: r.bucket,
        totalIncome: "0",
        totalExpense: "0",
        net: "0",
        recordCount: 0,
      });
    }
    const b = map.get(r.bucket)!;
    b.recordCount += Number(r.cnt);
    const amt = new Prisma.Decimal(r.total);
    if (r.type === "income") {
      b.totalIncome = amt.toString();
    } else {
      b.totalExpense = amt.toString();
    }
  }

  for (const b of map.values()) {
    b.net = new Prisma.Decimal(b.totalIncome).minus(new Prisma.Decimal(b.totalExpense)).toString();
  }

  const buckets = [...map.values()].sort((a, b) => a.period.localeCompare(b.period));

  return {
    filters: serializeFilters(filters),
    granularity: input.granularity,
    range: {
      from: from.toISOString(),
      to: to.toISOString(),
    },
    buckets,
    empty: buckets.length === 0,
  };
}

export async function getOverview(input: DashboardOverviewQuery) {
  const filtersInput: DashboardFiltersInput = {
    from: input.from,
    to: input.to,
    category: input.category,
    type: input.type,
  };
  const recentInput: DashboardRecentQuery = {
    ...filtersInput,
    limit: input.recentLimit,
  };
  const trendsInput: DashboardTrendsQuery = {
    ...filtersInput,
    granularity: input.granularity,
  };

  const [summary, byCategory, recent, trends] = await Promise.all([
    getSummary(filtersInput),
    getByCategory(filtersInput),
    getRecent(recentInput),
    getTrends(trendsInput),
  ]);

  return {
    summary,
    byCategory,
    recent,
    trends,
  };
}
