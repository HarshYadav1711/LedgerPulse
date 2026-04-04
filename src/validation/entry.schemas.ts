import { z } from "zod";

export const entryTypeSchema = z.enum(["CREDIT", "DEBIT"]);

const amountSchema = z.coerce
  .number()
  .finite()
  .positive()
  .max(Number.MAX_SAFE_INTEGER, "Amount is too large for safe JSON numbers");

export const createEntryBodySchema = z.object({
  amount: amountSchema,
  type: entryTypeSchema,
  description: z.string().trim().min(1).max(500),
  occurredAt: z.coerce.date(),
});

export const updateEntryBodySchema = z
  .object({
    amount: amountSchema.optional(),
    type: entryTypeSchema.optional(),
    description: z.string().trim().min(1).max(500).optional(),
    occurredAt: z.coerce.date().optional(),
  })
  .refine(
    (v) =>
      v.amount !== undefined ||
      v.type !== undefined ||
      v.description !== undefined ||
      v.occurredAt !== undefined,
    { message: "At least one field is required for update" }
  );

export const entryIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listEntriesQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const summaryQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

export type CreateEntryBody = z.infer<typeof createEntryBodySchema>;
export type UpdateEntryBody = z.infer<typeof updateEntryBodySchema>;
export type ListEntriesQuery = z.infer<typeof listEntriesQuerySchema>;
export type SummaryQuery = z.infer<typeof summaryQuerySchema>;
