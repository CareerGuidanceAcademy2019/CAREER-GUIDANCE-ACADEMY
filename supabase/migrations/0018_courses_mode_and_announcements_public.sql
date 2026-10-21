-- Migration 0018: Add missing columns to courses and allow public read for announcements

-- 1. Add missing mode, monthly_fee, and material_delivery to public.courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS mode text DEFAULT 'Offline',
  ADD COLUMN IF NOT EXISTS monthly_fee numeric,
  ADD COLUMN IF NOT EXISTS material_delivery text;

-- 2. Allow public (anon + authenticated) to read announcements for the Home Page bulletin
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'announcements' 
      AND policyname = 'announcements: public read'
  ) THEN
    CREATE POLICY "announcements: public read"
      ON public.announcements
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END $$;
