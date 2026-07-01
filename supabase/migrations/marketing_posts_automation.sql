-- Migration: marketing_posts automation pipeline
-- Run in Supabase SQL Editor (Project → SQL Editor → New query)

-- 1. Make user_id nullable (system posts have no user)
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'marketing_posts' AND column_name = 'user_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.marketing_posts ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- 2. Add new columns if not already present
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='marketing_posts' AND column_name='asset_url') THEN
    ALTER TABLE public.marketing_posts ADD COLUMN asset_url TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='marketing_posts' AND column_name='asset_type') THEN
    ALTER TABLE public.marketing_posts ADD COLUMN asset_type TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='marketing_posts' AND column_name='approval_token') THEN
    ALTER TABLE public.marketing_posts ADD COLUMN approval_token UUID DEFAULT gen_random_uuid();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='marketing_posts' AND column_name='scheduled_for') THEN
    ALTER TABLE public.marketing_posts ADD COLUMN scheduled_for TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='marketing_posts' AND column_name='approval_status') THEN
    ALTER TABLE public.marketing_posts ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending'
      CHECK (approval_status IN ('pending','approved','skipped'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='marketing_posts' AND column_name='approval_sent_at') THEN
    ALTER TABLE public.marketing_posts ADD COLUMN approval_sent_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='marketing_posts' AND column_name='posted_platform_id') THEN
    ALTER TABLE public.marketing_posts ADD COLUMN posted_platform_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='marketing_posts' AND column_name='error_message') THEN
    ALTER TABLE public.marketing_posts ADD COLUMN error_message TEXT;
  END IF;
END $$;

-- 3. Update status CHECK to include 'failed'
ALTER TABLE public.marketing_posts
  DROP CONSTRAINT IF EXISTS marketing_posts_status_check;
ALTER TABLE public.marketing_posts
  ADD CONSTRAINT marketing_posts_status_check
    CHECK (status IN ('draft', 'posted', 'failed'));

-- 4. Add unique index on approval_token
CREATE UNIQUE INDEX IF NOT EXISTS marketing_posts_approval_token_idx
  ON public.marketing_posts (approval_token)
  WHERE approval_token IS NOT NULL;

-- 5. SECURITY DEFINER RPC for inserting system posts (used by queue route + seed)
CREATE OR REPLACE FUNCTION public.insert_system_marketing_post(
  p_content        TEXT,
  p_platform       TEXT,
  p_language       TEXT,
  p_asset_url      TEXT       DEFAULT NULL,
  p_asset_type     TEXT       DEFAULT NULL,
  p_scheduled_for  TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token UUID := gen_random_uuid();
  v_id    UUID;
BEGIN
  INSERT INTO marketing_posts (
    content, platform, language, status,
    asset_url, asset_type, scheduled_for,
    approval_token, approval_status, approval_sent_at
  ) VALUES (
    p_content, p_platform, p_language, 'draft',
    p_asset_url, p_asset_type, p_scheduled_for,
    v_token, 'pending', NOW()
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('id', v_id, 'approval_token', v_token);
END;
$$;

-- Grant to service_role only (anon cannot call this directly)
REVOKE EXECUTE ON FUNCTION public.insert_system_marketing_post FROM anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.insert_system_marketing_post TO service_role;
