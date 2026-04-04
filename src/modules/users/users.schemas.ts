import { z } from "zod";

export const userIdParamSchema = z.object({
  id: z.string().uuid("Invalid user id"),
});

export const listUsersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const updateUserBodySchema = z
  .object({
    role: z.enum(["viewer", "analyst", "admin"]).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => v.role !== undefined || v.isActive !== undefined, {
    message: "At least one of role or isActive is required",
  });

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserBody = z.infer<typeof updateUserBodySchema>;
