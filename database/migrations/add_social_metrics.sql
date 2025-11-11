-- Add social metrics to creators table for agent evaluation
-- These fields come from Twitter OAuth 2.0 public_metrics

ALTER TABLE creators
  ADD COLUMN IF NOT EXISTS twitter_follower_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS twitter_created_at TIMESTAMP;

-- Update existing creators to have 0 followers if NULL
UPDATE creators
SET twitter_follower_count = 0
WHERE twitter_follower_count IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN creators.twitter_follower_count IS 'Twitter follower count from OAuth public_metrics';
COMMENT ON COLUMN creators.twitter_created_at IS 'Twitter account creation date from OAuth';
