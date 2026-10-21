-- ==============================================================================
-- 0019_production_security_hardening.sql
-- Career Guidance Academy (C.G.A) Production Security Hardening
--
-- 1. Disallows non-admin execution of cga_list_pending_admins (PII leak fix).
-- 2. Restricts fee_payments direct insertion to admin or status = 'Pending' only.
-- 3. Adds guard trigger on mock_attempts preventing student score tampering.
-- 4. Restricts test_attempts direct insert to administrators only.
-- 5. Removes anonymous direct insertion on security_audit_log (DoS / spam fix).
-- 6. Adds RLS policies for public.waiting_list.
-- 7. Sets search_path = '' on trig_prevent_audit_log_mutation and generate_payment_reference_code.
-- ==============================================================================

-- 1. PII LEAK FIX: Restrict cga_list_pending_admins to active admins
CREATE OR REPLACE FUNCTION public.cga_list_pending_admins()
RETURNS TABLE(id uuid, name text, email text, phone text, status text, created_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Only active institute administrators can view pending administrator requests.';
  END IF;

  RETURN QUERY
  SELECT p.id, p.name, p.email, p.phone, p.status, p.created_at
  FROM public.profiles p
  WHERE p.role = 'admin' AND p.status = 'Pending'
  ORDER BY p.created_at DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.cga_list_pending_admins() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cga_list_pending_admins() TO authenticated;

-- 2. FINANCIAL FORGERY FIX: Restrict fee_payments insertion
DROP POLICY IF EXISTS "fee_payments: student insert own or admin" ON public.fee_payments;
DROP POLICY IF EXISTS "fee_payments: insert policy" ON public.fee_payments;
CREATE POLICY "fee_payments: insert policy"
ON public.fee_payments
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin() OR (
    student_id = (SELECT auth.uid())
    AND status = 'Pending'
    AND amount > 0
  )
);

-- 3. EXAM INTEGRITY FIX: Trigger blocking client-side score falsification on mock_attempts
CREATE OR REPLACE FUNCTION public.guard_mock_attempt_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.score IS DISTINCT FROM OLD.score THEN
      RAISE EXCEPTION 'Unauthorized: Exam scores can only be evaluated by the server.';
    END IF;
    IF NEW.correct_count IS DISTINCT FROM OLD.correct_count OR NEW.wrong_count IS DISTINCT FROM OLD.wrong_count THEN
      RAISE EXCEPTION 'Unauthorized: Question metrics cannot be modified directly.';
    END IF;
    IF NEW.submitted_at IS DISTINCT FROM OLD.submitted_at THEN
      RAISE EXCEPTION 'Unauthorized: Exam submission must be processed through official submit API.';
    END IF;
    IF NEW.student_id IS DISTINCT FROM OLD.student_id OR NEW.test_id IS DISTINCT FROM OLD.test_id THEN
      RAISE EXCEPTION 'Unauthorized: Test and student identity cannot be modified.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_mock_attempt_update_trig ON public.mock_attempts;
CREATE TRIGGER guard_mock_attempt_update_trig
BEFORE UPDATE ON public.mock_attempts
FOR EACH ROW
EXECUTE FUNCTION public.guard_mock_attempt_update();

-- 4. LEGACY ATTEMPT FORGERY FIX: Only admin can directly insert test_attempts
DROP POLICY IF EXISTS "attempts: student insert own or admin" ON public.test_attempts;
DROP POLICY IF EXISTS "test_attempts: admin insert only" ON public.test_attempts;
CREATE POLICY "test_attempts: admin insert only"
ON public.test_attempts
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- 5. AUDIT LOG SPAM & DoS FIX: Revoke direct anonymous insertion on security_audit_log
DROP POLICY IF EXISTS "security_audit_log: insert" ON public.security_audit_log;
DROP POLICY IF EXISTS "security_audit_log: authenticated insert only" ON public.security_audit_log;
CREATE POLICY "security_audit_log: authenticated insert only"
ON public.security_audit_log
FOR INSERT
TO authenticated
WITH CHECK (actor_id = (SELECT auth.uid())::text OR public.is_admin());

-- 6. WAITING LIST RLS COVERAGE
ALTER TABLE public.waiting_list ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "waiting_list: admin all" ON public.waiting_list;
CREATE POLICY "waiting_list: admin all"
ON public.waiting_list
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "waiting_list: student read own" ON public.waiting_list;
CREATE POLICY "waiting_list: student read own"
ON public.waiting_list
FOR SELECT
TO authenticated
USING (student_id = (SELECT auth.uid()));

-- 7. SET SEARCH_PATH TO PREVENT MUTABLE SEARCH PATH ESCALATION
CREATE OR REPLACE FUNCTION public.generate_payment_reference_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_chars text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_code text := 'CGA-';
  v_i int;
BEGIN
  FOR v_i IN 1..6 LOOP
    v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
  END LOOP;
  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.trig_prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Unauthorized: payment_audit_log is immutable and append-only.';
END;
$$;
