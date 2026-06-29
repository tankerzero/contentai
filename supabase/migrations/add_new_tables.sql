-- ═══════════════════════════════════════════════════════════════════════════
-- ContentAI — Migration: Support Chats + Email Campaign Tables
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── support_chats ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.support_chats (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  messages   JSONB NOT NULL DEFAULT '[]',
  escalated  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.support_chats ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='support_chats' AND policyname='support_chats_owner'
  ) THEN
    CREATE POLICY support_chats_owner ON public.support_chats
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ── email_contacts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_contacts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  email       TEXT NOT NULL,
  name        TEXT,
  tags        TEXT[] DEFAULT '{}',
  subscribed  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT email_contacts_user_email_unique UNIQUE (user_id, email)
);

CREATE INDEX IF NOT EXISTS email_contacts_user_id_idx ON public.email_contacts (user_id);
ALTER TABLE public.email_contacts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='email_contacts' AND policyname='email_contacts_owner'
  ) THEN
    CREATE POLICY email_contacts_owner ON public.email_contacts
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ── email_campaigns ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  name           TEXT NOT NULL,
  subject        TEXT NOT NULL,
  content        TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'sending', 'sent', 'failed')),
  scheduled_at   TIMESTAMPTZ,
  sent_at        TIMESTAMPTZ,
  sends_count    INTEGER NOT NULL DEFAULT 0,
  opens_count    INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_campaigns_user_id_idx ON public.email_campaigns (user_id);
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='email_campaigns' AND policyname='email_campaigns_owner'
  ) THEN
    CREATE POLICY email_campaigns_owner ON public.email_campaigns
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ── email_sends ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.email_sends (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  campaign_id    UUID REFERENCES public.email_campaigns ON DELETE CASCADE NOT NULL,
  contact_id     UUID REFERENCES public.email_contacts ON DELETE SET NULL,
  email          TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'unsubscribed')),
  resend_id      TEXT,
  sent_at        TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS email_sends_campaign_id_idx ON public.email_sends (campaign_id);
CREATE INDEX IF NOT EXISTS email_sends_user_id_idx ON public.email_sends (user_id);
ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='email_sends' AND policyname='email_sends_owner'
  ) THEN
    CREATE POLICY email_sends_owner ON public.email_sends
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

-- ── Language constraint updates (run if not already done) ─────────────────
ALTER TABLE public.generations
  DROP CONSTRAINT IF EXISTS generations_language_check;
ALTER TABLE public.generations
  ADD CONSTRAINT generations_language_check
  CHECK (language IN ('en', 'fr', 'ar', 'es', 'zh'));

ALTER TABLE public.marketing_posts
  DROP CONSTRAINT IF EXISTS marketing_posts_language_check;
ALTER TABLE public.marketing_posts
  ADD CONSTRAINT marketing_posts_language_check
  CHECK (language IN ('en', 'fr', 'ar', 'es', 'zh'));

ALTER TABLE public.marketplace_templates
  DROP CONSTRAINT IF EXISTS marketplace_templates_language_check;
ALTER TABLE public.marketplace_templates
  ADD CONSTRAINT marketplace_templates_language_check
  CHECK (language IN ('en', 'fr', 'ar', 'es', 'zh'));
