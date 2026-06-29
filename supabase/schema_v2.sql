-- Schema v2: Content Management, Multi-Brand Profiles, Referrals
-- Run this in the Supabase SQL editor after schema.sql

-- ── Generations: add platform ─────────────────────────────────────────
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS platform TEXT;

-- Add delete RLS policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'generations' AND policyname = 'Users can delete own generations'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete own generations"
      ON public.generations FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ── Brand profiles: support multiple per user ─────────────────────────
-- Drop the single-profile unique constraint
ALTER TABLE public.brand_profiles
  DROP CONSTRAINT IF EXISTS brand_profiles_user_id_key;

ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS profile_name TEXT NOT NULL DEFAULT 'Default',
  ADD COLUMN IF NOT EXISTS is_default   BOOLEAN NOT NULL DEFAULT TRUE;

-- Only one default per user
CREATE UNIQUE INDEX IF NOT EXISTS brand_profiles_user_default_idx
  ON public.brand_profiles (user_id)
  WHERE is_default = TRUE;

-- RLS: add delete policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'brand_profiles' AND policyname = 'Users can delete own brand profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Users can delete own brand profiles"
      ON public.brand_profiles FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- ── Profiles: referral system ─────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code    TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_balance NUMERIC(10,2) NOT NULL DEFAULT 0;

-- Generate referral codes for existing users (first 8 hex chars of UUID)
UPDATE public.profiles
SET referral_code = LOWER(SUBSTRING(REPLACE(id::TEXT, '-', '') FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Auto-generate code for new signups (update the existing trigger function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, referral_code)
  VALUES (
    NEW.id,
    LOWER(SUBSTRING(REPLACE(NEW.id::TEXT, '-', '') FROM 1 FOR 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Referrals table ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referred_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'converted', 'paid')),
  commission  NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrers can view own referrals"
  ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "System can insert referrals"
  ON public.referrals FOR INSERT WITH CHECK (true);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals (referrer_id);
