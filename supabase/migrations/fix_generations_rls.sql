-- Migration: enable RLS and add all policies for generations
-- Safe to run multiple times

ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'generations' AND policyname = 'generations_select'
  ) THEN
    CREATE POLICY generations_select ON public.generations
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'generations' AND policyname = 'generations_insert'
  ) THEN
    CREATE POLICY generations_insert ON public.generations
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'generations' AND policyname = 'generations_update'
  ) THEN
    CREATE POLICY generations_update ON public.generations
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'generations' AND policyname = 'generations_delete'
  ) THEN
    CREATE POLICY generations_delete ON public.generations
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
