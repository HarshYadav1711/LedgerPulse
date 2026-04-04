import { z } from "zod";

const amountSchema = z.coerce
  .number()
  .finite()
  .positive()
  .max(Number.MAX_SAFE_INTEGER, "Amount is too large for safe JSON numbers");

export const recordTypeSchema = z.enum(["income", "expense"]);

export const createRecordBodySchema = z.object({
  amount: amountSchema,
  type: recordTypeSchema,
  category: z.string().trim().min(1, "Category is required").max(120),
  date: z.coerce.date(),
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((v) => (v === undefined || v === "" ? undefined : v)),
});

export const updateRecordBodySchema = z
  .object({
    amount: amountSchema.optional(),
    type: recordTypeSchema.optional(),
    category: z.string().trim().min(1).max(120).optional(),
    date: z.coerce.date().optional(),
    notes: z
      .union([z.string().trim().max(2000), z.literal(""), z.null()])
      .optional()
      .transform((v) => {
        if (v === undefined) {
          return undefined;
        }
        if (v === null || v === "") {
          return null;
        }
        return v;
      }),
  })
  .refine(
    (v) =>
      v.amount !== undefined ||
      v.type !== undefined ||
      v.category !== undefined ||
      v.date !== undefined ||
      v.notes !== undefined,
    { message: "At least one field is required for update" }
  );

export const recordIdParamSchema = z.object({
  id: z.string().uuid("Invalid record id"),
});

export const listRecordsQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
    category: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .optional()
      .transform((v) => (v === undefined || v === "" ? undefined : v)),
    type: recordTypeSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
    offset: z.coerce.number().int().min(0).default(0),
  })
  .refine(
    (q) => {
      if (q.from !== undefined && q.to !== undefined && q.from.getTime() > q.to.getTime()) {
        return false;
      }
      return true;
    },
    { message: "`from` must be on or before `to`", path: ["to"] }
  );

export type CreateRecordBody = z.infer<typeof createRecordBodySchema>;
export type UpdateRecordBody = z.infer<typeof updateRecordBodySchema>;
export type ListRecordsQuery = z.infer<typeof listRecordsQuerySchema>;
