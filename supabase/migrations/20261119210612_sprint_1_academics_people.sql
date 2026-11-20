-- Sprint 1 only. Append-only; no hosted rollout implied.
create table public.academic_years (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, revision bigint not null default 1 check(revision>0), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), unique(tenant_id,id), code text not null check(code ~ '^[a-z0-9][a-z0-9_-]{0,39}$'), name text not null check(char_length(btrim(name)) between 1 and 160), starts_on date not null, ends_on date not null, status text not null default 'planned' check(status in ('planned','active','closed','archived')), check(starts_on<=ends_on), unique(tenant_id,code));
create table public.academic_programs (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, revision bigint not null default 1 check(revision>0), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), unique(tenant_id,id), code text not null check(code ~ '^[a-z0-9][a-z0-9_-]{0,39}$'), name text not null check(char_length(btrim(name)) between 1 and 160), status text not null default 'active' check(status in ('active','archived')), unique(tenant_id,code));
create table public.academic_levels (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, revision bigint not null default 1 check(revision>0), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), unique(tenant_id,id), code text not null check(code ~ '^[a-z0-9][a-z0-9_-]{0,39}$'), name text not null check(char_length(btrim(name)) between 1 and 160), status text not null default 'active' check(status in ('active','archived')), unique(tenant_id,code));
create table public.academic_classes (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, revision bigint not null default 1 check(revision>0), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), unique(tenant_id,id), code text not null check(code ~ '^[a-z0-9][a-z0-9_-]{0,39}$'), name text not null check(char_length(btrim(name)) between 1 and 160), status text not null default 'active' check(status in ('active','archived')), year_id uuid not null, level_id uuid not null, program_id uuid, foreign key(tenant_id,year_id) references public.academic_years(tenant_id,id), foreign key(tenant_id,level_id) references public.academic_levels(tenant_id,id), foreign key(tenant_id,program_id) references public.academic_programs(tenant_id,id), unique(tenant_id,year_id,code));
create table public.academic_terms (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, revision bigint not null default 1 check(revision>0), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), unique(tenant_id,id), code text not null check(code ~ '^[a-z0-9][a-z0-9_-]{0,39}$'), name text not null check(char_length(btrim(name)) between 1 and 160), status text not null default 'active' check(status in ('active','archived')), year_id uuid not null, starts_on date not null, ends_on date not null, check(starts_on<=ends_on), foreign key(tenant_id,year_id) references public.academic_years(tenant_id,id), unique(tenant_id,year_id,code));
create table public.students (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, revision bigint not null default 1 check(revision>0), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), unique(tenant_id,id), code text not null check(code ~ '^[a-z0-9][a-z0-9_-]{0,39}$'), first_name text not null check(char_length(btrim(first_name)) between 1 and 100), last_name text not null check(char_length(btrim(last_name)) between 1 and 100), name text generated always as(first_name||' '||last_name) stored, email text check(email is null or (char_length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')), phone text check(phone is null or char_length(phone) between 3 and 40), preferred_language text not null default 'fr' check(preferred_language in ('fr','en')), status text not null default 'active' check(status in ('active','archived')), unique(tenant_id,code), birth_date date check(birth_date is null or birth_date between date '1900-01-01' and current_date));
create table public.guardians (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, revision bigint not null default 1 check(revision>0), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), unique(tenant_id,id), code text not null check(code ~ '^[a-z0-9][a-z0-9_-]{0,39}$'), first_name text not null check(char_length(btrim(first_name)) between 1 and 100), last_name text not null check(char_length(btrim(last_name)) between 1 and 100), name text generated always as(first_name||' '||last_name) stored, email text check(email is null or (char_length(email)<=254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$')), phone text check(phone is null or char_length(phone) between 3 and 40), preferred_language text not null default 'fr' check(preferred_language in ('fr','en')), status text not null default 'active' check(status in ('active','archived')), unique(tenant_id,code), notify_email boolean not null default false, notify_sms boolean not null default false, check(email is not null or phone is not null), check(not notify_email or email is not null), check(not notify_sms or phone is not null));
create table public.student_guardians (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, revision bigint not null default 1 check(revision>0), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), unique(tenant_id,id), student_id uuid not null, guardian_id uuid not null, relationship text not null check(char_length(btrim(relationship)) between 1 and 80), primary_contact boolean not null default false, contact_priority integer not null default 1 check(contact_priority between 1 and 1000), billing_contact boolean not null default false, status text not null default 'active' check(status in ('active','archived')), foreign key(tenant_id,student_id) references public.students(tenant_id,id), foreign key(tenant_id,guardian_id) references public.guardians(tenant_id,id), unique(tenant_id,student_id,guardian_id));
create table public.enrollments (id uuid primary key default gen_random_uuid(), tenant_id uuid not null references public.tenants(id) on delete cascade, revision bigint not null default 1 check(revision>0), created_at timestamptz not null default clock_timestamp(), updated_at timestamptz not null default clock_timestamp(), unique(tenant_id,id), student_id uuid not null, year_id uuid not null, level_id uuid not null, program_id uuid, class_id uuid, status text not null default 'draft' check(status in ('draft','active','completed','withdrawn','cancelled')), foreign key(tenant_id,student_id) references public.students(tenant_id,id), foreign key(tenant_id,year_id) references public.academic_years(tenant_id,id), foreign key(tenant_id,level_id) references public.academic_levels(tenant_id,id), foreign key(tenant_id,program_id) references public.academic_programs(tenant_id,id), foreign key(tenant_id,class_id) references public.academic_classes(tenant_id,id), unique(tenant_id,student_id,year_id));
create unique index academic_year_one_active on public.academic_years(tenant_id) where status='active';
create index students_name_lookup on public.students(tenant_id,lower(name));
create index guardians_name_lookup on public.guardians(tenant_id,lower(name));
create index enrollment_year_status on public.enrollments(tenant_id,year_id,status);
create index guardian_student_lookup on public.student_guardians(tenant_id,guardian_id);

create table public.enrollment_history (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null,
 enrollment_id uuid not null, actor_user_id uuid references auth.users(id) on delete set null,
 before_state jsonb, after_state jsonb not null, created_at timestamptz not null default clock_timestamp(),
 foreign key(tenant_id,enrollment_id) references public.enrollments(tenant_id,id) on delete cascade
);
create index enrollment_history_lookup on public.enrollment_history(tenant_id,enrollment_id,created_at);
create table app_private.school_import_runs (
 tenant_id uuid not null references public.tenants(id) on delete cascade,
 actor_id uuid not null references auth.users(id) on delete cascade,
 batch_id uuid not null, payload_hash text not null, result jsonb not null,
 created_at timestamptz not null default clock_timestamp(), primary key(tenant_id,actor_id,batch_id)
);
alter table app_private.school_import_runs enable row level security;
revoke all on app_private.school_import_runs from public,anon,authenticated;

insert into public.permissions(key,description)
select domain||'.'||operation, 'Sprint 1 '||domain||' '||operation
from unnest(array['academics','students','guardians','enrollments']) domain
cross join unnest(array['read','write','archive']) operation;
insert into public.permissions(key,description) values
 ('imports.preview','Preview school imports'),('imports.commit','Commit school imports');
insert into public.role_permissions(role_id,permission_id)
select r.id,p.id from public.roles r cross join public.permissions p
where r.key in ('tenant_admin','registrar') and p.key ~ '^(academics|students|guardians|enrollments|imports)[.]';

-- Static registry: no identifier from the caller can become SQL syntax.
create function app_private.school_entity(kind text)
returns table(table_name text, domain_key text, fields text[])
language sql immutable set search_path='' as $$
 select e.table_name,e.domain_key,e.fields from (values
 ('years','academic_years','academics',array['code','name','starts_on','ends_on','status']::text[]),
 ('programs','academic_programs','academics',array['code','name','status']::text[]),
 ('levels','academic_levels','academics',array['code','name','status']::text[]),
 ('classes','academic_classes','academics',array['code','name','status','year_id','level_id','program_id']::text[]),
 ('terms','academic_terms','academics',array['code','name','status','year_id','starts_on','ends_on']::text[]),
 ('students','students','students',array['code','first_name','last_name','email','phone','preferred_language','birth_date','status']::text[]),
 ('guardians','guardians','guardians',array['code','first_name','last_name','email','phone','preferred_language','notify_email','notify_sms','status']::text[]),
 ('links','student_guardians','guardians',array['student_id','guardian_id','relationship','primary_contact','contact_priority','billing_contact','status']::text[]),
 ('enrollments','enrollments','enrollments',array['student_id','year_id','level_id','program_id','class_id','status']::text[])
 ) e(kind,table_name,domain_key,fields) where e.kind=$1;
$$;

create function app_private.school_authorize(t uuid, permission_key text)
returns void language plpgsql set search_path='' as $$
begin
 if auth.uid() is null or not public.current_user_has_permission(t,permission_key)
   or not exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null)
 then raise exception 'permission_denied' using errcode='42501'; end if;
 perform 1 from public.tenants where id=t and status='active' for update;
 if not found or not public.current_user_has_permission(t,permission_key)
 then raise exception 'permission_denied' using errcode='42501'; end if;
end; $$;

-- Private trigger: checks cross-reference consistency even for privileged writes.
create function app_private.school_record_guard() returns trigger
language plpgsql set search_path='' as $$
declare y public.academic_years; c public.academic_classes;
begin
 if tg_op='UPDATE' then
  if new.tenant_id<>old.tenant_id or new.id<>old.id then raise exception 'immutable_identity'; end if;
  if to_jsonb(new)?'code' and to_jsonb(new)->>'code'<>to_jsonb(old)->>'code' then raise exception 'immutable_code'; end if;
  new.revision:=old.revision+1; new.created_at:=old.created_at; new.updated_at:=clock_timestamp();
 end if;
 if tg_table_name='academic_years' then
  if tg_op='UPDATE' and old.status in ('closed','archived') and
    (new.code<>old.code or new.name<>old.name or new.starts_on<>old.starts_on or new.ends_on<>old.ends_on or new.status not in (old.status,'archived'))
  then raise exception 'historical_year'; end if;
  if exists(select 1 from public.academic_terms where tenant_id=new.tenant_id and year_id=new.id and (starts_on<new.starts_on or ends_on>new.ends_on)) then raise exception 'term_outside_year'; end if;
 end if;
 if tg_table_name='academic_terms' then
  select * into y from public.academic_years where tenant_id=new.tenant_id and id=new.year_id;
  if y.id is null or (y.status in ('closed','archived') and (tg_op='INSERT' or new.status<>'archived')) or new.starts_on<y.starts_on or new.ends_on>y.ends_on then raise exception 'invalid_reference'; end if;
 end if;
 if tg_table_name='academic_classes' then
  if not(tg_op='UPDATE' and new.status='archived' and (new.year_id,new.level_id,new.program_id) is not distinct from (old.year_id,old.level_id,old.program_id)) then
  if not exists(select 1 from public.academic_years where tenant_id=new.tenant_id and id=new.year_id and status in ('planned','active'))
   or not exists(select 1 from public.academic_levels where tenant_id=new.tenant_id and id=new.level_id and status='active')
   or (new.program_id is not null and not exists(select 1 from public.academic_programs where tenant_id=new.tenant_id and id=new.program_id and status='active'))
  then raise exception 'invalid_reference'; end if;
  end if;
  if tg_op='UPDATE' and (new.year_id,new.level_id,new.program_id) is distinct from (old.year_id,old.level_id,old.program_id)
    and exists(select 1 from public.enrollments where tenant_id=new.tenant_id and class_id=new.id)
  then raise exception 'historical_class'; end if;
 end if;
 if tg_table_name in ('student_guardians','enrollments') then
  if tg_op='INSERT' or new.status in ('active','draft') then
   if not exists(select 1 from public.students where tenant_id=new.tenant_id and id=new.student_id and status='active') then raise exception 'invalid_reference'; end if;
  end if;
 end if;
 if tg_table_name='student_guardians' then
  if not exists(select 1 from public.guardians where tenant_id=new.tenant_id and id=new.guardian_id and (status='active' or new.status='archived')) then raise exception 'invalid_reference'; end if;
  if tg_op='UPDATE' and (new.student_id,new.guardian_id) is distinct from (old.student_id,old.guardian_id) then raise exception 'immutable_identity'; end if;
 end if;
 if tg_table_name='enrollments' then
  if tg_op='UPDATE' then
   if (new.student_id,new.year_id) is distinct from (old.student_id,old.year_id) then raise exception 'immutable_identity'; end if;
   if old.status in ('completed','withdrawn','cancelled') then raise exception 'terminal_enrollment'; end if;
   if new.status<>old.status and not ((old.status='draft' and new.status in ('active','cancelled')) or (old.status='active' and new.status in ('completed','withdrawn'))) then raise exception 'invalid_transition'; end if;
  elsif new.status not in ('draft','active') then raise exception 'invalid_transition'; end if;
  if tg_op='INSERT' or new.status in ('draft','active') or (new.level_id,new.program_id,new.class_id) is distinct from (old.level_id,old.program_id,old.class_id) then
  select * into y from public.academic_years where tenant_id=new.tenant_id and id=new.year_id;
  if y.id is null or y.status in ('closed','archived')
   or not exists(select 1 from public.academic_levels where tenant_id=new.tenant_id and id=new.level_id and status='active')
   or (new.program_id is not null and not exists(select 1 from public.academic_programs where tenant_id=new.tenant_id and id=new.program_id and status='active')) then raise exception 'invalid_reference'; end if;
  if new.class_id is not null then
   select * into c from public.academic_classes where tenant_id=new.tenant_id and id=new.class_id;
   if c.id is null or c.status<>'active' or c.year_id<>new.year_id or c.level_id<>new.level_id or c.program_id is distinct from new.program_id then raise exception 'invalid_reference'; end if;
  end if;
  end if;
 end if;
 return new;
end; $$;

create function app_private.school_record_audit() returns trigger
language plpgsql set search_path='' as $$
begin
 insert into public.audit_events(tenant_id,actor_user_id,action,target_type,target_id,request_id,metadata)
 values(new.tenant_id,auth.uid(),'school.'||tg_table_name||'.'||lower(tg_op),tg_table_name,new.id,gen_random_uuid()::text,
   jsonb_build_object('revision',new.revision,'status',new.status));
 if tg_table_name='enrollments' then
  insert into public.enrollment_history(tenant_id,enrollment_id,actor_user_id,before_state,after_state)
  values(new.tenant_id,new.id,auth.uid(),case when tg_op='UPDATE' then to_jsonb(old)-array['created_at','updated_at'] else null end,to_jsonb(new)-array['created_at','updated_at']);
 end if;
 return new;
end; $$;

-- Only this authenticated gateway can write domain tables; JSON is constrained to
-- a static per-entity field allowlist, typed table columns and database invariants.
create function public.save_school_record(target_tenant_id uuid,record_kind text,record_id uuid,expected_revision bigint,record_data jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare e record; old_data jsonb; keys text; projection text; result_id uuid;
begin
 select * into e from app_private.school_entity(record_kind);
 if e.table_name is null or jsonb_typeof(record_data)<>'object' or pg_column_size(record_data)>16384 then raise exception 'invalid_input'; end if;
 if exists(select 1 from jsonb_object_keys(record_data) k where not(k=any(e.fields))) then raise exception 'invalid_input'; end if;
 perform app_private.school_authorize(target_tenant_id,e.domain_key||'.write');
 if exists(select 1 from jsonb_each(record_data) p where jsonb_typeof(p.value) not in ('string','number','boolean','null')) then raise exception 'invalid_input'; end if;
 if record_kind in ('students','guardians') and not(record_data?'preferred_language') and record_id is null then
  record_data:=record_data||jsonb_build_object('preferred_language',(select default_locale from public.tenant_settings where tenant_id=target_tenant_id));
 end if;
 if record_data->>'status'='archived' then perform app_private.school_authorize(target_tenant_id,e.domain_key||'.archive'); end if;
 if (select count(*) from public.audit_events where tenant_id=target_tenant_id and actor_user_id=auth.uid() and action like 'school.%' and created_at>clock_timestamp()-interval '10 minutes')>=1000 then raise exception 'rate_limited' using errcode='P0001'; end if;
 select string_agg(format('%I',k),','),string_agg(format('r.%I',k),',') into keys,projection from jsonb_object_keys(record_data) k;
 if keys is null then raise exception 'invalid_input'; end if;
 if record_id is null then
  if expected_revision is not null then raise exception 'invalid_input'; end if;
  execute format('insert into public.%I(tenant_id,%s) select $1,%s from jsonb_populate_record(null::public.%I,$2) r returning id',e.table_name,keys,projection,e.table_name)
   into result_id using target_tenant_id,record_data;
 else
  execute format('select to_jsonb(r) from public.%I r where tenant_id=$1 and id=$2 for update',e.table_name)
   into old_data using target_tenant_id,record_id;
  if old_data is null then raise exception 'not_found'; end if;
  if old_data->>'status'='archived' then perform app_private.school_authorize(target_tenant_id,e.domain_key||'.archive'); end if;
  if expected_revision is null or expected_revision<>(old_data->>'revision')::bigint then raise exception 'stale_write'; end if;
  execute format('update public.%I set (%s)=(select %s from jsonb_populate_record(null::public.%I,$3) r) where tenant_id=$1 and id=$2 returning id',e.table_name,keys,projection,e.table_name)
   into result_id using target_tenant_id,record_id,record_data;
 end if;
 return result_id;
end; $$;
revoke all on function public.save_school_record(uuid,text,uuid,bigint,jsonb) from public,anon,service_role;
grant execute on function public.save_school_record(uuid,text,uuid,bigint,jsonb) to authenticated;
alter table public.academic_years enable row level security;
revoke all on public.academic_years from public,anon,authenticated;
grant select on public.academic_years to authenticated;
create policy school_read on public.academic_years for select to authenticated using(public.current_user_has_permission(tenant_id,'academics.read') and exists(select 1 from public.tenants t where t.id=tenant_id and t.status='active'));
create trigger school_guard before insert or update on public.academic_years for each row execute function app_private.school_record_guard();
create trigger school_audit after insert or update on public.academic_years for each row execute function app_private.school_record_audit();
alter table public.academic_programs enable row level security;
revoke all on public.academic_programs from public,anon,authenticated;
grant select on public.academic_programs to authenticated;
create policy school_read on public.academic_programs for select to authenticated using(public.current_user_has_permission(tenant_id,'academics.read') and exists(select 1 from public.tenants t where t.id=tenant_id and t.status='active'));
create trigger school_guard before insert or update on public.academic_programs for each row execute function app_private.school_record_guard();
create trigger school_audit after insert or update on public.academic_programs for each row execute function app_private.school_record_audit();
alter table public.academic_levels enable row level security;
revoke all on public.academic_levels from public,anon,authenticated;
grant select on public.academic_levels to authenticated;
create policy school_read on public.academic_levels for select to authenticated using(public.current_user_has_permission(tenant_id,'academics.read') and exists(select 1 from public.tenants t where t.id=tenant_id and t.status='active'));
create trigger school_guard before insert or update on public.academic_levels for each row execute function app_private.school_record_guard();
create trigger school_audit after insert or update on public.academic_levels for each row execute function app_private.school_record_audit();
alter table public.academic_classes enable row level security;
revoke all on public.academic_classes from public,anon,authenticated;
grant select on public.academic_classes to authenticated;
create policy school_read on public.academic_classes for select to authenticated using(public.current_user_has_permission(tenant_id,'academics.read') and exists(select 1 from public.tenants t where t.id=tenant_id and t.status='active'));
create trigger school_guard before insert or update on public.academic_classes for each row execute function app_private.school_record_guard();
create trigger school_audit after insert or update on public.academic_classes for each row execute function app_private.school_record_audit();
alter table public.academic_terms enable row level security;
revoke all on public.academic_terms from public,anon,authenticated;
grant select on public.academic_terms to authenticated;
create policy school_read on public.academic_terms for select to authenticated using(public.current_user_has_permission(tenant_id,'academics.read') and exists(select 1 from public.tenants t where t.id=tenant_id and t.status='active'));
create trigger school_guard before insert or update on public.academic_terms for each row execute function app_private.school_record_guard();
create trigger school_audit after insert or update on public.academic_terms for each row execute function app_private.school_record_audit();
alter table public.students enable row level security;
revoke all on public.students from public,anon,authenticated;
grant select on public.students to authenticated;
create policy school_read on public.students for select to authenticated using(public.current_user_has_permission(tenant_id,'students.read') and exists(select 1 from public.tenants t where t.id=tenant_id and t.status='active'));
create trigger school_guard before insert or update on public.students for each row execute function app_private.school_record_guard();
create trigger school_audit after insert or update on public.students for each row execute function app_private.school_record_audit();
alter table public.guardians enable row level security;
revoke all on public.guardians from public,anon,authenticated;
grant select on public.guardians to authenticated;
create policy school_read on public.guardians for select to authenticated using(public.current_user_has_permission(tenant_id,'guardians.read') and exists(select 1 from public.tenants t where t.id=tenant_id and t.status='active'));
create trigger school_guard before insert or update on public.guardians for each row execute function app_private.school_record_guard();
create trigger school_audit after insert or update on public.guardians for each row execute function app_private.school_record_audit();
alter table public.student_guardians enable row level security;
revoke all on public.student_guardians from public,anon,authenticated;
grant select on public.student_guardians to authenticated;
create policy school_read on public.student_guardians for select to authenticated using(public.current_user_has_permission(tenant_id,'guardians.read') and exists(select 1 from public.tenants t where t.id=tenant_id and t.status='active'));
create trigger school_guard before insert or update on public.student_guardians for each row execute function app_private.school_record_guard();
create trigger school_audit after insert or update on public.student_guardians for each row execute function app_private.school_record_audit();
alter table public.enrollments enable row level security;
revoke all on public.enrollments from public,anon,authenticated;
grant select on public.enrollments to authenticated;
create policy school_read on public.enrollments for select to authenticated using(public.current_user_has_permission(tenant_id,'enrollments.read') and exists(select 1 from public.tenants t where t.id=tenant_id and t.status='active'));
create trigger school_guard before insert or update on public.enrollments for each row execute function app_private.school_record_guard();
create trigger school_audit after insert or update on public.enrollments for each row execute function app_private.school_record_audit();

alter table public.enrollment_history enable row level security;
revoke all on public.enrollment_history from public,anon,authenticated;
grant select on public.enrollment_history to authenticated;
create policy enrollment_history_read on public.enrollment_history for select to authenticated
 using(public.current_user_has_permission(tenant_id,'enrollments.read') and exists(select 1 from public.tenants t where t.id=tenant_id and t.status='active'));
revoke all on function app_private.school_entity(text),app_private.school_authorize(uuid,text),app_private.school_record_guard(),app_private.school_record_audit() from public,anon,authenticated;

-- Commit only. Preview is sealed by the application and has no database writes.
create function public.commit_school_import(target_tenant_id uuid,record_kind text,batch_id uuid,preview_expires_at timestamptz,import_rows jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare item jsonb; result jsonb:='[]'; saved uuid; fingerprint text; prior app_private.school_import_runs; result_code text; e record;
begin
 perform app_private.school_authorize(target_tenant_id,'imports.commit');
 select * into e from app_private.school_entity(record_kind);
 if record_kind not in ('students','guardians','links','enrollments') or e.table_name is null
  or batch_id is null or preview_expires_at is null or preview_expires_at<=clock_timestamp()
  or preview_expires_at>clock_timestamp()+interval '15 minutes'
  or jsonb_typeof(import_rows)<>'array' or jsonb_array_length(import_rows) not between 1 and 500 or pg_column_size(import_rows)>8388608
 then raise exception 'invalid_import'; end if;
 perform app_private.school_authorize(target_tenant_id,e.domain_key||'.write');
 fingerprint:=encode(sha256(convert_to(record_kind||import_rows::text,'UTF8')),'hex');
 select * into prior from app_private.school_import_runs r where r.tenant_id=target_tenant_id and r.actor_id=auth.uid() and r.batch_id=commit_school_import.batch_id;
 if found then
  if prior.payload_hash<>fingerprint then raise exception 'import_replay_mismatch'; end if;
  return prior.result;
 end if;
 if (select count(*) from public.audit_events where tenant_id=target_tenant_id and actor_user_id=auth.uid() and action like 'school.%' and created_at>clock_timestamp()-interval '10 minutes')>=1000 then raise exception 'rate_limited'; end if;
 for item in select value from jsonb_array_elements(import_rows) loop
  if jsonb_typeof(item)<>'object' or not(item?'line') or (item->>'line')::integer not between 2 and 501 then raise exception 'invalid_import'; end if;
  begin
   saved:=public.save_school_record(target_tenant_id,record_kind,null,null,item->'data');
   result_code:='inserted';
  exception
   when unique_violation then saved:=null;result_code:='duplicate';
   when insufficient_privilege then raise;
   when check_violation or foreign_key_violation or not_null_violation or invalid_text_representation or datetime_field_overflow then saved:=null;result_code:='invalidRow';
   when raise_exception then
    if sqlerrm in ('invalid_reference','invalid_transition','invalid_input','term_outside_year','rate_limited') then saved:=null;result_code:='invalidRow'; else raise; end if;
  end;
  result:=result||jsonb_build_array(jsonb_build_object('line',(item->>'line')::integer,'result',result_code,'id',saved));
 end loop;
 insert into app_private.school_import_runs(tenant_id,actor_id,batch_id,payload_hash,result) values(target_tenant_id,auth.uid(),batch_id,fingerprint,result);
 insert into public.audit_events(tenant_id,actor_user_id,action,target_type,target_id,request_id,metadata)
 values(target_tenant_id,auth.uid(),'school.import.commit','school_import',batch_id,gen_random_uuid()::text,jsonb_build_object('rows',jsonb_array_length(import_rows),'kind',record_kind));
 return result;
end; $$;
revoke all on function public.commit_school_import(uuid,text,uuid,timestamptz,jsonb) from public,anon,service_role;
grant execute on function public.commit_school_import(uuid,text,uuid,timestamptz,jsonb) to authenticated;
