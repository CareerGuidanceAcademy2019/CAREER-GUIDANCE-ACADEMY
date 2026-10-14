-- ============================================================================
-- C.G.A — ADMIN & PRE-APPROVED FACULTY ACCESS LIST
-- Paste into Supabase Dashboard > SQL Editor and click "Run" (after 0005 migration).
-- Safe to re-run: existing entries are skipped.
--
-- identifier = an email (any case)  OR  a phone number (any format; last 10 digits are used)
-- role       = 'admin' or 'faculty'
-- After this runs, each person opens /login -> Admin (or Faculty) tab -> "Create password".
-- If they ALREADY have an account with that email/phone, they are upgraded immediately.
-- ============================================================================

insert into public.access_allowlist (identifier, role, note) values
  -- ---------- OFFICIAL C.G.A ACADEMY ADMINS ----------
  ('admissions@cgaudaipur.in', 'admin', 'Career Guidance Academy Admissions Admin'),
  ('+91 94361 82490',         'admin', 'C.G.A Udaipur Primary Office Contact'),
  ('+91 87875 41120',         'admin', 'C.G.A Udaipur Secondary Office Contact')
on conflict (identifier) do nothing;

-- ---------------------------------------------------------------------------
-- Handy one-liners for later
-- ---------------------------------------------------------------------------
-- Add one admin:        insert into public.access_allowlist (identifier, role) values ('new.admin@gmail.com', 'admin');
-- Remove admin access:  delete from public.access_allowlist where identifier = 'new.admin@gmail.com';
-- See the list:         select identifier, role, note, created_at from public.access_allowlist order by role, created_at;
