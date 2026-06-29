-- ═══════════════════════════════════════════════════════════════════════════
-- ContentAI — Complete Database Schema
-- Combines schema.sql (v1) + schema_v2.sql + schema_v3.sql
--
-- Safe to run on a fresh Supabase project OR re-run on an existing one:
--   • CREATE TABLE IF NOT EXISTS on every table
--   • ALTER TABLE … ADD COLUMN IF NOT EXISTS for columns added in v2/v3
--   • CREATE INDEX IF NOT EXISTS on every index
--   • CREATE POLICY wrapped in DO blocks (no native IF NOT EXISTS in PG)
--   • CREATE OR REPLACE FUNCTION / DROP TRIGGER IF EXISTS for idempotency
-- ═══════════════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────────────
-- TABLES
-- ───────────────────────────────────────────────────────────────────────────

-- ── profiles (extends auth.users) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id                     UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  plan                   TEXT NOT NULL DEFAULT 'free'
                         CHECK (plan IN ('free', 'basic', 'pro', 'agency')),
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  referral_code          TEXT UNIQUE,
  referral_balance       NUMERIC(10,2) NOT NULL DEFAULT 0,
  welcome_sent_at        TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guard: add v2/v3 columns if the table pre-existed from v1
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code    TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS referral_balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS welcome_sent_at  TIMESTAMPTZ;

-- Backfill referral codes for any existing users that don't have one
UPDATE public.profiles
SET referral_code = LOWER(SUBSTRING(REPLACE(id::TEXT, '-', '') FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- ── generations ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.generations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL,
  topic        TEXT NOT NULL,
  tone         TEXT NOT NULL,
  language     TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fr', 'ar', 'es', 'zh')),
  content      TEXT NOT NULL,
  platform     TEXT,
  is_favorite  BOOLEAN NOT NULL DEFAULT FALSE,
  source       TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'planner')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guard: add platform column if table pre-existed from v1
ALTER TABLE public.generations
  ADD COLUMN IF NOT EXISTS platform TEXT;

-- ── brand_profiles ────────────────────────────────────────────────────────
-- Multiple profiles per user are allowed (Pro/Agency gate enforced in app).
-- No UNIQUE(user_id) — that constraint was dropped in v2.
CREATE TABLE IF NOT EXISTS public.brand_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  profile_name  TEXT NOT NULL DEFAULT 'Default',
  company_name  TEXT,
  industry      TEXT,
  values        TEXT,
  writing_style TEXT,
  tone_examples TEXT,
  is_default    BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guard: drop v1 single-profile unique constraint if it still exists
ALTER TABLE public.brand_profiles
  DROP CONSTRAINT IF EXISTS brand_profiles_user_id_key;

-- Guard: add v2 columns if table pre-existed from v1
ALTER TABLE public.brand_profiles
  ADD COLUMN IF NOT EXISTS profile_name TEXT NOT NULL DEFAULT 'Default',
  ADD COLUMN IF NOT EXISTS is_default   BOOLEAN NOT NULL DEFAULT TRUE;

-- Exactly one default profile per user
CREATE UNIQUE INDEX IF NOT EXISTS brand_profiles_user_default_idx
  ON public.brand_profiles (user_id)
  WHERE is_default = TRUE;

-- ── referrals ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  referred_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'converted', 'paid')),
  commission  NUMERIC(10,2) NOT NULL DEFAULT 0,
  paid_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Guard: add paid_at if table pre-existed from v2 without it
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- ── social_connections ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_connections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  platform         TEXT NOT NULL,
  username         TEXT,
  avatar_url       TEXT,
  access_token     TEXT,
  refresh_token    TEXT,
  token_expires_at TIMESTAMPTZ,
  posted_count     INT NOT NULL DEFAULT 0,
  connected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, platform)
);

-- ── social_posts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  generation_id UUID REFERENCES public.generations(id) ON DELETE SET NULL,
  platform      TEXT NOT NULL,
  content       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'posted', 'failed')),
  external_id   TEXT,
  error_message TEXT,
  posted_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── email_sequences ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_sequences (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  step       INT NOT NULL CHECK (step IN (0, 3, 7, 30)),
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_at  TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  UNIQUE (user_id, step)
);

-- ── marketing_posts ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketing_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content     TEXT NOT NULL,
  platform    TEXT NOT NULL,
  language    TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fr', 'ar', 'es', 'zh')),
  status      TEXT NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft', 'approved', 'posted')),
  posted_at   TIMESTAMPTZ,
  auto_posted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── marketplace_templates ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  content      TEXT NOT NULL,
  content_type TEXT NOT NULL,
  language     TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fr', 'ar', 'es', 'zh')),
  category     TEXT,
  price        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  sales_count  INT NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ───────────────────────────────────────────────────────────────────────────
-- TRIGGER: auto-create profile on signup
-- ───────────────────────────────────────────────────────────────────────────

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ───────────────────────────────────────────────────────────────────────────
-- ROW-LEVEL SECURITY
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_connections    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_posts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequences       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_posts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_templates ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY has no IF NOT EXISTS, so each is wrapped in a DO block.

-- profiles ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles'
    AND policyname = 'Users can view own profile') THEN
    EXECUTE 'CREATE POLICY "Users can view own profile"
      ON public.profiles FOR SELECT USING (auth.uid() = id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles'
    AND policyname = 'Users can update own profile') THEN
    EXECUTE 'CREATE POLICY "Users can update own profile"
      ON public.profiles FOR UPDATE USING (auth.uid() = id)';
  END IF;
END $$;

-- generations ───────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'generations'
    AND policyname = 'Users can view own generations') THEN
    EXECUTE 'CREATE POLICY "Users can view own generations"
      ON public.generations FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'generations'
    AND policyname = 'Users can insert own generations') THEN
    EXECUTE 'CREATE POLICY "Users can insert own generations"
      ON public.generations FOR INSERT WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'generations'
    AND policyname = 'Users can update own generations') THEN
    EXECUTE 'CREATE POLICY "Users can update own generations"
      ON public.generations FOR UPDATE USING (auth.uid() = user_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'generations'
    AND policyname = 'Users can delete own generations') THEN
    EXECUTE 'CREATE POLICY "Users can delete own generations"
      ON public.generations FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- brand_profiles ────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'brand_profiles'
    AND policyname = 'Users can manage own brand profile') THEN
    EXECUTE 'CREATE POLICY "Users can manage own brand profile"
      ON public.brand_profiles FOR ALL USING (auth.uid() = user_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'brand_profiles'
    AND policyname = 'Users can delete own brand profiles') THEN
    EXECUTE 'CREATE POLICY "Users can delete own brand profiles"
      ON public.brand_profiles FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- referrals ─────────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals'
    AND policyname = 'Referrers can view own referrals') THEN
    EXECUTE 'CREATE POLICY "Referrers can view own referrals"
      ON public.referrals FOR SELECT USING (auth.uid() = referrer_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'referrals'
    AND policyname = 'System can insert referrals') THEN
    EXECUTE 'CREATE POLICY "System can insert referrals"
      ON public.referrals FOR INSERT WITH CHECK (true)';
  END IF;
END $$;

-- social_connections ────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'social_connections'
    AND policyname = 'Users manage own social connections') THEN
    EXECUTE 'CREATE POLICY "Users manage own social connections"
      ON public.social_connections FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- social_posts ──────────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'social_posts'
    AND policyname = 'Users manage own social posts') THEN
    EXECUTE 'CREATE POLICY "Users manage own social posts"
      ON public.social_posts FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- email_sequences ───────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'email_sequences'
    AND policyname = 'Users view own email sequences') THEN
    EXECUTE 'CREATE POLICY "Users view own email sequences"
      ON public.email_sequences FOR SELECT USING (auth.uid() = user_id)';
  END IF;
END $$;

-- marketing_posts ───────────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketing_posts'
    AND policyname = 'Users manage own marketing posts') THEN
    EXECUTE 'CREATE POLICY "Users manage own marketing posts"
      ON public.marketing_posts FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

-- marketplace_templates ─────────────────────────────────────────────────────
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_templates'
    AND policyname = 'Sellers manage own templates') THEN
    EXECUTE 'CREATE POLICY "Sellers manage own templates"
      ON public.marketplace_templates FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_templates'
    AND policyname = 'Anyone can view active templates') THEN
    EXECUTE 'CREATE POLICY "Anyone can view active templates"
      ON public.marketplace_templates FOR SELECT USING (is_active = TRUE)';
  END IF;
END $$;


-- ───────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ───────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS generations_user_id_idx     ON public.generations (user_id);
CREATE INDEX IF NOT EXISTS generations_created_at_idx  ON public.generations (created_at DESC);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx      ON public.referrals (referrer_id);

CREATE INDEX IF NOT EXISTS social_connections_user_idx ON public.social_connections (user_id);

CREATE INDEX IF NOT EXISTS social_posts_user_idx       ON public.social_posts (user_id);
CREATE INDEX IF NOT EXISTS social_posts_created_idx    ON public.social_posts (created_at DESC);

CREATE INDEX IF NOT EXISTS email_sequences_user_idx    ON public.email_sequences (user_id);

CREATE INDEX IF NOT EXISTS marketing_posts_user_idx    ON public.marketing_posts (user_id);
CREATE INDEX IF NOT EXISTS marketing_posts_created_idx ON public.marketing_posts (created_at DESC);

CREATE INDEX IF NOT EXISTS marketplace_user_idx        ON public.marketplace_templates (user_id);
CREATE INDEX IF NOT EXISTS marketplace_active_idx      ON public.marketplace_templates (is_active, created_at DESC);
