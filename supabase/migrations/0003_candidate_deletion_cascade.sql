-- Career Guidance Academy: Candidate deletion RPC and cascade guarantee
-- Allows verified institute administrator to permanently wipe any candidate record
-- and all associated data (enrollments, test_attempts, fee_payments, waiting_list)

create or replace function public.delete_candidate_by_admin(p_student_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  -- Enforce that caller is an active administrator
  if not public.is_admin() then
    raise exception 'Unauthorized: Only institute administrators can remove candidates.';
  end if;

  -- Ensure caller is not deleting themselves or another admin
  select role into v_role from public.profiles where id = p_student_id;
  if not found then
    return jsonb_build_object('success', false, 'message', 'Candidate not found');
  end if;

  if v_role = 'admin' then
    raise exception 'Cannot delete an administrator account through candidate management.';
  end if;

  -- Atomic cleanup of all associated data
  delete from public.test_attempts where student_id = p_student_id;
  delete from public.fee_payments where student_id = p_student_id;
  delete from public.enrollments where student_id = p_student_id;
  delete from public.waiting_list where student_id = p_student_id;
  delete from public.profiles where id = p_student_id;

  return jsonb_build_object('success', true, 'message', 'Candidate and all associated data permanently removed.');
end $$;

revoke execute on function public.delete_candidate_by_admin(uuid) from public, anon;
grant execute on function public.delete_candidate_by_admin(uuid) to authenticated;
