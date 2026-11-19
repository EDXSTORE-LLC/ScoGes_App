import "server-only";
import { schoolSchemas } from "@/modules/school/validation";
import { templateHeaders, type ImportKind } from "./templates";
import type { Locale } from "@/types/foundation";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  schoolEntities,
  type SchoolKind,
  fieldKeys,
  type FieldKey,
  type SchoolRow,
} from "@/modules/school/registry";
import type { TabularData } from "./csv";
export type PreparedRow = {
  line: number;
  result: "ready" | "invalidRow" | "duplicate";
  data?: Record<string, string | number | boolean | null>;
  problems?: FieldKey[];
};
// Batched tenant-scoped lookups: no per-cell network calls or matching by contacts.
export async function prepareRows(
  client: SupabaseClient,
  tenantId: string,
  kind: ImportKind,
  table: TabularData,
  defaultLanguage: Locale = "fr",
): Promise<PreparedRow[]> {
  const entity = schoolEntities[kind],
    headers = templateHeaders(kind);
  if (
    table.headers.some((h) => !headers.includes(h)) ||
    new Set(table.headers).size !== table.headers.length
  )
    throw Error("invalid_headers");
  const rows = table.rows.map((row) =>
    Object.fromEntries(table.headers.map((h, i) => [h, row[i]])),
  );
  const refs = entity.fields.filter((f) => f.reference);
  const lookup: Partial<Record<SchoolKind, SchoolRow[]>> = {};
  async function fetchCodes(k: SchoolKind, codes: string[]) {
    const found: SchoolRow[] = [];
    for (let i = 0; i < codes.length; i += 100) {
      const { data, error } = await client
        .from(schoolEntities[k].table)
        .select("*")
        .eq("tenant_id", tenantId)
        .in("code", codes.slice(i, i + 100))
        .returns<SchoolRow[]>();
      if (error) throw Error("reference_unavailable");
      found.push(...(data ?? []));
    }
    return found;
  }
  await Promise.all(
    refs.map(async (f) => {
      const header = f.name.replace(/_id$/, "_code");
      const codes = [
        ...new Set(
          rows
            .map((r) => (r[header] ?? "").trim().toLowerCase())
            .filter(Boolean),
        ),
      ];
      lookup[f.reference!] = await fetchCodes(f.reference!, codes);
    }),
  );
  const existingCodes = entity.fields.some((f) => f.name === "code")
    ? await fetchCodes(kind, [
        ...new Set(
          rows.map((r) => (r.code ?? "").trim().toLowerCase()).filter(Boolean),
        ),
      ])
    : [];
  const seen = new Set<string>();
  const prepared: PreparedRow[] = [];
  for (let index = 0; index < rows.length; index++) {
    const raw = rows[index];
    const data: Record<string, unknown> = {};
    let invalid = false;
    const extraProblems: FieldKey[] = [];
    for (const f of entity.fields) {
      if (f.reference) {
        const code = (raw[f.name.replace(/_id$/, "_code")] ?? "")
          .trim()
          .toLowerCase();
        if (!code) {
          if (f.required) invalid = true;
          data[f.name] = null;
          continue;
        }
        const yearCode = (raw.year_code ?? "").trim().toLowerCase();
        const yearId = lookup.years?.find((y) => y.code === yearCode)?.id;
        const found = (lookup[f.reference] ?? []).filter(
          (r) =>
            r.code === code &&
            (f.reference !== "classes" || r.year_id === yearId) &&
            !["archived", "closed"].includes(String(r.status)),
        );
        if (found.length !== 1) invalid = true;
        data[f.name] = found[0]?.id ?? null;
      } else if (raw[f.name] !== undefined && raw[f.name] !== "")
        data[f.name] = raw[f.name];
    }
    if (
      (kind === "students" || kind === "guardians") &&
      !data.preferred_language
    )
      data.preferred_language = defaultLanguage;
    if (kind === "enrollments" && data.class_id) {
      const c = lookup.classes?.find((c) => c.id === data.class_id);
      if (
        !c ||
        c.year_id !== data.year_id ||
        c.level_id !== data.level_id ||
        c.program_id !== data.program_id
      ) {
        invalid = true;
        extraProblems.push("class_id");
      }
    }
    if (
      kind === "enrollments" &&
      data.status &&
      !["draft", "active"].includes(String(data.status))
    ) {
      invalid = true;
      extraProblems.push("status");
    }
    const parsed = schoolSchemas[kind].safeParse(data);
    if (invalid || !parsed.success) {
      const problems = parsed.success
        ? extraProblems.length
          ? extraProblems
          : ["code"]
        : parsed.error.issues.map((issue) => String(issue.path[0]));
      prepared.push({
        line: index + 2,
        result: "invalidRow",
        problems: problems.filter((name): name is FieldKey =>
          fieldKeys.includes(name as FieldKey),
        ),
      });
      continue;
    }
    const values = parsed.data as Record<
      FieldKey,
      string | number | boolean | null
    >;
    let duplicate = false;
    const identity =
      kind === "links"
        ? `${values.student_id}:${values.guardian_id}`
        : kind === "enrollments"
          ? `${values.student_id}:${values.year_id}`
          : String(values.code);
    if (seen.has(identity) || existingCodes.some((r) => r.code === values.code))
      duplicate = true;
    seen.add(identity);
    prepared.push({
      line: index + 2,
      result: duplicate ? "duplicate" : "ready",
      data: values,
    });
  }
  if (kind === "links" || kind === "enrollments") {
    const studentIds = [
      ...new Set(
        prepared.flatMap((r) => (r.data ? [String(r.data.student_id)] : [])),
      ),
    ];
    const existing = new Set<string>();
    for (let i = 0; i < studentIds.length; i += 100) {
      const { data, error } = await client
        .from(entity.table)
        .select(
          kind === "links" ? "student_id,guardian_id" : "student_id,year_id",
        )
        .eq("tenant_id", tenantId)
        .in("student_id", studentIds.slice(i, i + 100))
        .limit(10001)
        .returns<
          { student_id: string; guardian_id?: string; year_id?: string }[]
        >();
      if (error || data.length > 10000) throw Error("reference_unavailable");
      for (const row of data)
        existing.add(
          `${row.student_id}:${kind === "links" ? row.guardian_id : row.year_id}`,
        );
    }
    for (const row of prepared)
      if (
        row.data &&
        existing.has(
          `${row.data.student_id}:${kind === "links" ? row.data.guardian_id : row.data.year_id}`,
        )
      )
        row.result = "duplicate";
  }
  return prepared;
}
