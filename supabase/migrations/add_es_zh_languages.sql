-- Migration: add Spanish ('es') and Chinese ('zh') to language CHECK constraints
-- Run this in Supabase SQL Editor (Project → SQL Editor → New query)

ALTER TABLE public.generations
  DROP CONSTRAINT IF EXISTS generations_language_check,
  ADD CONSTRAINT generations_language_check
    CHECK (language IN ('en', 'fr', 'ar', 'es', 'zh'));

ALTER TABLE public.marketing_posts
  DROP CONSTRAINT IF EXISTS marketing_posts_language_check,
  ADD CONSTRAINT marketing_posts_language_check
    CHECK (language IN ('en', 'fr', 'ar', 'es', 'zh'));

ALTER TABLE public.marketplace_templates
  DROP CONSTRAINT IF EXISTS marketplace_templates_language_check,
  ADD CONSTRAINT marketplace_templates_language_check
    CHECK (language IN ('en', 'fr', 'ar', 'es', 'zh'));
