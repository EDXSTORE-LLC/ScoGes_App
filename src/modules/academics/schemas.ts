import { z } from "zod";
export const codeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9][a-z0-9_-]{0,39}$/);
export const uuidSchema = z.uuid();
export const nullableUuid = z
  .union([uuidSchema, z.literal("")])
  .nullable()
  .transform((v) => v || null);
const reference = z
  .object({
    code: codeSchema,
    name: z.string().trim().min(1).max(160),
    status: z.enum(["active", "archived"]).default("active"),
  })
  .strict();
export const programSchema = reference;
export const levelSchema = reference;
export const yearSchema = reference
  .extend({
    starts_on: z.iso.date(),
    ends_on: z.iso.date(),
    status: z
      .enum(["planned", "active", "closed", "archived"])
      .default("planned"),
  })
  .refine((v) => v.ends_on >= v.starts_on, { path: ["ends_on"] });
export const classSchema = reference.extend({
  year_id: uuidSchema,
  level_id: uuidSchema,
  program_id: nullableUuid.default(null),
});
export const termSchema = reference
  .extend({
    year_id: uuidSchema,
    starts_on: z.iso.date(),
    ends_on: z.iso.date(),
  })
  .refine((v) => v.ends_on >= v.starts_on, { path: ["ends_on"] });
