// @vitest-environment jsdom
import { afterEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadReferenceOptions } from "./references";
import { SchoolForm } from "./form";
import { schoolEntities, type SchoolRow } from "./registry";
import { enrollmentSchema } from "@/modules/enrollments/schemas";
vi.mock("./actions", () => ({ saveSchoolAction: async () => ({ ok: true }) }));
afterEach(cleanup);
const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const tenant = id(9000),
  foreignTenant = id(9001);
function row(n: number, extra: Partial<SchoolRow> = {}): SchoolRow {
  return {
    id: id(n),
    tenant_id: tenant,
    revision: 1,
    created_at: "2026-11-20T00:00:00Z",
    updated_at: "2026-11-20T00:00:00Z",
    code: `ref-${n}`,
    status: "active",
    ...extra,
  };
}
const fields = schoolEntities.enrollments.fields;
const kinds = new Set(
  fields.flatMap((field) => (field.reference ? [field.reference] : [])),
);
function fixture(saved = 501, missing = false) {
  const selected = row(8000, {
    student_id: id(1),
    year_id: id(1),
    level_id: id(1),
    class_id: id(saved),
    program_id: id(saved),
    status: "draft",
  });
  const records: Record<string, SchoolRow[]> = {
    students: [row(1)],
    academic_years: [row(1)],
    academic_levels: [row(1)],
    academic_classes: Array.from({ length: 600 }, (_, index) =>
      row(index + 1, {
        year_id: id(1),
        level_id: id(1),
        program_id: id(saved),
        ...(missing && index + 1 === saved ? { tenant_id: foreignTenant } : {}),
      }),
    ),
    academic_programs: Array.from({ length: 600 }, (_, index) =>
      row(index + 1),
    ),
  };
  const calls: {
    table: string;
    tenant?: string;
    limit?: number;
    ids?: string[];
  }[] = [];
  // Typed query double: apply tenant filters before limits, exactly as the server query does.
  const from = vi.fn((table: string) => {
    const call: (typeof calls)[number] = { table };
    calls.push(call);
    const query = {
      select: () => query,
      eq: (column: string, value: string) => {
        if (column === "tenant_id") call.tenant = value;
        return query;
      },
      order: () => query,
      limit: (limit: number) => {
        call.limit = limit;
        return query;
      },
      in: (column: string, ids: string[]) => {
        expect(column).toBe("id");
        call.ids = ids;
        return query;
      },
      returns: <T,>() => {
        let data = (records[table] ?? []).filter(
          (r) =>
            r.tenant_id === call.tenant &&
            (!call.ids || call.ids.includes(r.id)),
        );
        if (call.limit) data = data.slice(0, call.limit);
        return Promise.resolve({ data: data as unknown as T, error: null });
      },
    };
    return query;
  });
  return {
    selected,
    calls,
    from,
    client: { from } as unknown as SupabaseClient,
  };
}
it.each(["fr", "en"] as const)(
  "preserves saved class and program outside the 500-option window during an unrelated %s edit",
  async (locale) => {
    const f = fixture();
    const options = await loadReferenceOptions(
      f.client,
      tenant,
      kinds,
      fields,
      f.selected,
    );
    expect(options.classes).toHaveLength(501);
    expect(options.programs).toHaveLength(501);
    expect(options.classes?.some((r) => r.id === id(501))).toBe(true);
    expect(
      f.calls.filter((call) => call.limit).every((call) => call.limit === 500),
    ).toBe(true);
    expect(
      f.calls
        .filter((call) => call.ids)
        .every((call) => call.tenant === tenant && call.ids?.length === 1),
    ).toBe(true);
    const view = render(
      <SchoolForm
        kind="enrollments"
        locale={locale}
        tenantId={tenant}
        row={f.selected}
        references={options}
      />,
    );
    const form = view.container.querySelector("form")!;
    fireEvent.change(form.querySelector('[name="status"]')!, {
      target: { value: "active" },
    });
    const data = Object.fromEntries(new FormData(form));
    const parsed = enrollmentSchema.parse(
      Object.fromEntries(fields.map((field) => [field.name, data[field.name]])),
    );
    expect(parsed).toMatchObject({
      status: "active",
      class_id: id(501),
      program_id: id(501),
    });
  },
);
it("keeps references inside the suggestion window without an extra lookup", async () => {
  const f = fixture(20);
  const options = await loadReferenceOptions(
    f.client,
    tenant,
    kinds,
    fields,
    f.selected,
  );
  expect(options.classes).toHaveLength(500);
  expect(options.classes?.some((r) => r.id === id(20))).toBe(true);
  expect(f.calls.some((call) => call.ids)).toBe(false);
});
it("fails closed when the saved reference belongs to another tenant", async () => {
  const f = fixture(501, true);
  await expect(
    loadReferenceOptions(f.client, tenant, kinds, fields, f.selected),
  ).rejects.toThrow("reference_unavailable");
  expect(f.calls.every((call) => call.tenant === tenant)).toBe(true);
});
it("rejects a foreign selected record before querying reference options", async () => {
  const f = fixture();
  await expect(
    loadReferenceOptions(f.client, tenant, kinds, fields, {
      ...f.selected,
      tenant_id: foreignTenant,
    }),
  ).rejects.toThrow("invalid_reference");
  expect(f.from).not.toHaveBeenCalled();
});
it.each(["fr", "en"] as const)(
  "clears an optional class only after an explicit %s selection",
  async (locale) => {
    const f = fixture();
    const options = await loadReferenceOptions(
      f.client,
      tenant,
      kinds,
      fields,
      f.selected,
    );
    const view = render(
      <SchoolForm
        kind="enrollments"
        locale={locale}
        tenantId={tenant}
        row={f.selected}
        references={options}
      />,
    );
    const form = view.container.querySelector("form")!;
    const field = form.querySelector('[name="class_id"]')!;
    expect(new FormData(form).get("class_id")).toBe(id(501));
    fireEvent.change(field, { target: { value: "" } });
    const data = Object.fromEntries(new FormData(form));
    const parsed = enrollmentSchema.parse(
      Object.fromEntries(fields.map((f) => [f.name, data[f.name]])),
    );
    expect(parsed.class_id).toBeNull();
    expect(parsed.program_id).toBe(id(501));
  },
);
