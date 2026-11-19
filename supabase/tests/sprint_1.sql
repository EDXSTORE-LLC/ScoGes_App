-- Isolated CI only; invoked inside the enclosing rollback transaction.
reset role;
select set_config('test.school_actor',(select user_id::text from public.memberships where id=current_setting('test.membership_c')::uuid),true);
update auth.users set email_confirmed_at=clock_timestamp() where id in (current_setting('test.school_actor')::uuid,current_setting('test.user_b')::uuid);
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('test.school_actor'),true);
do $$
declare t uuid:=current_setting('test.tenant_a')::uuid; foreign_t uuid:=current_setting('test.tenant_b')::uuid;
 y uuid; l uuid; c uuid; s uuid; g uuid; n uuid; r uuid; caught boolean;
begin
 y:=public.save_school_record(t,'years',null,null,'{"code":"y2026","name":"2026","starts_on":"2026-01-01","ends_on":"2026-12-31","status":"active"}');
 begin
  perform public.save_school_record(t,'years',null,null,'{"code":"y2027","name":"2027","starts_on":"2026-09-01","ends_on":"2027-08-31","status":"active"}');
  raise exception 'test_second_active_year_allowed';
 exception when unique_violation then null; end;
 l:=public.save_school_record(t,'levels',null,null,'{"code":"grade1","name":"Grade 1"}');
 c:=public.save_school_record(t,'classes',null,null,jsonb_build_object('code','group1','name','Group 1','year_id',y,'level_id',l));
 s:=public.save_school_record(t,'students',null,null,'{"code":"s001","first_name":"Test","last_name":"Student"}');
 g:=public.save_school_record(t,'guardians',null,null,'{"code":"g001","first_name":"Test","last_name":"Guardian","email":"guardian@example.invalid"}');
 r:=public.save_school_record(t,'links',null,null,jsonb_build_object('student_id',s,'guardian_id',g,'relationship','guardian','primary_contact',true));
 n:=public.save_school_record(t,'enrollments',null,null,jsonb_build_object('student_id',s,'year_id',y,'level_id',l,'class_id',c,'status','draft'));
 perform public.save_school_record(t,'enrollments',n,1,'{"status":"active"}');
 perform public.save_school_record(t,'enrollments',n,2,'{"status":"completed"}');
 if (select count(*) from public.enrollment_history where enrollment_id=n)<>3 then raise exception 'test_enrollment_history_missing'; end if;
 begin
  perform public.save_school_record(t,'enrollments',n,3,'{"status":"active"}');
  raise exception 'test_terminal_enrollment_mutable';
 exception when raise_exception then if sqlerrm<>'terminal_enrollment' then raise; end if; end;
 begin
  perform public.save_school_record(t,'students',s,1,'{"code":"replacement"}');
  raise exception 'test_code_mutable';
 exception when raise_exception then if sqlerrm<>'immutable_code' then raise; end if; end;
 begin
  perform public.save_school_record(t,'students',s,2,'{"first_name":"Stale"}');
  raise exception 'test_stale_write_allowed';
 exception when raise_exception then if sqlerrm<>'stale_write' then raise; end if; end;
 begin
  perform public.save_school_record(foreign_t,'students',null,null,'{"code":"foreign","first_name":"A","last_name":"B"}');
  raise exception 'test_foreign_tenant_write_allowed';
 exception when insufficient_privilege then null; end;
 begin
  perform public.save_school_record(t,'links',null,null,jsonb_build_object('student_id',s,'guardian_id',gen_random_uuid(),'relationship','other'));
  raise exception 'test_foreign_link_allowed';
 exception when raise_exception then if sqlerrm<>'invalid_reference' then raise; end if; end;
 begin
  perform public.save_school_record(t,'students',null,null,'{"code":"spoof","first_name":"A","last_name":"B","actor_id":"00000000-0000-0000-0000-000000000000"}');
  raise exception 'test_actor_spoof_allowed';
 exception when raise_exception then if sqlerrm<>'invalid_input' then raise; end if; end;
 -- Import commits are insert-only, retry-idempotent and report per-row errors.
 begin
  perform set_config('test.school_batch',gen_random_uuid()::text,true);
  perform set_config('test.school_rows',jsonb_build_array(
   jsonb_build_object('line',2,'data',jsonb_build_object('code','s001','first_name','Existing','last_name','Conflict')),
   jsonb_build_object('line',3,'data',jsonb_build_object('code','s002','first_name','New','last_name','Student')),
   jsonb_build_object('line',4,'data',jsonb_build_object('code','invalid','first_name','Missing'))
  )::text,true);
  perform set_config('test.school_result',public.commit_school_import(t,'students',current_setting('test.school_batch')::uuid,clock_timestamp()+interval '14 minutes',current_setting('test.school_rows')::jsonb)::text,true);
  if current_setting('test.school_result')::jsonb->0->>'result'<>'duplicate' or current_setting('test.school_result')::jsonb->1->>'result'<>'inserted' or current_setting('test.school_result')::jsonb->2->>'result'<>'invalidRow' then raise exception 'test_import_results'; end if;
  if public.commit_school_import(t,'students',current_setting('test.school_batch')::uuid,clock_timestamp()+interval '14 minutes',current_setting('test.school_rows')::jsonb)<>current_setting('test.school_result')::jsonb then raise exception 'test_import_retry'; end if;
  if (select count(*) from public.students where tenant_id=t)<>2 then raise exception 'test_import_duplicate_write'; end if;
  begin
   perform public.commit_school_import(t,'students',gen_random_uuid(),clock_timestamp()-interval '1 second',current_setting('test.school_rows')::jsonb);
   raise exception 'test_expired_import_allowed';
  exception when raise_exception then if sqlerrm<>'invalid_import' then raise; end if; end;
 end;
 if has_table_privilege('authenticated','public.students','INSERT') or has_table_privilege('authenticated','public.enrollment_history','UPDATE')
 or has_function_privilege('anon','public.save_school_record(uuid,text,uuid,bigint,jsonb)','EXECUTE') then raise exception 'test_privilege_boundary'; end if;
 perform set_config('test.school_student',s::text,true);
end; $$;
select set_config('request.jwt.claim.sub',current_setting('test.user_b'),true);
do $$ declare tab text; n bigint; begin
 foreach tab in array array['academic_years','academic_programs','academic_levels','academic_classes','academic_terms','students','guardians','student_guardians','enrollments','enrollment_history'] loop
  execute format('select count(*) from public.%I where tenant_id=$1',tab) into n using current_setting('test.tenant_a')::uuid;
  if n<>0 then raise exception 'test_tenant_isolation_failed'; end if;
 end loop;
end; $$;
select set_config('request.jwt.claim.sub',current_setting('test.user_a'),true);
do $$ begin
 begin
  perform public.save_school_record(current_setting('test.tenant_a')::uuid,'students',null,null,'{"code":"cashier","first_name":"A","last_name":"B"}');
  raise exception 'test_cashier_write_allowed';
 exception when insufficient_privilege then null; end;
 if exists(select 1 from public.students) then raise exception 'test_cashier_read_allowed'; end if;
end; $$;
reset role;
