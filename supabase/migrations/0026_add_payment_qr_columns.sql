-- Migration 0026: Add dynamic QR code columns and storage to payment_settings
-- Career Guidance Academy (C.G.A)

ALTER TABLE public.payment_settings 
ADD COLUMN IF NOT EXISTS qr_image_url text DEFAULT '/cga-upi-qr.jpg',
ADD COLUMN IF NOT EXISTS qr_image_url_backup text,
ADD COLUMN IF NOT EXISTS qr_label text DEFAULT 'Primary Institute QR',
ADD COLUMN IF NOT EXISTS qr_label_backup text DEFAULT 'Secondary / Alternate QR';

-- Create public storage bucket for payment assets if not present
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-assets',
  'payment-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment-assets
DROP POLICY IF EXISTS "Public can view payment assets" ON storage.objects;
CREATE POLICY "Public can view payment assets" ON storage.objects
FOR SELECT USING (bucket_id = 'payment-assets');

DROP POLICY IF EXISTS "Admins can upload payment assets" ON storage.objects;
CREATE POLICY "Admins can upload payment assets" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
  )
);

DROP POLICY IF EXISTS "Admins can update payment assets" ON storage.objects;
CREATE POLICY "Admins can update payment assets" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'payment-assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
  )
);

DROP POLICY IF EXISTS "Admins can delete payment assets" ON storage.objects;
CREATE POLICY "Admins can delete payment assets" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'payment-assets' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('ADMIN', 'SUPER_ADMIN')
  )
);

