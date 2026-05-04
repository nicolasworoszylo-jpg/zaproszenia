-- 2026-04-30: Storage bucket dla zdjęć inspiracyjnych z lead form
-- Apply: Supabase Studio → SQL Editor → paste + Run
-- LUB: Supabase Studio → Storage → Create new bucket "lead-attachments" (private)

-- Bucket creation (jeśli RLS bucket helpers są dostępne; jeśli nie, rób przez UI)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lead-attachments',
  'lead-attachments',
  false,                                         -- PRIVATE (tylko ty widzisz)
  10485760,                                      -- 10 MB max per plik
  ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/heic', 'image/webp'];

-- RLS: anon może INSERT (upload), nie może SELECT/UPDATE/DELETE
-- Service_role (admin) ma pełen dostęp domyślnie
DROP POLICY IF EXISTS "anon_can_upload_lead_attachments" ON storage.objects;
CREATE POLICY "anon_can_upload_lead_attachments"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'lead-attachments');

-- Brak SELECT/UPDATE/DELETE policy = anon nie ma dostępu do odczytu
-- Ty (jako admin w Supabase Studio) widzisz wszystko z service_role
