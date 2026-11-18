import { beforeEach, expect, it, vi } from "vitest";
const { createClient, rpc } = vi.hoisted(() => ({
  createClient: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient }));
import { createInvitationDeliveryRecorder } from "./invitation-delivery";

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_test");
  createClient.mockReturnValue({ rpc });
});

it("creates an isolated server client and sends only bookkeeping fields", async () => {
  rpc.mockResolvedValue({ error: null });
  const record = createInvitationDeliveryRecorder();
  expect(await record?.("id", "digest", false)).toBe(true);
  expect(createClient).toHaveBeenCalledWith(
    "https://test.supabase.co",
    "sb_secret_test",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
  expect(rpc).toHaveBeenCalledWith("record_invitation_delivery", {
    invitation_id: "id",
    token_digest: "digest",
    delivered: false,
  });
});

it.each(["", "sb_publishable_wrong"])(
  "fails closed on unusable secret configuration",
  (secret) => {
    vi.stubEnv("SUPABASE_SECRET_KEY", secret);
    expect(createInvitationDeliveryRecorder()).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  },
);

it("propagates a safe failure result for database refusal", async () => {
  rpc.mockResolvedValue({ error: { code: "42501" } });
  expect(await createInvitationDeliveryRecorder()?.("id", "digest", true)).toBe(
    false,
  );
});
