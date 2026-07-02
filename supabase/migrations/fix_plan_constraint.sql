-- Migrate any remaining stale plan values to valid equivalents
UPDATE profiles SET plan = 'agency' WHERE plan NOT IN ('free', 'basic', 'pro', 'agency');

-- Replace the plan check constraint to include all valid plan IDs
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'basic', 'pro', 'agency'));

-- Revoke the broad GRANT ALL that was applied to social_connections during today's debugging.
-- authenticated + service_role are sufficient; anon must not have data access here.
-- RLS blocks row reads for anon regardless, but TRUNCATE is not row-scoped so we revoke explicitly.
REVOKE ALL ON social_connections FROM anon;
