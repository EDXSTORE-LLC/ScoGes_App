import { z } from "zod";
import { codeSchema, uuidSchema } from "@/modules/academics/schemas";
const nullableText = (schema: z.ZodType<string>) =>
  z
    .union([schema, z.literal("")])
    .nullable()
    .transform((v) => v || null);
export const booleanSchema = z
  .union([z.boolean(), z.enum(["true", "false"])])
  .transform((v) => v === true || v === "true");
const person = z
  .object({
    code: codeSchema,
    first_name: z.string().trim().min(1).max(100),
    last_name: z.string().trim().min(1).max(100),
    email: nullableText(z.email().max(254)).default(null),
    phone: nullableText(z.string().trim().min(3).max(40)).default(null),
    preferred_language: z.enum(["fr", "en"]).default("fr"),
    status: z.enum(["active", "archived"]).default("active"),
  })
  .strict();
export const studentSchema = person.extend({
  birth_date: z
    .union([z.iso.date(), z.literal("")])
    .nullable()
    .default(null)
    .transform((v) => v || null)
    .refine(
      (v) =>
        !v || (v >= "1900-01-01" && v <= new Date().toISOString().slice(0, 10)),
    ),
});
export const guardianSchema = person
  .extend({
    notify_email: booleanSchema.default(false),
    notify_sms: booleanSchema.default(false),
  })
  .refine((v) => Boolean(v.email || v.phone), { path: ["email"] })
  .refine((v) => !v.notify_email || Boolean(v.email), {
    path: ["notify_email"],
  })
  .refine((v) => !v.notify_sms || Boolean(v.phone), { path: ["notify_sms"] });
export const linkSchema = z
  .object({
    student_id: uuidSchema,
    guardian_id: uuidSchema,
    relationship: z.string().trim().min(1).max(80),
    primary_contact: booleanSchema.default(false),
    billing_contact: booleanSchema.default(false),
    contact_priority: z.coerce.number().int().min(1).max(1000).default(1),
    status: z.enum(["active", "archived"]).default("active"),
  })
  .strict();
