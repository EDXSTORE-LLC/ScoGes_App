import { beforeEach, it, expect, vi } from "vitest";
const { context, rpc } = vi.hoisted(() => ({ context: vi.fn(), rpc: vi.fn() }));
vi.mock("./context", () => ({ schoolContext: context }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/security/request-limit", () => ({
  requestLimit: vi.fn(async () => "allowed"),
}));
import { saveSchoolAction } from "./actions";
const tenant = "10000000-0000-4000-8000-000000000001";
function form(extra: Record<string, string> = {}) {
  const f = new FormData();
  for (const [k, v] of Object.entries({
    kind: "students",
    contextTenantId: tenant,
    id: "",
    revision: "",
    code: "s1",
    first_name: "A",
    last_name: "B",
    status: "active",
    preferred_language: "fr",
    ...extra,
  }))
    f.set(k, v);
  return f;
}
beforeEach(() => {
  vi.clearAllMocks();
  context.mockResolvedValue({
    user: { id: tenant },
    membership: { tenantId: tenant },
    client: { rpc },
  });
  rpc.mockResolvedValue({ data: tenant, error: null });
});
it("denies a write when the current active tenant context is not authorized", async () => {
  context.mockResolvedValue(null);
  expect((await saveSchoolAction({ ok: false }, form())).ok).toBe(false);
  expect(rpc).not.toHaveBeenCalled();
});
it("rejects malformed data before a database write", async () => {
  expect(
    (await saveSchoolAction({ ok: false }, form({ first_name: "" }))).ok,
  ).toBe(false);
  expect(rpc).not.toHaveBeenCalled();
});
it("derives the target tenant from the server context and never forwards actor fields", async () => {
  expect(
    (
      await saveSchoolAction(
        { ok: false },
        form({ actor_id: tenant, tenant_id: tenant }),
      )
    ).ok,
  ).toBe(true);
  expect(context).toHaveBeenCalledWith("students.write", tenant);
  expect(rpc).toHaveBeenCalledWith(
    "save_school_record",
    expect.objectContaining({
      target_tenant_id: tenant,
      record_id: null,
      expected_revision: null,
      record_data: expect.not.objectContaining({ actor_id: tenant }),
    }),
  );
});
it("returns a safe stale-write message rather than database diagnostics", async () => {
  rpc.mockResolvedValue({ error: { message: "stale_write" } });
  const result = await saveSchoolAction({ ok: false }, form());
  expect(result.ok).toBe(false);
  expect(result.message).toContain("Rechargez");
});
