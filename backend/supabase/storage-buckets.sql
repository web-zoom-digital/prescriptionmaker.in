-- =============================================================================
-- SUPABASE STORAGE BUCKETS SETUP
-- =============================================================================
-- Run this in Supabase SQL Editor to create storage buckets
-- =============================================================================

-- Create storage buckets (Private — only accessible via signed URLs or service role)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'doctor-assets',
    'doctor-assets',
    false,
    5242880,  -- 5 MB limit
    ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
  ),
  (
    'prescription-pdfs',
    'prescription-pdfs',
    false,
    10485760, -- 10 MB limit
    ARRAY['application/pdf']
  ),
  (
    'canvas-previews',
    'canvas-previews',
    false,
    5242880,  -- 5 MB limit
    ARRAY['image/png', 'image/jpeg', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- =============================================================================
-- STORAGE RLS POLICIES
-- =============================================================================

-- doctor-assets: Users can upload/read their own assets only
CREATE POLICY "doctor_assets_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'doctor-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "doctor_assets_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'doctor-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "doctor_assets_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'doctor-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "doctor_assets_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'doctor-assets'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- prescription-pdfs: Users can only access their own PDFs
CREATE POLICY "prescription_pdfs_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'prescription-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "prescription_pdfs_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'prescription-pdfs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- canvas-previews: Same pattern
CREATE POLICY "canvas_previews_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'canvas-previews'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "canvas_previews_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'canvas-previews'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
