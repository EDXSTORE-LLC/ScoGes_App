import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { getLocale } from "@/i18n/messages";
import { hasPermission } from "@/modules/identity/permissions";
import { schoolContext } from "./context";
import {
  schoolEntities,
  schoolKinds,
  schoolKindSchema,
  rowTitle,
  type SchoolKind,
  type SchoolRow,
} from "./registry";
import { schoolText, entityText, statusText, fieldText } from "./messages";
import { SchoolForm } from "./form";
import { PersonConnections } from "@/modules/people/connections";
export type SchoolQuery = {
  locale?: string;
  q?: string;
  status?: string;
  page?: string;
  id?: string;
  student_id?: string;
  year_id?: string;
};
export async function SchoolPage({
  kind: rawKind,
  query: rawQuery,
}: {
  kind: string;
  query: SchoolQuery;
}) {
  const validatedQuery = z
    .object({
      locale: z.string().optional(),
      q: z.string().max(80).optional(),
      status: z.string().max(30).optional(),
      page: z.string().max(5).optional(),
      id: z.string().max(36).optional(),
      student_id: z.string().max(36).optional(),
      year_id: z.string().max(36).optional(),
    })
    .safeParse(rawQuery);
  if (!validatedQuery.success)
    return (
      <p role="alert">{schoolText(getLocale(rawQuery.locale), "invalid")}</p>
    );
  const query = validatedQuery.data;
  const parsedKind = schoolKindSchema.safeParse(rawKind);
  if (!parsedKind.success) notFound();
  const kind = parsedKind.data;
  const locale = getLocale(query.locale),
    entity = schoolEntities[kind];
  const ctx = await schoolContext(`${entity.domain}.read`);
  if (!ctx) return <p role="alert">{schoolText(locale, "denied")}</p>;
  const page = z.coerce
    .number()
    .int()
    .min(1)
    .max(10000)
    .safeParse(query.page ?? 1);
  const current = page.success ? page.data : 1;
  const q = (query.q ?? "").slice(0, 80).replace(/[^\p{L}\p{N} _-]/gu, "");
  const validStatuses =
    entity.fields.find((f) => f.name === "status")?.options ?? [];
  const status = validStatuses.includes(query.status ?? "")
    ? query.status
    : undefined;
  let listing = ctx.client
    .from(entity.table)
    .select("*", { count: "exact" })
    .eq("tenant_id", ctx.membership.tenantId);
  if (q && entity.fields.some((f) => f.name === "code"))
    listing = listing.or(
      `code.ilike.%${q.replaceAll("_", "\\_")}%,name.ilike.%${q.replaceAll("_", "\\_")}%`,
    );
  if (status) listing = listing.eq("status", status);
  for (const name of ["student_id", "year_id"] as const)
    if (
      z.uuid().safeParse(query[name]).success &&
      entity.fields.some((f) => f.name === name)
    )
      listing = listing.eq(name, query[name]!);
  const result = await listing
    .order("created_at", { ascending: false })
    .order("id")
    .range((current - 1) * 25, current * 25 - 1)
    .returns<SchoolRow[]>();
  if (result.error)
    return <p role="alert">{schoolText(locale, "unavailable")}</p>;
  let selected: SchoolRow | undefined;
  if (query.id) {
    if (!z.uuid().safeParse(query.id).success) notFound();
    const r = await ctx.client
      .from(entity.table)
      .select("*")
      .eq("tenant_id", ctx.membership.tenantId)
      .eq("id", query.id)
      .maybeSingle<SchoolRow>();
    if (r.error) return <p role="alert">{schoolText(locale, "unavailable")}</p>;
    if (!r.data) notFound();
    selected = r.data;
  }
  const referenceKinds = new Set<SchoolKind>(
    entity.fields.flatMap((f) => (f.reference ? [f.reference] : [])),
  );
  if (referenceKinds.has("classes")) referenceKinds.add("years");
  const referenceResults = await Promise.all(
    [...referenceKinds].map(async (k) => {
      const r = await ctx.client
        .from(schoolEntities[k].table)
        .select("*")
        .eq("tenant_id", ctx.membership.tenantId)
        .order("created_at")
        .limit(500)
        .returns<SchoolRow[]>();
      return [k, r] as const;
    }),
  );
  const references: Partial<Record<SchoolKind, SchoolRow[]>> =
    Object.fromEntries(referenceResults.map(([k, r]) => [k, r.data ?? []]));
  if (referenceResults.some(([, r]) => r.error))
    return <p role="alert">{schoolText(locale, "unavailable")}</p>;
  const settings = await ctx.client
    .from("tenant_settings")
    .select("default_locale,timezone")
    .eq("tenant_id", ctx.membership.tenantId)
    .maybeSingle<{ default_locale: "fr" | "en"; timezone: string }>();
  if (settings.error || !settings.data)
    return <p role="alert">{schoolText(locale, "unavailable")}</p>;
  const defaultLanguage = settings.data.default_locale;
  const timeZone = settings.data.timezone;
  const canWrite = hasPermission(
    ctx.membership.roles,
    `${entity.domain}.write`,
  );
  const url = (values: Record<string, string>) =>
    `/dashboard/school/${kind}?${new URLSearchParams({ locale, q, status: status ?? "", ...values })}` as Route;
  const history =
    selected && kind === "enrollments"
      ? await ctx.client
          .from("enrollment_history")
          .select("id,created_at,before_state,after_state")
          .eq("tenant_id", ctx.membership.tenantId)
          .eq("enrollment_id", selected.id)
          .order("created_at")
          .returns<
            {
              id: string;
              created_at: string;
              before_state: { status: string; class_id?: string } | null;
              after_state: { status: string; class_id?: string };
            }[]
          >()
      : null;
  if (history?.error)
    return <p role="alert">{schoolText(locale, "unavailable")}</p>;
  return (
    <section lang={locale} className="grid gap-6">
      <h1 className="text-3xl font-bold">{entityText(locale, kind)}</h1>
      <nav
        aria-label={schoolText(locale, "title")}
        className="flex flex-wrap gap-3"
      >
        {schoolKinds
          .filter((k) =>
            hasPermission(
              ctx.membership.roles,
              `${schoolEntities[k].domain}.read`,
            ),
          )
          .map((k) => (
            <Link
              className="underline"
              key={k}
              href={`/dashboard/school/${k}?locale=${locale}` as Route}
            >
              {entityText(locale, k)}
            </Link>
          ))}
        <Link
          className="underline"
          href={`/dashboard/imports?locale=${locale}` as Route}
        >
          {schoolText(locale, "imports")}
        </Link>
      </nav>
      <form className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="locale" value={locale} />
        {entity.fields.some((f) => f.name === "code") && (
          <label className="grid gap-1">
            {schoolText(locale, "search")}
            <input
              name="q"
              defaultValue={q}
              maxLength={80}
              className="min-h-11 rounded border px-2"
            />
          </label>
        )}
        <label className="grid gap-1">
          {fieldText(locale, "status")}
          <select
            name="status"
            defaultValue={status ?? ""}
            className="min-h-11 rounded border px-2"
          >
            <option value="">{schoolText(locale, "all")}</option>
            {validStatuses.map((s) => (
              <option key={s} value={s}>
                {statusText(locale, s)}
              </option>
            ))}
          </select>
        </label>
        <button className="min-h-11 rounded border px-3">
          {schoolText(locale, "filter")}
        </button>
      </form>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <caption className="sr-only">{entityText(locale, kind)}</caption>
          <thead>
            <tr>
              <th className="p-2">{entityText(locale, kind)}</th>
              <th className="p-2">{fieldText(locale, "status")}</th>
              <th className="p-2">{schoolText(locale, "edit")}</th>
            </tr>
          </thead>
          <tbody>
            {result.data?.map((row) => (
              <tr key={row.id} className="border-t">
                <td className="p-2">
                  {kind === "links" || kind === "enrollments"
                    ? rowTitle(
                        (references.students ?? []).find(
                          (s) => s.id === row.student_id,
                        ) ?? row,
                      )
                    : rowTitle(row)}
                </td>
                <td className="p-2">
                  {statusText(locale, String(row.status))}
                </td>
                <td className="p-2">
                  <Link
                    className="underline"
                    href={url({ id: row.id, page: String(current) })}
                  >
                    {schoolText(locale, "edit")}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!result.data?.length && <p>{schoolText(locale, "empty")}</p>}
      </div>
      <nav className="flex gap-4" aria-label={schoolText(locale, "pagination")}>
        {current > 1 && (
          <Link href={url({ page: String(current - 1) })}>
            {schoolText(locale, "previous")}
          </Link>
        )}
        {current * 25 < (result.count ?? 0) && (
          <Link href={url({ page: String(current + 1) })}>
            {schoolText(locale, "next")}
          </Link>
        )}
      </nav>
      {canWrite && (
        <>
          <Link className="underline" href={url({})}>
            {schoolText(locale, "create")}
          </Link>
          <SchoolForm
            key={`${kind}-${selected?.id ?? "new"}`}
            kind={kind}
            locale={locale}
            tenantId={ctx.membership.tenantId}
            row={selected}
            references={references}
            defaultLanguage={defaultLanguage}
          />
          {referenceKinds.size > 0 && (
            <p className="text-sm">{schoolText(locale, "referenceLimit")}</p>
          )}
        </>
      )}
      {selected && (kind === "students" || kind === "guardians") && (
        <PersonConnections
          client={ctx.client}
          tenantId={ctx.membership.tenantId}
          id={selected.id}
          kind={kind}
          locale={locale}
        />
      )}
      {history && (
        <section>
          <h2 className="text-xl font-semibold">
            {schoolText(locale, "history")}
          </h2>
          <ol>
            {history.data?.map((event) => (
              <li key={event.id}>
                {new Intl.DateTimeFormat(locale, {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone,
                }).format(new Date(event.created_at))}
                :{" "}
                {event.before_state
                  ? statusText(locale, event.before_state.status)
                  : schoolText(locale, "create")}{" "}
                → {statusText(locale, event.after_state.status)}
                {event.after_state.class_id
                  ? ` · ${rowTitle((references.classes ?? []).find((c) => c.id === event.after_state.class_id) ?? ({ id: event.after_state.class_id } as SchoolRow))}`
                  : ""}
              </li>
            ))}
          </ol>
        </section>
      )}
    </section>
  );
}
