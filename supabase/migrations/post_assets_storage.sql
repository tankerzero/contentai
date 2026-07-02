-- Migration: Create 'post-assets' Supabase Storage bucket for user media and generated cards
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- Note: Supabase Storage buckets can also be created via the dashboard or the storage API.
-- This SQL approach uses the internal storage schema for automation.

-- Create the bucket (public = images served without auth)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-assets',
  'post-assets',
  TRUE,
  52428800,  -- 50 MB max per file
  ARRAY[
    'image/jpeg', 'image/png', 'image/webp',
    'video/mp4', 'video/quicktime'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- RLS: authenticated users can upload to their own folder
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'post-assets-user-upload'
  ) THEN
    CREATE POLICY "post-assets-user-upload"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'post-assets'
        AND (
          -- user uploads go under uploads/{uid}/...
          (storage.foldername(name))[1] = 'uploads'
          AND (storage.foldername(name))[2] = auth.uid()::text
          -- generated cards under generated/ or users/{uid}/
          OR (storage.foldername(name))[1] = 'generated'
          OR (
            (storage.foldername(name))[1] = 'users'
            AND (storage.foldername(name))[2] = auth.uid()::text
          )
        )
      );
  END IF;
END $$;

-- RLS: anyone can read public assets
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'post-assets-public-read'
  ) THEN
    CREATE POLICY "post-assets-public-read"
      ON storage.objects
      FOR SELECT
      TO public
      USING (bucket_id = 'post-assets');
  END IF;
END $$;

-- RLS: service role can upload generated cards (bypasses RLS anyway, but kept for documentation)
-- (service_role bypasses RLS by default — no policy needed)
