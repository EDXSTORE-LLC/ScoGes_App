import { beforeEach, it, expect, vi } from "vitest";
const { context, rpc, prepareRows } = vi.hoisted(() => ({
  context: vi.fn(),
  rpc: vi.fn(),
  prepareRows: vi.fn(),
}));
vi.mock("@/modules/school/context", () => ({ schoolContext: context }));
vi.mock("@/lib/security/request-limit", () => ({
  requestLimit: vi.fn(async () => "allowed"),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("./prepare", async (original) => ({
  ...(await original<typeof import("./prepare")>()),
  prepareRows,
}));
import { previewImportAction, commitImportAction } from "./actions";
import { sealPreview } from "./preview-token";
const tenant = "10000000-0000-4000-8000-000000000001",
  actor = "20000000-0000-4000-8000-000000000001";
function form() {
  const f = new FormData();
  f.set("contextTenantId", tenant);
  f.set("kind", "students");
  f.set(
    "file",
    new File(["code,first_name,last_name\ns1,A,B"], "students.csv", {
      type: "text/csv",
    }),
  );
  return f;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("IMPORT_PREVIEW_SECRET", "a".repeat(64));
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn(async () => ({
      data: { default_locale: "fr" },
      error: null,
    })),
  };
  context.mockResolvedValue({
    user: { id: actor },
    membership: { tenantId: tenant },
    client: { rpc, from: () => query },
  });
  prepareRows.mockResolvedValue([
    {
      line: 2,
      result: "ready",
      data: {
        code: "s1",
        first_name: "A",
        last_name: "B",
        status: "active",
        preferred_language: "fr",
        email: null,
        phone: null,
        birth_date: null,
      },
    },
  ]);
});
it("dry-run issues only a sealed preview and makes no write RPC", async () => {
  const result = await previewImportAction({ ok: false }, form());
  expect(result.ok).toBe(true);
  expect(result.token).toBeTruthy();
  expect(rpc).not.toHaveBeenCalled();
});
it("a revoked permission or missing confirmation prevents commit", async () => {
  const f = form();
  expect((await commitImportAction({ ok: false }, f)).ok).toBe(false);
  f.set("confirm", "true");
  context.mockResolvedValue(null);
  expect((await commitImportAction({ ok: false }, f)).ok).toBe(false);
  expect(rpc).not.toHaveBeenCalled();
});
it("cross-actor previews cannot reach the commit RPC", async () => {
  const token = sealPreview({
    version: 1,
    batchId: tenant,
    actorId: tenant,
    tenantId: tenant,
    kind: "students",
    expiresAt: Date.now() + 60000,
    rows: [{ line: 2, data: { code: "s1", first_name: "A", last_name: "B" } }],
    errors: [],
  });
  const f = form();
  f.set("token", token);
  f.set("confirm", "true");
  expect((await commitImportAction({ ok: false }, f)).ok).toBe(false);
  expect(rpc).not.toHaveBeenCalled();
});
it("malformed CSV never becomes a preview or commit", async () => {
  const f = form();
  f.set("file", new File(['code\n"unterminated'], "bad.csv"));
  expect((await previewImportAction({ ok: false }, f)).ok).toBe(false);
  expect(prepareRows).not.toHaveBeenCalled();
  expect(rpc).not.toHaveBeenCalled();
});
