-- Migration: ensure all RLS policies exist on generations table
-- Safe to run multiple times (checks before creating)

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'generations' AND policyname = 'Users can insert own generations'
  ) THEN
    CREATE POLICY "Users can insert own generations"
      ON public.generations FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'generations' AND policyname = 'Users can view own generations'
  ) THEN
    CREATE POLICY "Users can view own generations"
      ON public.generations FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'generations' AND policyname = 'Users can update own generations'
  ) THEN
    CREATE POLICY "Users can update own generations"
      ON public.generations FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'generations' AND policyname = 'Users can delete own generations'
  ) THEN
    CREATE POLICY "Users can delete own generations"
      ON public.generations FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
