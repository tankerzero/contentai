-- Migration: ensure brand_profiles has profile_name and is_default columns
-- Safe to run multiple times (ADD COLUMN IF NOT EXISTS)

ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS profile_name TEXT    NOT NULL DEFAULT 'Default',
  ADD COLUMN IF NOT EXISTS is_default   BOOLEAN NOT NULL DEFAULT FALSE;

-- One user can only have one default profile
CREATE UNIQUE INDEX IF NOT EXISTS brand_profiles_user_default_idx
  ON public.brand_profiles (user_id)
  WHERE is_default = TRUE;
