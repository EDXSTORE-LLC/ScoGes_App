"use client";
import { useActionState } from "react";
import { saveSchoolAction } from "./actions";
import {
  schoolEntities,
  rowTitle,
  type SchoolKind,
  type SchoolRow,
} from "./registry";
import {
  schoolText,
  fieldText,
  statusText,
  type SchoolState,
} from "./messages";
import type { Locale } from "@/types/foundation";
import { Button } from "@/components/ui/button";
export function SchoolForm({
  kind,
  locale,
  tenantId,
  row,
  references,
  defaultLanguage = "fr",
}: {
  kind: SchoolKind;
  locale: Locale;
  tenantId: string;
  row?: SchoolRow;
  references: Partial<Record<SchoolKind, SchoolRow[]>>;
  defaultLanguage?: Locale;
}) {
  const [state, action, actionPending] = useActionState(saveSchoolAction, {
    ok: false,
  } as SchoolState);
  const pending = actionPending;
  return (
    <form
      className="grid gap-4 rounded-lg border p-4"
      action={action}
      onReset={(event) => event.preventDefault()}
    >
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="contextTenantId" value={tenantId} />
      <input type="hidden" name="id" value={row?.id ?? ""} />
      <input type="hidden" name="revision" value={row?.revision ?? ""} />
      <fieldset
        key={row?.revision ?? 0}
        disabled={pending}
        className="grid min-w-0 gap-4 sm:grid-cols-2"
      >
        <legend className="mb-3 font-semibold">
          {schoolText(locale, row ? "edit" : "create")}
        </legend>
        {schoolEntities[kind].fields.map((field) => {
          const value =
            row?.[field.name] ??
            (field.name === "preferred_language" ? defaultLanguage : undefined);
          const label = fieldText(locale, field.name);
          const error = state.fields?.includes(field.name);
          const id = `school-${field.name}`;
          return (
            <div key={field.name} className="grid gap-2">
              <label className="grid gap-1 text-sm">
                <span>
                  {label}
                  {field.required ? " *" : ""}
                </span>
                {field.reference || field.options ? (
                  <select
                    id={id}
                    aria-label={label}
                    name={field.name}
                    required={field.reference ? false : field.required}
                    defaultValue={String(value ?? field.options?.[0] ?? "")}
                    aria-invalid={error || undefined}
                    className="min-h-11 w-full rounded border bg-white px-2"
                  >
                    {field.reference && (
                      <option value="">{schoolText(locale, "none")}</option>
                    )}
                    {field.reference
                      ? (references[field.reference] ?? []).map((option) => (
                          <option value={option.id} key={option.id}>
                            {rowTitle(option)}
                            {option.year_id
                              ? ` (${rowTitle((references.years ?? []).find((y) => y.id === option.year_id) ?? option)})`
                              : ""}
                          </option>
                        ))
                      : field.options?.map((option) => (
                          <option key={option} value={option}>
                            {statusText(locale, option)}
                          </option>
                        ))}
                  </select>
                ) : (
                  <input
                    id={id}
                    aria-label={label}
                    type={field.type ?? "text"}
                    name={field.name}
                    value={field.type === "checkbox" ? "true" : undefined}
                    defaultChecked={
                      field.type === "checkbox" ? Boolean(value) : undefined
                    }
                    defaultValue={
                      field.type !== "checkbox"
                        ? String(
                            value ??
                              (field.name === "contact_priority" ? 1 : ""),
                          )
                        : undefined
                    }
                    required={field.required}
                    readOnly={field.name === "code" && Boolean(row)}
                    maxLength={
                      field.name === "code"
                        ? 40
                        : field.name === "email"
                          ? 254
                          : 160
                    }
                    min={field.type === "number" ? 1 : undefined}
                    max={field.type === "number" ? 1000 : undefined}
                    aria-invalid={error || undefined}
                    className={
                      field.type === "checkbox"
                        ? "size-5"
                        : "min-h-11 w-full rounded border px-2"
                    }
                  />
                )}
              </label>
              {field.reference && (
                <label className="grid gap-1 text-sm">
                  {label} — {fieldText(locale, "code")}
                  <input
                    name={`${field.name}_code_override`}
                    maxLength={40}
                    className="min-h-11 rounded border px-2"
                  />
                </label>
              )}
            </div>
          );
        })}
      </fieldset>
      <p className="text-sm text-slate-600">
        {schoolText(locale, "archiveHint")}
      </p>
      <Button type="submit" disabled={pending}>
        {schoolText(locale, "save")}
      </Button>
      <p role="status" aria-live="polite">
        {state.message}
      </p>
    </form>
  );
}
