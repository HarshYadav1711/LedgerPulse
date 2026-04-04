import { z } from "zod";

/** RFC-aligned practical max; keeps auth payloads bounded. */
const emailSchema = z.string().trim().toLowerCase().min(1).max(254).email();

/** bcrypt uses the first 72 bytes of the password; cap avoids silent truncation surprises. */
const passwordSchema = z.string().min(8, "Password must be at least 8 characters").max(72);

export const registerBodySchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const loginBodySchema = z
  .object({
    email: emailSchema,
    password: z.string().min(1, "Password is required").max(72),
  })
  .strict();

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
