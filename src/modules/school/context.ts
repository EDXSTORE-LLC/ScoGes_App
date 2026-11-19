import "server-only";
import { getActiveMembership, requireCurrentUser } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { hasPermission } from "@/modules/identity/permissions";
import type { Permission } from "@/types/foundation";
export async function schoolContext(
  permission: Permission,
  expectedTenant?: string,
) {
  const user = await requireCurrentUser();
  const membership = await getActiveMembership(user.id);
  if (
    !membership ||
    membership.userId !== user.id ||
    membership.status !== "active" ||
    (expectedTenant && membership.tenantId !== expectedTenant) ||
    !hasPermission(membership.roles, permission)
  )
    return null;
  const client = await createSupabaseServerClient();
  if (!client) return null;
  const { data, error } = await client.rpc("current_user_has_permission", {
    target_tenant_id: membership.tenantId,
    permission_key: permission,
  });
  if (error || data !== true) return null;
  return { user, membership, client };
}
