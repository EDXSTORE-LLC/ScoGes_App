"use client";
import { useActionState, useState } from "react";
import {
  previewImportAction,
  commitImportAction,
  type ImportState,
} from "./actions";
import { importKinds, templateHeaders, type ImportKind } from "./templates";
import { schoolText, entityText, fieldText } from "@/modules/school/messages";
import { fieldKeys, type FieldKey } from "@/modules/school/registry";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/types/foundation";
const initial: ImportState = { ok: false };
export function ImportForm({
  locale,
  tenantId,
  canCommit,
  policy,
}: {
  locale: Locale;
  tenantId: string;
  canCommit: boolean;
  policy: string;
}) {
  const [kind, setKind] = useState<ImportKind>("students");
  const [preview, previewAction, previewPending] = useActionState(
    previewImportAction,
    initial,
  );
  const pending = previewPending;
  return (
    <section className="grid gap-5">
      <p>{policy}</p>
      <form
        className="grid gap-4 rounded border p-4"
        action={previewAction}
        onReset={(event) => event.preventDefault()}
      >
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="contextTenantId" value={tenantId} />
        <label className="grid gap-1">
          {schoolText(locale, "kind")}
          <select
            className="min-h-11 rounded border px-2"
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as ImportKind)}
          >
            {importKinds.map((k) => (
              <option key={k} value={k}>
                {entityText(locale, k)}
              </option>
            ))}
          </select>
        </label>
        <p className="break-words text-sm">
          <strong>{schoolText(locale, "template")}: </strong>
          {templateHeaders(kind).join(", ")}
        </p>
        <label className="grid gap-1">
          {schoolText(locale, "file")}
          <input
            type="file"
            name="file"
            accept=".csv,.xlsx"
            required
            disabled={pending || previewPending}
          />
        </label>
        <Button disabled={pending || previewPending} type="submit">
          {schoolText(locale, "preview")}
        </Button>
        <p role="status">{preview.message}</p>
      </form>
      <ImportResults
        key={preview.token ?? "no-preview"}
        preview={preview}
        locale={locale}
        tenantId={tenantId}
        canCommit={canCommit}
      />
    </section>
  );
}

function ImportResults({
  preview,
  locale,
  tenantId,
  canCommit,
}: {
  preview: ImportState;
  locale: Locale;
  tenantId: string;
  canCommit: boolean;
}) {
  const [commit, commitAction, commitPending] = useActionState(
    commitImportAction,
    initial,
  );
  const rows = commit.rows ?? preview.rows;
  return (
    <section className="grid gap-4">
      {preview.token && canCommit && !commit.ok && (
        <form action={commitAction} className="grid gap-3">
          <input type="hidden" name="locale" value={locale} />
          <input type="hidden" name="contextTenantId" value={tenantId} />
          <input type="hidden" name="token" value={preview.token} />
          <label className="flex gap-2">
            <input type="checkbox" name="confirm" value="true" required />
            {schoolText(locale, "commit")}
          </label>
          <Button disabled={commitPending} type="submit">
            {schoolText(locale, "commit")}
          </Button>
        </form>
      )}
      <p role="status">{commit.message}</p>
      {rows && (
        <section>
          <h2 className="text-xl font-semibold">
            {schoolText(locale, "summary")}
          </h2>
          <p>
            {rows.length} · {schoolText(locale, "ready")}:{" "}
            {rows.filter((r) => r.result === "ready").length} ·{" "}
            {schoolText(locale, "inserted")}:{" "}
            {rows.filter((r) => r.result === "inserted").length} ·{" "}
            {schoolText(locale, "duplicate")}:{" "}
            {rows.filter((r) => r.result === "duplicate").length} ·{" "}
            {schoolText(locale, "invalidRow")}:{" "}
            {rows.filter((r) => r.result === "invalidRow").length}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th>{schoolText(locale, "row")}</th>
                  <th>{schoolText(locale, "result")}</th>
                  <th>{schoolText(locale, "preview")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.line} className="border-t">
                    <td className="p-2">{row.line}</td>
                    <td className="p-2">
                      {schoolText(
                        locale,
                        row.result as
                          "ready" | "inserted" | "duplicate" | "invalidRow",
                      )}
                      {row.problems?.length ? (
                        <ul>
                          {row.problems.map((name) => (
                            <li key={name}>
                              {fieldKeys.includes(name as FieldKey)
                                ? fieldText(locale, name as FieldKey)
                                : name}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </td>
                    <td className="p-2">
                      <dl className="grid gap-1">
                        {Object.entries(row.data ?? {}).map(([key, value]) => (
                          <div key={key}>
                            <dt className="inline font-medium">
                              {fieldKeys.includes(key as FieldKey)
                                ? fieldText(locale, key as FieldKey)
                                : key}
                              :{" "}
                            </dt>
                            <dd className="inline">{String(value ?? "")}</dd>
                          </div>
                        ))}
                      </dl>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
}
