-- Career Guidance Academy: Row Level Security + secure RPCs
-- Run AFTER 0001_core_schema.sql

alter table public.profiles        enable row level security;
alter table public.site_content    enable row level security;
alter table public.faculty         enable row level security;
alter table public.courses         enable row level security;
alter table public.achievements    enable row level security;
alter table public.study_materials enable row level security;
alter table public.mock_tests      enable row level security;
alter table public.enrollments     enable row level security;
alter table public.fee_payments    enable row level security;
alter table public.test_attempts   enable row level security;
alter table public.announcements   enable row level security;
alter table public.enquiries       enable row level security;
alter table public.waiting_list    enable row level security;

-- ---------- profiles ----------
create policy "profiles: read own or admin" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_admin());
create policy "profiles: update own or admin" on public.profiles for update to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());
create policy "profiles: admin delete" on public.profiles for delete to authenticated
  using (public.is_admin());
-- (inserts only happen through the auth trigger; no insert policy on purpose)

-- ---------- public website content (readable by everyone, admin-write) ----------
create policy "site_content: public read" on public.site_content for select to anon, authenticated using (true);
create policy "site_content: admin write" on public.site_content for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "faculty: public read" on public.faculty for select to anon, authenticated using (true);
create policy "faculty: admin write" on public.faculty for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "courses: public read" on public.courses for select to anon, authenticated using (true);
create policy "courses: admin write" on public.courses for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "achievements: public read" on public.achievements for select to anon, authenticated using (true);
create policy "achievements: admin write" on public.achievements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- student-only content ----------
create policy "materials: enrolled or admin read" on public.study_materials for select to authenticated
  using (public.is_admin() or public.is_enrolled(course_id));
create policy "materials: admin write" on public.study_materials for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "tests: enrolled (published) or admin read" on public.mock_tests for select to authenticated
  using (public.is_admin() or (status = 'Published' and public.is_enrolled(course_id)));
create policy "tests: admin write" on public.mock_tests for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "announcements: active users read" on public.announcements for select to authenticated
  using (public.is_admin() or public.is_active_user());
create policy "announcements: admin write" on public.announcements for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ---------- money & results: students READ own rows only, writes go through RPCs ----------
create policy "enrollments: own or admin read" on public.enrollments for select to authenticated
  using (student_id = (select auth.uid()) or public.is_admin());
create policy "enrollments: admin write" on public.enrollments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "payments: own or admin read" on public.fee_payments for select to authenticated
  using (student_id = (select auth.uid()) or public.is_admin());
create policy "payments: admin write" on public.fee_payments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "attempts: own or admin read" on public.test_attempts for select to authenticated
  using (student_id = (select auth.uid()) or public.is_admin());
create policy "attempts: admin delete" on public.test_attempts for delete to authenticated
  using (public.is_admin());

create policy "waiting_list: own or admin read" on public.waiting_list for select to authenticated
  using (student_id = (select auth.uid()) or public.is_admin());

-- ---------- enquiries: anyone may submit, only admin may read/manage ----------
create policy "enquiries: public insert" on public.enquiries for insert to anon, authenticated
  with check (true);
create policy "enquiries: admin read" on public.enquiries for select to authenticated
  using (public.is_admin());
create policy "enquiries: admin delete" on public.enquiries for delete to authenticated
  using (public.is_admin());

-- =====================================================================
-- Secure RPCs (SECURITY DEFINER): fee & scoring logic runs on the server
-- =====================================================================

create function public.enroll_in_course(
  p_course_id text, p_payment_type text, p_payment_mode text, p_student_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_student uuid := coalesce(p_student_id, (select auth.uid()));
  v_course public.courses%rowtype;
  v_profile public.profiles%rowtype;
  v_paid numeric; v_due numeric; v_receipt text; v_pay public.fee_payments%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  if v_student <> (select auth.uid()) and not public.is_admin() then
    raise exception 'Not allowed';
  end if;
  if p_payment_type not in ('Full Payment','Instalment 1') then
    raise exception 'Invalid payment type';
  end if;

  select * into v_profile from public.profiles where id = v_student;
  if not found or v_profile.status <> 'Active' then raise exception 'Student account is not active'; end if;

  select * into v_course from public.courses where id = p_course_id for update;
  if not found then raise exception 'Course not found'; end if;
  if v_course.status = 'Batch Closed' or v_course.seats_available <= 0 then
    raise exception 'This batch is currently closed for direct admission.';
  end if;
  if exists (select 1 from public.enrollments where student_id = v_student and course_id = p_course_id) then
    raise exception 'You are already enrolled in this course batch.';
  end if;
  if p_payment_type = 'Instalment 1' and not v_course.instalment_available then
    raise exception 'Instalments are not available for this course.';
  end if;

  v_paid := case when p_payment_type = 'Full Payment' then v_course.price else v_course.first_instalment end;
  v_due := greatest(0, v_course.price - v_paid);
  if v_paid <= 0 then raise exception 'Invalid fee amount'; end if;
  v_receipt := 'CGA/' || to_char(now(), 'YYYY') || '/RCP-' || lpad(nextval('public.receipt_seq')::text, 5, '0');

  insert into public.enrollments (student_id, course_id, progress, total_fee, paid_amount, due_amount, next_due_date)
  values (v_student, p_course_id, 5, v_course.price, v_paid, v_due,
          case when v_due > 0 then (current_date + 30) end);

  insert into public.fee_payments (receipt_no, student_id, course_id, amount, payment_mode, payment_type, remarks)
  values (v_receipt, v_student, p_course_id, v_paid, p_payment_mode, p_payment_type,
          case when v_due = 0 then 'Full course fee paid.'
               else '1st Instalment paid. Balance Rs. ' || v_due::text || ' due within 30 days.' end)
  returning * into v_pay;

  update public.courses
     set seats_available = seats_available - 1,
         status = case when seats_available - 1 <= 0 then 'Batch Closed' else status end
   where id = p_course_id;

  delete from public.waiting_list where student_id = v_student and course_id = p_course_id;

  return jsonb_build_object('id', v_pay.id, 'receiptNo', v_pay.receipt_no, 'studentId', v_student,
    'studentName', v_profile.name, 'courseId', p_course_id, 'courseName', v_course.name,
    'amount', v_pay.amount, 'paymentMode', v_pay.payment_mode, 'paymentType', v_pay.payment_type,
    'date', v_pay.date, 'remarks', v_pay.remarks);
end $$;

create function public.pay_course_due(
  p_course_id text, p_amount numeric, p_payment_mode text,
  p_remarks text default null, p_student_id uuid default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_student uuid := coalesce(p_student_id, (select auth.uid()));
  v_enr public.enrollments%rowtype;
  v_profile public.profiles%rowtype;
  v_course_name text; v_new_paid numeric; v_new_due numeric;
  v_receipt text; v_type text; v_pay public.fee_payments%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'Not authenticated'; end if;
  if v_student <> (select auth.uid()) and not public.is_admin() then raise exception 'Not allowed'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Invalid amount'; end if;

  select * into v_enr from public.enrollments
   where student_id = v_student and course_id = p_course_id for update;
  if not found then raise exception 'Enrolment not found'; end if;
  if p_amount > v_enr.due_amount then raise exception 'Amount exceeds the pending due.'; end if;

  select * into v_profile from public.profiles where id = v_student;
  select name into v_course_name from public.courses where id = p_course_id;

  v_new_paid := v_enr.paid_amount + p_amount;
  v_new_due := greatest(0, v_enr.total_fee - v_new_paid);
  v_type := case when v_new_due = 0 then 'Balance Clearance' else 'Instalment 2' end;
  v_receipt := 'CGA/' || to_char(now(), 'YYYY') || '/RCP-' || lpad(nextval('public.receipt_seq')::text, 5, '0');

  update public.enrollments
     set paid_amount = v_new_paid, due_amount = v_new_due,
         next_due_date = case when v_new_due = 0 then null else next_due_date end
   where id = v_enr.id;

  insert into public.fee_payments (receipt_no, student_id, course_id, amount, payment_mode, payment_type, remarks)
  values (v_receipt, v_student, p_course_id, p_amount, p_payment_mode, v_type,
          coalesce(left(p_remarks, 300), case when v_new_due = 0 then 'Full balance cleared.' else 'Partial instalment paid.' end))
  returning * into v_pay;

  return jsonb_build_object('id', v_pay.id, 'receiptNo', v_pay.receipt_no, 'studentId', v_student,
    'studentName', v_profile.name, 'courseId', p_course_id, 'courseName', v_course_name,
    'amount', v_pay.amount, 'paymentMode', v_pay.payment_mode, 'paymentType', v_pay.payment_type,
    'date', v_pay.date, 'remarks', v_pay.remarks);
end $$;

create function public.join_waiting_list(p_course_id text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null or not public.is_active_user() then raise exception 'Not allowed'; end if;
  insert into public.waiting_list (student_id, course_id) values ((select auth.uid()), p_course_id)
  on conflict do nothing;
  if found then
    update public.courses set waiting_list_count = waiting_list_count + 1 where id = p_course_id;
  end if;
end $$;

-- Scores are computed on the server so results cannot be forged from the browser.
create function public.submit_test_attempt(
  p_test_id text, p_answers jsonb, p_time_taken_minutes int
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_test public.mock_tests%rowtype;
  v_q jsonb; v_chosen jsonb;
  v_correct int := 0; v_wrong int := 0; v_unattempted int := 0;
  v_score numeric; v_acc numeric; v_row public.test_attempts%rowtype;
begin
  if (select auth.uid()) is null or not public.is_active_user() then raise exception 'Not allowed'; end if;
  select * into v_test from public.mock_tests where id = p_test_id and status = 'Published';
  if not found then raise exception 'Test not found'; end if;
  if not public.is_enrolled(v_test.course_id) then raise exception 'You are not enrolled in this course.'; end if;

  for v_q in select * from jsonb_array_elements(v_test.questions) loop
    v_chosen := p_answers -> (v_q ->> 'id');
    if v_chosen is null or jsonb_typeof(v_chosen) <> 'number' then
      v_unattempted := v_unattempted + 1;
    elsif (v_chosen #>> '{}')::int = (v_q ->> 'correctOptionIndex')::int then
      v_correct := v_correct + 1;
    else
      v_wrong := v_wrong + 1;
    end if;
  end loop;

  v_score := greatest(0, v_correct * v_test.marks_per_question - v_wrong * v_test.negative_marking);
  v_acc := case when v_correct + v_wrong > 0 then round(v_correct::numeric / (v_correct + v_wrong) * 100) else 0 end;

  insert into public.test_attempts
    (test_id, student_id, score, total_marks, correct_count, wrong_count, unattempted_count,
     accuracy, time_taken_minutes, answers)
  values (p_test_id, (select auth.uid()), v_score, v_test.total_marks, v_correct, v_wrong,
          v_unattempted, v_acc, greatest(1, least(coalesce(p_time_taken_minutes, 1), v_test.duration_minutes)),
          coalesce(p_answers, '{}'::jsonb))
  returning * into v_row;

  return jsonb_build_object('id', v_row.id, 'testId', v_row.test_id, 'testTitle', v_test.title,
    'courseId', v_test.course_id, 'studentId', v_row.student_id, 'score', v_row.score,
    'totalMarks', v_row.total_marks, 'correctCount', v_row.correct_count,
    'wrongCount', v_row.wrong_count, 'unattemptedCount', v_row.unattempted_count,
    'accuracy', v_row.accuracy, 'timeTakenMinutes', v_row.time_taken_minutes,
    'submittedAt', v_row.submitted_at, 'answers', v_row.answers);
end $$;

-- Anonymous peer scores so students can see their batch rank without seeing others' identities.
create function public.get_peer_attempts() returns table (id uuid, test_id text, score numeric, time_taken_minutes int)
language sql stable security definer set search_path = '' as $$
  select a.id, a.test_id, a.score, a.time_taken_minutes
    from public.test_attempts a
    join public.mock_tests t on t.id = a.test_id
   where a.student_id <> (select auth.uid())
     and public.is_enrolled(t.course_id);
$$;

revoke execute on function public.enroll_in_course(text,text,text,uuid) from public, anon;
revoke execute on function public.pay_course_due(text,numeric,text,text,uuid) from public, anon;
revoke execute on function public.join_waiting_list(text) from public, anon;
revoke execute on function public.submit_test_attempt(text,jsonb,int) from public, anon;
revoke execute on function public.get_peer_attempts() from public, anon;
grant execute on function public.enroll_in_course(text,text,text,uuid) to authenticated;
grant execute on function public.pay_course_due(text,numeric,text,text,uuid) to authenticated;
grant execute on function public.join_waiting_list(text) to authenticated;
grant execute on function public.submit_test_attempt(text,jsonb,int) to authenticated;
grant execute on function public.get_peer_attempts() to authenticated;
