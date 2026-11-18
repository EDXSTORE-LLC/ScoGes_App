-- Bounded Sprint 0 remediation. Apply transactionally; no data/history reset.
-- See docs/SECURITY_ADVISOR_2026-11-18.md for per-function dispositions.
alter default privileges for role postgres in schema public
  revoke execute on functions from anon, authenticated;
-- Global implicit PUBLIC defaults remain; each application function revokes explicitly.

-- Hosted infrastructure helper is absent on some fresh local stacks.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated, service_role';
  end if;
end;
$$;

alter function public.current_user_has_permission(uuid,text) set search_path = '';
-- Delegation requires no extra privilege over the already-guarded issuance RPC.
alter function public.invite_tenant_member(uuid,text,text,uuid) security invoker;

create or replace function public.create_tenant_with_admin(
  tenant_name text,
  tenant_slug text,
  tenant_country text,
  tenant_base_currency text,
  tenant_timezone text,
  tenant_default_locale text,
  actor_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_tenant_id uuid;
  new_membership_id uuid;
  admin_role_id uuid;
  actor_email text;
  actor uuid := auth.uid();
begin
  if actor is null or actor_user_id is distinct from actor then
    raise exception 'actor mismatch';
  end if;

  select email into actor_email from auth.users where id = actor;

  if actor_email is null then
    raise exception 'actor not found';
  end if;

  insert into public.profiles (id, email, preferred_locale)
  values (actor, actor_email, tenant_default_locale)
  on conflict (id) do update set email = excluded.email;

  insert into public.tenants (name, slug, created_by)
  values (tenant_name, tenant_slug, actor)
  returning id into new_tenant_id;

  insert into public.tenant_settings (tenant_id, country, base_currency, timezone, default_locale)
  values (new_tenant_id, tenant_country, tenant_base_currency, tenant_timezone, tenant_default_locale);

  insert into public.memberships (tenant_id, user_id, status, created_by)
  values (new_tenant_id, actor, 'active', actor)
  returning id into new_membership_id;

  select id into admin_role_id from public.roles where key = 'tenant_admin';

  insert into public.membership_roles (membership_id, role_id, assigned_by)
  values (new_membership_id, admin_role_id, actor);

  insert into public.audit_events (tenant_id, actor_user_id, action, target_type, target_id, metadata)
  values (
    new_tenant_id,
    actor,
    'tenant.created',
    'tenant',
    new_tenant_id,
    jsonb_build_object('slug', tenant_slug)
  );

  return new_tenant_id;
end;
$$;


-- Trusted SMTP bookkeeping; ordinary authenticated clients cannot forge this state.
-- service_role already has protected-table rights; SECURITY DEFINER is unnecessary.
create or replace function public.record_invitation_delivery(invitation_id uuid, token_digest text, delivered boolean)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  target_tenant uuid;
  actor uuid;
begin
  if current_user <> 'service_role' or auth.jwt()->>'role' is distinct from 'service_role'
      or delivered is null then
    raise exception 'delivery update denied';
  end if;
  select i.tenant_id into target_tenant from public.invitations i
    where i.id=invitation_id and i.token_hash=token_digest and i.status='pending'
      and i.expires_at>now() for update;
  if target_tenant is null then raise exception 'delivery update denied'; end if;
  perform 1 from public.tenants where id=target_tenant and status='active' for update;
  if not found then raise exception 'delivery update denied'; end if;
  select i.created_by into actor from public.invitations i
    where i.id=invitation_id and i.tenant_id=target_tenant and i.token_hash=token_digest
      and i.status='pending' and i.expires_at>now() for update;
  if actor is null or not exists (
    select m.id from public.memberships m
    join public.membership_roles mr on mr.membership_id=m.id
    join public.role_permissions rp on rp.role_id=mr.role_id
    join public.permissions p on p.id=rp.permission_id
    where m.tenant_id=target_tenant and m.user_id=actor and m.status='active'
      and p.key in ('users.invite','users.manage_roles')
    group by m.id having count(distinct p.key)=2
  ) then raise exception 'delivery update denied'; end if;
  update public.invitations set delivery_status=case when delivered then 'sent' else 'failed' end
    where id=invitation_id;
  insert into public.audit_events(tenant_id,actor_user_id,action,target_type,target_id)
    values(target_tenant,actor,case when delivered then 'member.invitation_sent'
      else 'member.invitation_delivery_failed' end,'invitation',invitation_id);
end;
$$;

create or replace function app_private.enforce_rpc_write_quota()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  policy record;
  actor uuid := auth.uid();
  stamps timestamptz[];
  moment timestamptz;
begin
  select * into policy from app_private.rpc_write_policy(new.action);
  if not found then return new; end if;
  -- Service delivery records the invitation's creator, not the service identity.
  -- Only this scope may use trusted service attribution; user RPC guards stay unchanged.
  if policy.scope = 'invitation_delivery'
      and auth.jwt()->>'role' = 'service_role' then
    actor := new.actor_user_id;
  end if;
  if actor is null or new.actor_user_id is distinct from actor then
    raise exception 'rpc_quota_identity_denied' using errcode = '42501';
  end if;

  insert into app_private.rpc_write_windows(actor_id,scope)
    values(actor,policy.scope) on conflict do nothing;
  select occurred_at into stamps from app_private.rpc_write_windows
    where actor_id=actor and scope=policy.scope for update;
  if not found then raise exception 'rpc_quota_unavailable'; end if;
  -- Take the time after the row lock. Backward clock movement cannot reset a window.
  select greatest(clock_timestamp(),max(s)) into moment from unnest(stamps) as s;
  select coalesce(array_agg(s order by s),'{}'::timestamptz[]) into stamps
    from unnest(stamps) as s
    where s > moment - make_interval(secs => policy.window_seconds);
  if cardinality(stamps) >= policy.max_writes then
    -- PostgREST maps PT429 to HTTP 429, without automatic serialization retries.
    raise sqlstate 'PT429' using message = 'rpc_rate_limited';
  end if;
  update app_private.rpc_write_windows set occurred_at=array_append(stamps,moment)
    where actor_id=actor and scope=policy.scope;
  return new;
end;
$$;

-- Explicit minimal ACLs, including inherited PUBLIC and Supabase role defaults.
revoke all on function public.create_tenant_with_admin(text,text,text,text,text,text,uuid) from public, anon, authenticated, service_role;
grant execute on function public.create_tenant_with_admin(text,text,text,text,text,text,uuid) to authenticated;
revoke all on function public.current_user_has_permission(uuid,text) from public, anon, authenticated, service_role;
grant execute on function public.current_user_has_permission(uuid,text) to authenticated;
revoke all on function public.invite_tenant_member(uuid,text,text,uuid) from public, anon, authenticated, service_role;
grant execute on function public.invite_tenant_member(uuid,text,text,uuid) to authenticated;
revoke all on function public.accept_tenant_invitation(text) from public, anon, authenticated, service_role;
grant execute on function public.accept_tenant_invitation(text) to authenticated;
revoke all on function public.administer_tenant_membership(uuid,uuid,timestamptz,text[],text) from public, anon, authenticated, service_role;
grant execute on function public.administer_tenant_membership(uuid,uuid,timestamptz,text[],text) to authenticated;
revoke all on function public.issue_tenant_invitation(uuid,text,text) from public, anon, authenticated, service_role;
grant execute on function public.issue_tenant_invitation(uuid,text,text) to authenticated;
revoke all on function public.update_tenant_settings(uuid,timestamptz,text,text,text,text) from public, anon, authenticated, service_role;
grant execute on function public.update_tenant_settings(uuid,timestamptz,text,text,text,text) to authenticated;
revoke all on function public.record_invitation_delivery(uuid,text,boolean) from public, anon, authenticated, service_role;
grant execute on function public.record_invitation_delivery(uuid,text,boolean) to service_role;
