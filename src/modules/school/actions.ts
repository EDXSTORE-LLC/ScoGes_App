"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getLocale } from "@/i18n/messages";
import { requestLimit } from "@/lib/security/request-limit";
import { schoolKindSchema, schoolEntities, schoolSchemas } from "./registry";
import { schoolContext } from "./context";
import { schoolText, schoolError, type SchoolState } from "./messages";
const identity = z.object({
  id: z.union([z.uuid(), z.literal("")]),
  revision: z.union([z.coerce.number().int().positive(), z.literal("")]),
  contextTenantId: z.uuid(),
});
export async function saveSchoolAction(
  _: SchoolState,
  form: FormData,
): Promise<SchoolState> {
  const locale = getLocale(String(form.get("locale") ?? "fr"));
  const kind = schoolKindSchema.safeParse(form.get("kind"));
  const ids = identity.safeParse(Object.fromEntries(form));
  if (!kind.success || !ids.success)
    return { ok: false, message: schoolText(locale, "invalid") };
  const entity = schoolEntities[kind.data];
  const raw = Object.fromEntries(
    entity.fields.map((f) => [
      f.name,
      f.type === "checkbox"
        ? form.get(f.name) === "true"
        : (form.get(f.name) ?? ""),
    ]),
  );
  const parsed = schoolSchemas[kind.data].safeParse(raw);
  if (!parsed.success)
    return {
      ok: false,
      message: schoolText(locale, "invalid"),
      fields: parsed.error.issues.map((i) => String(i.path[0])),
    };
  try {
    const ctx = await schoolContext(
      `${entity.domain}.write`,
      ids.data.contextTenantId,
    );
    if (
      !ctx ||
      (await requestLimit("administration", ctx.user.id)) !== "allowed"
    )
      return {
        ok: false,
        message: schoolText(locale, ctx ? "unavailable" : "denied"),
      };
    const { error } = await ctx.client.rpc("save_school_record", {
      target_tenant_id: ctx.membership.tenantId,
      record_kind: kind.data,
      record_id: ids.data.id || null,
      expected_revision: ids.data.id ? ids.data.revision : null,
      record_data: parsed.data,
    });
    if (error) return { ok: false, message: schoolError(locale, error) };
    revalidatePath("/dashboard", "layout");
    return { ok: true, message: schoolText(locale, "saved") };
  } catch {
    return { ok: false, message: schoolText(locale, "unavailable") };
  }
}
