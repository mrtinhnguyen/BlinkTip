-- Add Twitter verification columns to creators table
-- Migration: add_twitter_verification

-- Add Twitter OAuth columns
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS twitter_handle TEXT,
ADD COLUMN IF NOT EXISTS twitter_id TEXT,
ADD COLUMN IF NOT EXISTS twitter_name TEXT,
ADD COLUMN IF NOT EXISTS twitter_avatar_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_verified BOOLEAN DEFAULT FALSE;

-- Make wallet_address non-unique (same Twitter can connect different wallets)
ALTER TABLE creators DROP CONSTRAINT IF EXISTS creators_wallet_address_key;

-- Add unique constraint on twitter_id (one profile per Twitter account)
ALTER TABLE creators ADD CONSTRAINT unique_twitter_id UNIQUE(twitter_id);

-- Add index for Twitter handle lookups
CREATE INDEX IF NOT EXISTS idx_creators_twitter_handle ON creators(twitter_handle);
CREATE INDEX IF NOT EXISTS idx_creators_twitter_id ON creators(twitter_id);
CREATE INDEX IF NOT EXISTS idx_creators_twitter_verified ON creators(twitter_verified);

-- Add comments for documentation
COMMENT ON COLUMN creators.twitter_handle IS 'Twitter username without @ symbol';
COMMENT ON COLUMN creators.twitter_id IS 'Twitter user ID from OAuth (unique identifier)';
COMMENT ON COLUMN creators.twitter_name IS 'Twitter display name';
COMMENT ON COLUMN creators.twitter_avatar_url IS 'Twitter profile picture URL';
COMMENT ON COLUMN creators.twitter_verified IS 'Whether the creator has verified their Twitter account';
