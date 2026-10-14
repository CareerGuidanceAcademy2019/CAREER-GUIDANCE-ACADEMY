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
  -- ---------- ADMINS ----------
  ('owner@example.com',  'admin',   'Replace with real admin email'),
  ('+91 90000 00000',    'admin',   'Replace with real admin phone'),

  -- ---------- PRE-APPROVED FACULTY ----------
  ('teacher1@example.com', 'faculty', 'Replace with real faculty email'),
  ('+91 90000 00001',      'faculty', 'Replace with real faculty phone')
on conflict (identifier) do nothing;

-- ---------------------------------------------------------------------------
-- Handy one-liners for later
-- ---------------------------------------------------------------------------
-- Add one admin:        insert into public.access_allowlist (identifier, role) values ('new.admin@gmail.com', 'admin');
-- Remove admin access:  delete from public.access_allowlist where identifier = 'new.admin@gmail.com';
-- See the list:         select identifier, role, note, created_at from public.access_allowlist order by role, created_at;
