import { z } from "zod";
import {
  financialRecordFilterQuerySchema,
  financialRecordFiltersObjectSchema,
  refineFinancialRecordQuery,
} from "../records/records.schemas";

/** Same date/category/type rules as record list (no pagination). */
export const dashboardFiltersSchema = financialRecordFilterQuerySchema;

export const dashboardRecentQuerySchema = refineFinancialRecordQuery(
  financialRecordFiltersObjectSchema.extend({
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
);

export const dashboardTrendsQuerySchema = refineFinancialRecordQuery(
  financialRecordFiltersObjectSchema.extend({
    granularity: z.enum(["week", "month"]).default("month"),
  })
);

export const dashboardOverviewQuerySchema = refineFinancialRecordQuery(
  financialRecordFiltersObjectSchema.extend({
    granularity: z.enum(["week", "month"]).default("month"),
    recentLimit: z.coerce.number().int().min(1).max(50).default(20),
  })
);

export type DashboardFiltersInput = z.infer<typeof dashboardFiltersSchema>;
export type DashboardRecentQuery = z.infer<typeof dashboardRecentQuerySchema>;
export type DashboardTrendsQuery = z.infer<typeof dashboardTrendsQuerySchema>;
export type DashboardOverviewQuery = z.infer<typeof dashboardOverviewQuerySchema>;
