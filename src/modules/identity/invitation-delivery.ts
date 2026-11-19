import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseBrowserConfig } from "@/lib/supabase/config";

// Narrow infrastructure client: never attach user cookies or export a Server Action.
// Its arguments come only from the issued RPC result and actual SMTP outcome.
export function createInvitationDeliveryRecorder() {
  const config = getSupabaseBrowserConfig();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!config || !secret?.startsWith("sb_secret_")) return null;
  const client = createClient(config.url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return async (
    invitationId: string,
    tokenDigest: string,
    delivered: boolean,
  ) => {
    const { error } = await client.rpc("record_invitation_delivery", {
      invitation_id: invitationId,
      token_digest: tokenDigest,
      delivered,
    });
    return !error;
  };
}
