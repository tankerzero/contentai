-- Migration: enable RLS and add all policies for brand_profiles
-- Safe to run multiple times

ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'brand_profiles' AND policyname = 'brand_profiles_select'
  ) THEN
    CREATE POLICY brand_profiles_select ON public.brand_profiles
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'brand_profiles' AND policyname = 'brand_profiles_insert'
  ) THEN
    CREATE POLICY brand_profiles_insert ON public.brand_profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'brand_profiles' AND policyname = 'brand_profiles_update'
  ) THEN
    CREATE POLICY brand_profiles_update ON public.brand_profiles
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'brand_profiles' AND policyname = 'brand_profiles_delete'
  ) THEN
    CREATE POLICY brand_profiles_delete ON public.brand_profiles
      FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
