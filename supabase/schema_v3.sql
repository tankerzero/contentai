-- Schema v3: Social Connections, Email Sequences, Marketing, Marketplace
-- Run in Supabase SQL editor after schema_v2.sql

-- ── profiles: email sequence tracking ─────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_sent_at TIMESTAMPTZ;

-- ── social_connections ─────────────────────────────────────────────────
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

ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own social connections"
  ON public.social_connections FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS social_connections_user_idx
  ON public.social_connections (user_id);

-- ── social_posts (post history) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_posts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  generation_id  UUID REFERENCES public.generations(id) ON DELETE SET NULL,
  platform       TEXT NOT NULL,
  content        TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'posted', 'failed')),
  external_id    TEXT,
  error_message  TEXT,
  posted_at      TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.social_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own social posts"
  ON public.social_posts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS social_posts_user_idx ON public.social_posts (user_id);
CREATE INDEX IF NOT EXISTS social_posts_created_idx ON public.social_posts (created_at DESC);

-- ── email_sequences ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_sequences (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  step       INT NOT NULL CHECK (step IN (0, 3, 7, 30)),
  sent_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  opened_at  TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  UNIQUE (user_id, step)
);

ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own email sequences"
  ON public.email_sequences FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS email_sequences_user_idx ON public.email_sequences (user_id);

-- ── marketing_posts ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketing_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content     TEXT NOT NULL,
  platform    TEXT NOT NULL,
  language    TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fr', 'ar')),
  status      TEXT NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft', 'approved', 'posted')),
  posted_at   TIMESTAMPTZ,
  auto_posted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.marketing_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own marketing posts"
  ON public.marketing_posts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS marketing_posts_user_idx ON public.marketing_posts (user_id);
CREATE INDEX IF NOT EXISTS marketing_posts_created_idx ON public.marketing_posts (created_at DESC);

-- ── marketplace_templates ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.marketplace_templates (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  content      TEXT NOT NULL,
  content_type TEXT NOT NULL,
  language     TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'fr', 'ar')),
  category     TEXT,
  price        NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  sales_count  INT NOT NULL DEFAULT 0,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.marketplace_templates ENABLE ROW LEVEL SECURITY;

-- Sellers can manage their own templates
CREATE POLICY "Sellers manage own templates"
  ON public.marketplace_templates FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Buyers can view active templates
CREATE POLICY "Anyone can view active templates"
  ON public.marketplace_templates FOR SELECT
  USING (is_active = TRUE);

CREATE INDEX IF NOT EXISTS marketplace_user_idx ON public.marketplace_templates (user_id);
CREATE INDEX IF NOT EXISTS marketplace_active_idx ON public.marketplace_templates (is_active, created_at DESC);

-- ── Update referrals to ensure paid_at column ──────────────────────────
ALTER TABLE public.referrals
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
