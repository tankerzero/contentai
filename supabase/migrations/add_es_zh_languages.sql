-- Migration: add Spanish ('es') and Chinese ('zh') to language CHECK constraints
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'generations'
      AND column_name  = 'language'
  ) THEN
    ALTER TABLE public.generations
      DROP CONSTRAINT IF EXISTS generations_language_check,
      ADD CONSTRAINT generations_language_check
        CHECK (language IN ('en', 'fr', 'ar', 'es', 'zh'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'marketing_posts'
      AND column_name  = 'language'
  ) THEN
    ALTER TABLE public.marketing_posts
      DROP CONSTRAINT IF EXISTS marketing_posts_language_check,
      ADD CONSTRAINT marketing_posts_language_check
        CHECK (language IN ('en', 'fr', 'ar', 'es', 'zh'));
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'marketplace_templates'
      AND column_name  = 'language'
  ) THEN
    ALTER TABLE public.marketplace_templates
      DROP CONSTRAINT IF EXISTS marketplace_templates_language_check,
      ADD CONSTRAINT marketplace_templates_language_check
        CHECK (language IN ('en', 'fr', 'ar', 'es', 'zh'));
  END IF;
END $$;
