-- Add per-channel auto-post toggle to social_connections
ALTER TABLE social_connections
  ADD COLUMN IF NOT EXISTS auto_post_enabled boolean NOT NULL DEFAULT false;

-- Track whether a connection came from Buffer OAuth or a direct platform OAuth
ALTER TABLE social_connections
  ADD COLUMN IF NOT EXISTS connected_via text NOT NULL DEFAULT 'oauth';

-- Existing FB/IG rows were connected via Buffer — mark them accordingly
UPDATE social_connections SET connected_via = 'buffer' WHERE platform IN ('facebook', 'instagram');

-- Efficient lookup during publish runs
CREATE INDEX IF NOT EXISTS social_connections_auto_post_idx
  ON social_connections (user_id, platform) WHERE auto_post_enabled = true;
