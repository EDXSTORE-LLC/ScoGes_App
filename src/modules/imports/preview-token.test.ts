import { it, expect } from "vitest";
import { sealPreview, openPreview, type ImportPreview } from "./preview-token";
import { importLimits } from "./limits";
const key = "a".repeat(64),
  actor = "10000000-0000-4000-8000-000000000001",
  tenant = "20000000-0000-4000-8000-000000000001";
const data: ImportPreview = {
  version: 1,
  batchId: "30000000-0000-4000-8000-000000000001",
  actorId: actor,
  tenantId: tenant,
  kind: "students",
  expiresAt: 2000,
  rows: [
    {
      line: 2,
      data: { code: "s1", first_name: "Private", last_name: "Example" },
    },
  ],
  errors: [],
};
it("seals private values and binds preview to actor, tenant and expiry", () => {
  const token = sealPreview(data, key);
  expect(token).not.toContain("Private");
  expect(openPreview(token, actor, tenant, 1999, key)).toEqual(data);
  for (const [a, t, n] of [
    [tenant, tenant, 1999],
    [actor, actor, 1999],
    [actor, tenant, 2000],
  ] as const)
    expect(() => openPreview(token, a, t, n, key)).toThrow(
      "invalid_import_preview",
    );
  expect(() =>
    openPreview(token.slice(0, -8) + "aaaaaaaa", actor, tenant, 1000, key),
  ).toThrow("invalid_import_preview");
  expect(() => openPreview(token, actor, tenant, 1000, "b".repeat(64))).toThrow(
    "invalid_import_preview",
  );
});
it("requires a separate valid key and rejects invalid policy limits", () => {
  expect(() => sealPreview(data, "bad")).toThrow("import_preview_unavailable");
  expect(importLimits({})).toMatchObject({
    maxBytes: 2097152,
    maxRows: 500,
    previewSeconds: 900,
  });
  expect(importLimits({ IMPORT_MAX_ROWS: "12" }).maxRows).toBe(12);
  for (const v of ["0", "-1", "501", "NaN"])
    expect(() => importLimits({ IMPORT_MAX_ROWS: v })).toThrow(
      "invalid_import_configuration",
    );
});
