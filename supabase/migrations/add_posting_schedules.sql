-- Migration: posting_schedules table + is_scheduled flag on social_posts
-- Safe to run multiple times

CREATE TABLE IF NOT EXISTS public.posting_schedules (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform       TEXT        NOT NULL DEFAULT 'twitter',
  frequency      TEXT        NOT NULL DEFAULT '1x_week',
  post_hour      INT         NOT NULL DEFAULT 9 CHECK (post_hour >= 0 AND post_hour <= 23),
  timezone       TEXT        NOT NULL DEFAULT 'UTC',
  content_type   TEXT        NOT NULL DEFAULT 'social_media',
  language       TEXT        NOT NULL DEFAULT 'en',
  topic          TEXT        NOT NULL DEFAULT '',
  is_active      BOOLEAN     NOT NULL DEFAULT TRUE,
  last_posted_at TIMESTAMPTZ,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- One schedule per user per platform
CREATE UNIQUE INDEX IF NOT EXISTS posting_schedules_user_platform_idx
  ON public.posting_schedules (user_id, platform);

ALTER TABLE public.posting_schedules ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posting_schedules' AND policyname = 'posting_schedules_select') THEN
    CREATE POLICY posting_schedules_select ON public.posting_schedules FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posting_schedules' AND policyname = 'posting_schedules_insert') THEN
    CREATE POLICY posting_schedules_insert ON public.posting_schedules FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posting_schedules' AND policyname = 'posting_schedules_update') THEN
    CREATE POLICY posting_schedules_update ON public.posting_schedules FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'posting_schedules' AND policyname = 'posting_schedules_delete') THEN
    CREATE POLICY posting_schedules_delete ON public.posting_schedules FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Flag to distinguish auto-scheduled posts from manual ones
ALTER TABLE public.social_posts
  ADD COLUMN IF NOT EXISTS is_scheduled BOOLEAN NOT NULL DEFAULT FALSE;
