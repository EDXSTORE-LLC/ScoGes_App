import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";
import { schoolEntities, type Field } from "./registry";
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
