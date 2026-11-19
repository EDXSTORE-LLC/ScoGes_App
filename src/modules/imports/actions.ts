"use server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getLocale } from "@/i18n/messages";
import { requestLimit } from "@/lib/security/request-limit";
import { schoolContext } from "@/modules/school/context";
import { schoolSchemas } from "@/modules/school/validation";
import { schoolText, type SchoolState } from "@/modules/school/messages";
import { prepareRows, type PreparedRow } from "./prepare";
import { importKinds } from "./templates";
import { importLimits } from "./limits";
import { parseCsv } from "./csv";
import { parseXlsx } from "./xlsx";
import { sealPreview, openPreview } from "./preview-token";
export type ImportState = SchoolState & {
  token?: string;
  rows?: {
    line: number;
    result: string;
    data?: Record<string, string | number | boolean | null>;
    problems?: string[];
  }[];
};
export async function previewImportAction(
  _: ImportState,
  form: FormData,
): Promise<ImportState> {
  const locale = getLocale(String(form.get("locale") ?? "fr"));
  const kind = z.enum(importKinds).safeParse(form.get("kind"));
  const tenant = z.uuid().safeParse(form.get("contextTenantId"));
  if (!kind.success || !tenant.success)
    return { ok: false, message: schoolText(locale, "invalid") };
  try {
    const ctx = await schoolContext("imports.preview", tenant.data);
    if (!ctx) return { ok: false, message: schoolText(locale, "denied") };
    if ((await requestLimit("administration", ctx.user.id)) !== "allowed")
      return { ok: false, message: schoolText(locale, "unavailable") };
    const file = form.get("file"),
      limits = importLimits();
    if (
      !(file instanceof File) ||
      file.size === 0 ||
      file.size > limits.maxBytes
    )
      return { ok: false, message: schoolText(locale, "invalid") };
    const bytes = Buffer.from(await file.arrayBuffer());
    const extension = file.name.toLowerCase().split(".").pop();
    const table =
      extension === "csv"
        ? parseCsv(bytes, limits)
        : extension === "xlsx"
          ? await parseXlsx(bytes, limits)
          : null;
    if (!table || !table.rows.length) throw Error("invalid_file");
    const settings = await ctx.client
      .from("tenant_settings")
      .select("default_locale")
      .eq("tenant_id", ctx.membership.tenantId)
      .maybeSingle<{ default_locale: "fr" | "en" }>();
    if (settings.error || !settings.data) throw Error("reference_unavailable");
    const rows = await prepareRows(
      ctx.client,
      ctx.membership.tenantId,
      kind.data,
      table,
      settings.data.default_locale,
    );
    const valid = rows.filter(
      (r): r is PreparedRow & { data: NonNullable<PreparedRow["data"]> } =>
        r.result === "ready" && Boolean(r.data),
    );
    const token = valid.length
      ? sealPreview({
          version: 1,
          batchId: randomUUID(),
          actorId: ctx.user.id,
          tenantId: ctx.membership.tenantId,
          kind: kind.data,
          expiresAt: Date.now() + limits.previewSeconds * 1000,
          rows: valid.map((r) => ({ line: r.line, data: r.data })),
          errors: rows
            .filter((r) => r.result !== "ready")
            .map((r) => ({
              line: r.line,
              result: r.result as "invalidRow" | "duplicate",
              problems: r.problems,
            })),
        })
      : undefined;
    return {
      ok: true,
      message: schoolText(locale, "preview"),
      token,
      rows: rows.map((r) => ({
        ...r,
        data: r.data
          ? Object.fromEntries(
              Object.entries(r.data).map(([key, value]) => [
                key,
                key.endsWith("_id")
                  ? (table.rows[r.line - 2][
                      table.headers.indexOf(key.replace(/_id$/, "_code"))
                    ]
                      ?.trim()
                      .toLowerCase() ?? value)
                  : value,
              ]),
            )
          : undefined,
      })),
    };
  } catch (error) {
    return {
      ok: false,
      message: schoolText(
        locale,
        error instanceof Error &&
          ["reference_unavailable", "import_preview_unavailable"].includes(
            error.message,
          )
          ? "unavailable"
          : "invalid",
      ),
    };
  }
}
const results = z.array(
  z.object({
    line: z.number().int(),
    result: z.enum(["inserted", "duplicate", "invalidRow"]),
    id: z.uuid().nullable(),
  }),
);
export async function commitImportAction(
  _: ImportState,
  form: FormData,
): Promise<ImportState> {
  const locale = getLocale(String(form.get("locale") ?? "fr"));
  const tenant = z.uuid().safeParse(form.get("contextTenantId"));
  if (!tenant.success || form.get("confirm") !== "true")
    return { ok: false, message: schoolText(locale, "invalid") };
  try {
    const ctx = await schoolContext("imports.commit", tenant.data);
    if (!ctx) return { ok: false, message: schoolText(locale, "denied") };
    if ((await requestLimit("administration", ctx.user.id)) !== "allowed")
      return { ok: false, message: schoolText(locale, "unavailable") };
    const preview = openPreview(
      String(form.get("token") ?? ""),
      ctx.user.id,
      ctx.membership.tenantId,
    );
    if (
      !importKinds.includes(preview.kind as (typeof importKinds)[number]) ||
      !preview.rows.length
    )
      throw Error("invalid_import");
    for (const row of preview.rows) schoolSchemas[preview.kind].parse(row.data);
    const { data, error } = await ctx.client.rpc("commit_school_import", {
      target_tenant_id: ctx.membership.tenantId,
      record_kind: preview.kind,
      batch_id: preview.batchId,
      preview_expires_at: new Date(preview.expiresAt).toISOString(),
      import_rows: preview.rows,
    });
    const parsed = results.safeParse(data);
    if (error || !parsed.success)
      return { ok: false, message: schoolText(locale, "failed") };
    revalidatePath(`/dashboard/school/${preview.kind}`);
    return {
      ok: true,
      message: schoolText(locale, "summary"),
      rows: [...preview.errors, ...parsed.data].sort((a, b) => a.line - b.line),
    };
  } catch {
    return { ok: false, message: schoolText(locale, "expired") };
  }
}
