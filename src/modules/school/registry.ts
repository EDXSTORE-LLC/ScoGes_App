import { enrollmentStatuses } from "@/modules/enrollments/model";
export const schoolKinds = [
  "years",
  "programs",
  "levels",
  "classes",
  "terms",
  "students",
  "guardians",
  "links",
  "enrollments",
] as const;
export type SchoolKind = (typeof schoolKinds)[number];
export const fieldKeys = [
  "code",
  "name",
  "status",
  "starts_on",
  "ends_on",
  "year_id",
  "level_id",
  "program_id",
  "first_name",
  "last_name",
  "email",
  "phone",
  "preferred_language",
  "birth_date",
  "notify_email",
  "notify_sms",
  "student_id",
  "guardian_id",
  "relationship",
  "primary_contact",
  "billing_contact",
  "contact_priority",
  "class_id",
] as const;
export type FieldKey = (typeof fieldKeys)[number];
export type Field = {
  name: FieldKey;
  type?: "date" | "email" | "checkbox" | "number";
  required?: boolean;
  options?: readonly string[];
  reference?: SchoolKind;
};
export type SchoolRow = {
  id: string;
  tenant_id: string;
  revision: number;
  created_at: string;
  updated_at: string;
} & Partial<Record<FieldKey, string | number | boolean | null>>;
const code: Field = { name: "code", required: true },
  name: Field = { name: "name", required: true };
const status: Field = { name: "status", options: ["active", "archived"] };
const year: Field = { name: "year_id", reference: "years", required: true },
  level: Field = { name: "level_id", reference: "levels", required: true },
  program: Field = { name: "program_id", reference: "programs" };
const dates: Field[] = [
  { name: "starts_on", type: "date", required: true },
  { name: "ends_on", type: "date", required: true },
];
const person: Field[] = [
  code,
  { name: "first_name", required: true },
  { name: "last_name", required: true },
  { name: "email", type: "email" },
  { name: "phone" },
  { name: "preferred_language", options: ["fr", "en"] },
];
export const schoolEntities: Record<
  SchoolKind,
  {
    table: string;
    domain: "academics" | "students" | "guardians" | "enrollments";
    fields: Field[];
  }
> = {
  years: {
    table: "academic_years",
    domain: "academics",
    fields: [
      code,
      name,
      ...dates,
      { name: "status", options: ["planned", "active", "closed", "archived"] },
    ],
  },
  programs: {
    table: "academic_programs",
    domain: "academics",
    fields: [code, name, status],
  },
  levels: {
    table: "academic_levels",
    domain: "academics",
    fields: [code, name, status],
  },
  classes: {
    table: "academic_classes",
    domain: "academics",
    fields: [code, name, year, level, program, status],
  },
  terms: {
    table: "academic_terms",
    domain: "academics",
    fields: [code, name, year, ...dates, status],
  },
  students: {
    table: "students",
    domain: "students",
    fields: [...person, { name: "birth_date", type: "date" }, status],
  },
  guardians: {
    table: "guardians",
    domain: "guardians",
    fields: [
      ...person,
      { name: "notify_email", type: "checkbox" },
      { name: "notify_sms", type: "checkbox" },
      status,
    ],
  },
  links: {
    table: "student_guardians",
    domain: "guardians",
    fields: [
      { name: "student_id", reference: "students", required: true },
      { name: "guardian_id", reference: "guardians", required: true },
      { name: "relationship", required: true },
      { name: "primary_contact", type: "checkbox" },
      { name: "billing_contact", type: "checkbox" },
      { name: "contact_priority", type: "number", required: true },
      status,
    ],
  },
  enrollments: {
    table: "enrollments",
    domain: "enrollments",
    fields: [
      { name: "student_id", reference: "students", required: true },
      year,
      level,
      program,
      { name: "class_id", reference: "classes" },
      { name: "status", options: enrollmentStatuses },
    ],
  },
};
export function rowTitle(row: SchoolRow) {
  return (
    [
      row.code,
      row.name ?? [row.first_name, row.last_name].filter(Boolean).join(" "),
    ]
      .filter(Boolean)
      .join(" — ") || row.id
  );
}
