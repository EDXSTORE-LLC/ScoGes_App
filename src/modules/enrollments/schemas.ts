import { z } from "zod";
import { uuidSchema, nullableUuid } from "@/modules/academics/schemas";
export const enrollmentStatuses = [
  "draft",
  "active",
  "completed",
  "withdrawn",
  "cancelled",
] as const;
export const enrollmentSchema = z
  .object({
    student_id: uuidSchema,
    year_id: uuidSchema,
    level_id: uuidSchema,
    program_id: nullableUuid.default(null),
    class_id: nullableUuid.default(null),
    status: z.enum(enrollmentStatuses).default("draft"),
  })
  .strict();
export function mayTransitionEnrollment(
  from: (typeof enrollmentStatuses)[number],
  to: (typeof enrollmentStatuses)[number],
) {
  return (
    !["completed", "withdrawn", "cancelled"].includes(from) &&
    (from === to ||
      (from === "draft" && ["active", "cancelled"].includes(to)) ||
      (from === "active" && ["completed", "withdrawn"].includes(to)))
  );
}
