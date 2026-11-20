-- Run after existing rolled-back tenant/invitation/admin suites; no retained fixtures.
reset role;
do $$
declare f record; exposed text[] := array[
  'create_tenant_with_admin','current_user_has_permission','accept_tenant_invitation',
  'administer_tenant_membership','issue_tenant_invitation','update_tenant_settings',
  -- Sprint 1 gateways: explicit per-entity permissions, locked active tenant,
  -- static field allowlists, immutable identities, revisions and atomic audit.
  'save_school_record','commit_school_import'];
begin
  for f in select p.oid,p.proname,p.prosecdef,p.proconfig from pg_proc p
      where p.pronamespace='public'::regnamespace and p.prosecdef loop
    if has_function_privilege('anon',f.oid,'execute') then
      raise exception 'anonymous definer execution remains'; end if;
    if has_function_privilege('authenticated',f.oid,'execute') then
      if not f.proname=any(exposed) or not 'search_path=""'=any(f.proconfig) then
        raise exception 'unreviewed authenticated definer exposure'; end if;
    end if;
  end loop;
  if has_function_privilege('authenticated','public.record_invitation_delivery(uuid,text,boolean)','execute')
    or has_function_privilege('anon','public.record_invitation_delivery(uuid,text,boolean)','execute')
    or not has_function_privilege('service_role','public.record_invitation_delivery(uuid,text,boolean)','execute') then
    raise exception 'delivery ACL incorrect'; end if;
  if exists(select 1 from pg_proc where pronamespace='public'::regnamespace
      and proname in ('invite_tenant_member','record_invitation_delivery') and prosecdef) then
    raise exception 'unnecessary definer retained'; end if;
  if to_regprocedure('public.rls_auto_enable()') is not null and (
    has_function_privilege('anon','public.rls_auto_enable()','execute') or
    has_function_privilege('authenticated','public.rls_auto_enable()','execute') or
    has_function_privilege('service_role','public.rls_auto_enable()','execute')) then
    raise exception 'infrastructure ACL incorrect'; end if;
end;
$$;

create function pg_temp.security_reject(statement text, expected_code text, expected_message text default null)
returns void language plpgsql as $$
begin
  begin execute statement;
  exception when others then
    if sqlstate=expected_code and (expected_message is null or sqlerrm=expected_message) then return; end if;
    raise exception 'unexpected security rejection';
  end;
  raise exception 'security operation unexpectedly succeeded';
end;
$$;

set local role anon;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{}',true);
select pg_temp.security_reject('select public.create_tenant_with_admin(''Denied'',''denied'',''TG'',''XOF'',''UTC'',''fr'',null)','42501');
select pg_temp.security_reject('select public.current_user_has_permission(gen_random_uuid(),''users.invite'')','42501');
select pg_temp.security_reject('select public.invite_tenant_member(gen_random_uuid(),''denied@example.invalid'',''cashier'',null)','42501');
select pg_temp.security_reject('select public.record_invitation_delivery(gen_random_uuid(),''digest'',true)','42501');
reset role;

-- Actor spoofing and NULL identity must fail inside the retained onboarding API.
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.user_a'),true);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('test.user_a'),'role','authenticated')::text,true);
select pg_temp.security_reject('select public.create_tenant_with_admin(''Denied'',''denied'',''TG'',''XOF'',''UTC'',''fr'',null)','P0001','actor mismatch');
select pg_temp.security_reject(format('select public.create_tenant_with_admin(''Denied'',''denied'',''TG'',''XOF'',''UTC'',''fr'',%L)',current_setting('test.user_b')),'P0001','actor mismatch');
select pg_temp.security_reject('select public.record_invitation_delivery(gen_random_uuid(),''digest'',true)','42501');
do $$
declare tenant uuid;
begin
  tenant:=public.create_tenant_with_admin('Security onboarding','test-'||gen_random_uuid(),'TG','XOF','UTC','fr',auth.uid());
  perform set_config('security_test.created_tenant',tenant::text,true);
  if not public.current_user_has_permission(tenant,'users.manage_roles') then
    raise exception 'onboarding admin missing'; end if;
  if public.current_user_has_permission(current_setting('test.tenant_b')::uuid,'users.manage_roles') then
    raise exception 'onboarding crossed tenant'; end if;
end;
$$;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"authenticated"}',true);
select pg_temp.security_reject(format('select public.create_tenant_with_admin(''Denied'',''denied'',''TG'',''XOF'',''UTC'',''fr'',%L)',current_setting('test.user_a')),'P0001','actor mismatch');
reset role;
do $$
begin
  if not exists(select 1 from public.audit_events where tenant_id=current_setting('security_test.created_tenant')::uuid
      and actor_user_id=current_setting('test.user_a')::uuid and action='tenant.created') then
    raise exception 'authoritative onboarding audit missing'; end if;
end;
$$;

-- Service-only delivery validates the current digest and creator authority.
set local role service_role;
select set_config('request.jwt.claim.sub','',true);
select set_config('request.jwt.claims','{"role":"service_role"}',true);
select pg_temp.security_reject(format('select public.record_invitation_delivery(%L,''wrong-digest'',true)',current_setting('test.reissued_id')),'P0001','delivery update denied');
select public.record_invitation_delivery(current_setting('test.reissued_id')::uuid,
  encode(sha256(convert_to(current_setting('test.new_token'),'UTF8')),'hex'),true);
reset role;
do $$
begin
  if not exists(select 1 from public.audit_events where target_id=current_setting('test.reissued_id')::uuid
      and action='member.invitation_sent' and actor_user_id=current_setting('test.user_a')::uuid) then
    raise exception 'service delivery lost creator attribution'; end if;
end;
$$;
-- Saturated delivery quota must roll back state and audit together for the service path.
update app_private.rpc_write_windows set occurred_at=array_fill(clock_timestamp(),array[40])
  where actor_id=current_setting('test.user_a')::uuid and scope='invitation_delivery';
set local role service_role;
select pg_temp.security_reject(format('select public.record_invitation_delivery(%L,encode(sha256(convert_to(current_setting(''test.new_token''),''UTF8'')),''hex''),false)',current_setting('test.reissued_id')),'PT429','rpc_rate_limited');
reset role;
do $$
begin
  if (select delivery_status from public.invitations where id=current_setting('test.reissued_id')::uuid)<>'sent'
      or exists(select 1 from public.audit_events where target_id=current_setting('test.reissued_id')::uuid
        and action='member.invitation_delivery_failed') then
    raise exception 'rejected service delivery left partial writes'; end if;
end;
$$;
update app_private.rpc_write_windows set occurred_at='{}'
  where actor_id=current_setting('test.user_a')::uuid and scope='invitation_delivery';
update public.memberships set status='revoked' where id=current_setting('test.membership_a')::uuid;
set local role service_role;
select pg_temp.security_reject(format('select public.record_invitation_delivery(%L,encode(sha256(convert_to(current_setting(''test.new_token''),''UTF8'')),''hex''),true)',current_setting('test.reissued_id')),'P0001','delivery update denied');
reset role;
update public.memberships set status='active' where id=current_setting('test.membership_a')::uuid;

-- Even a delegated role manager cannot assign or alter tenant administrators.
-- Permission catalog changes below exist only inside this rolled-back test transaction.
insert into public.role_permissions(role_id,permission_id)
  select r.id,p.id from public.roles r cross join public.permissions p
  where r.key='registrar' and p.key in ('users.invite','users.manage_roles');
select set_config('security_test.delegate',user_id::text,true) from public.memberships
  where id=current_setting('test.membership_c')::uuid;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('security_test.delegate'),true);
select set_config('request.jwt.claims',json_build_object('sub',current_setting('security_test.delegate'),'role','authenticated')::text,true);
select pg_temp.security_reject(format('select public.issue_tenant_invitation(%L,''denied-admin@example.invalid'',''tenant_admin'')',current_setting('test.tenant_a')),'P0001','role assignment denied');
select pg_temp.security_reject(format('select public.administer_tenant_membership(%L,%L,(select updated_at from public.memberships where id=%L),array[''cashier''])',current_setting('test.tenant_a'),current_setting('test.membership_a'),current_setting('test.membership_a')),'P0001','administration_denied');
reset role;
delete from public.role_permissions where role_id=(select id from public.roles where key='registrar')
  and permission_id in (select id from public.permissions where key in ('users.invite','users.manage_roles'));

-- Hosted automatic RLS infrastructure must remain bound and effective after revocation.
do $$
declare probe text := 'security_rls_probe_'||replace(gen_random_uuid()::text,'-','');
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    if not exists(select 1 from pg_event_trigger where evtfoid='public.rls_auto_enable()'::regprocedure
        and evtenabled<>'D') then raise exception 'RLS event binding lost'; end if;
    execute format('create table public.%I (id uuid)',probe);
    if not (select relrowsecurity from pg_class where oid=to_regclass('public.'||probe)) then
      raise exception 'automatic RLS disabled'; end if;
    -- The enclosing rollback removes this synthetic table; no persisted DDL.
  end if;
end;
$$;
