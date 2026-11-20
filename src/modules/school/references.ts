import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  schoolEntities,
  type Field,
  type SchoolKind,
  type SchoolRow,
} from "./registry";

export async function loadReferenceOptions(
  client: SupabaseClient,
  tenantId: string,
  kinds: Iterable<SchoolKind>,
  fields: Field[],
  selected?: SchoolRow,
): Promise<Partial<Record<SchoolKind, SchoolRow[]>>> {
  if (selected && selected.tenant_id !== tenantId)
    throw Error("invalid_reference");
  const results = await Promise.all(
    [...kinds].map(async (kind) => {
      const table = schoolEntities[kind].table;
      const result = await client
        .from(table)
        .select("*")
        .eq("tenant_id", tenantId)
        .order("created_at")
        .limit(500)
        .returns<SchoolRow[]>();
      if (result.error) throw Error("reference_unavailable");
      const options = result.data ?? [];
      // `selected` is loaded server-side under this tenant. Add only its saved IDs,
      // never client-supplied IDs or all remaining tenant records.
      const missing = [
        ...new Set(
          fields
            .filter((field) => field.reference === kind)
            .flatMap((field) => {
              const id = selected?.[field.name];
              if (id === null || id === undefined) return [];
              if (!z.uuid().safeParse(id).success)
                throw Error("invalid_reference");
              return options.some((option) => option.id === id)
                ? []
                : [String(id)];
            }),
        ),
      ];
      if (missing.length) {
        const saved = await client
          .from(table)
          .select("*")
          .eq("tenant_id", tenantId)
          .in("id", missing)
          .returns<SchoolRow[]>();
        if (
          saved.error ||
          missing.some(
            (id) =>
              !saved.data?.some(
                (row) => row.id === id && row.tenant_id === tenantId,
              ),
          )
        )
          throw Error("reference_unavailable");
        options.push(...(saved.data ?? []));
      }
      return [kind, options] as const;
    }),
  );
  return Object.fromEntries(results);
}

export async function resolveReferenceOverrides(
  client: SupabaseClient,
  tenantId: string,
  fields: Field[],
  raw: Record<string, unknown>,
  form: FormData,
) {
  for (const field of fields) {
    if (!field.reference) continue;
    const override = form.get(`${field.name}_code_override`);
    if (typeof override !== "string" || !override.trim()) continue;
    const code = override.trim().toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]{0,39}$/.test(code))
      throw Error("invalid_reference");
    let query = client
      .from(schoolEntities[field.reference].table)
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("code", code);
    if (field.reference === "classes") {
      if (!z.uuid().safeParse(raw.year_id).success)
        throw Error("invalid_reference");
      query = query.eq("year_id", raw.year_id);
    }
    const { data, error } = await query.limit(2);
    if (error || data?.length !== 1) throw Error("invalid_reference");
    raw[field.name] = data[0].id;
  }
}
