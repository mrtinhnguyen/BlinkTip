-- Migration: Add Celo Multi-Chain Support (Safe Version)
-- This version handles existing data that might violate new constraints

-- ============================================================================
-- 1. Update creators table to support multi-chain wallets
-- ============================================================================

ALTER TABLE creators
ADD COLUMN IF NOT EXISTS celo_wallet_address TEXT;

ALTER TABLE creators
ADD COLUMN IF NOT EXISTS supported_chains JSONB DEFAULT '["solana"]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_creators_celo_wallet ON creators(celo_wallet_address);

COMMENT ON COLUMN creators.celo_wallet_address IS 'EVM wallet address for receiving tips on Celo (0x...)';
COMMENT ON COLUMN creators.supported_chains IS 'Array of blockchains this creator accepts tips on: ["solana", "celo"]';

-- ============================================================================
-- 2. Update tips table to track which blockchain was used
-- ============================================================================

ALTER TABLE tips
ADD COLUMN IF NOT EXISTS chain TEXT DEFAULT 'solana';

ALTER TABLE tips
ADD COLUMN IF NOT EXISTS network TEXT;

-- First, fix any existing invalid token values (if any)
-- This updates tokens that aren't USDC, CASH, or cUSD to 'USDC'
UPDATE tips 
SET token = 'USDC' 
WHERE token NOT IN ('USDC', 'CASH', 'cUSD');

-- Now safely drop and recreate the constraint
ALTER TABLE tips
DROP CONSTRAINT IF EXISTS valid_token;

ALTER TABLE tips
ADD CONSTRAINT valid_token CHECK (token IN ('USDC', 'CASH', 'cUSD'));

-- Add chain constraint (safe since we just added column with default)
ALTER TABLE tips
DROP CONSTRAINT IF EXISTS valid_chain;

ALTER TABLE tips
ADD CONSTRAINT valid_chain CHECK (chain IN ('solana', 'celo'));

CREATE INDEX IF NOT EXISTS idx_tips_chain ON tips(chain);
CREATE INDEX IF NOT EXISTS idx_tips_network ON tips(network);

COMMENT ON COLUMN tips.chain IS 'Blockchain where the tip occurred: solana | celo';
COMMENT ON COLUMN tips.network IS 'Specific network: solana-devnet, solana-mainnet-beta, celo-sepolia, celo-mainnet';
COMMENT ON COLUMN tips.token IS 'Token used for tip: USDC, CASH (Solana) | USDC, cUSD (Celo)';

-- ============================================================================
-- 3. Update agent_actions table for multi-chain tracking
-- ============================================================================

ALTER TABLE agent_actions
ADD COLUMN IF NOT EXISTS chain TEXT DEFAULT 'solana';

-- Add constraint safely
ALTER TABLE agent_actions
DROP CONSTRAINT IF EXISTS valid_agent_chain;

ALTER TABLE agent_actions
ADD CONSTRAINT valid_agent_chain CHECK (chain IN ('solana', 'celo', 'multi'));

CREATE INDEX IF NOT EXISTS idx_agent_actions_chain ON agent_actions(chain);

COMMENT ON COLUMN agent_actions.chain IS 'Blockchain where the action occurred: solana | celo | multi (for cross-chain decisions)';

-- ============================================================================
-- 4. Update creator_stats view
-- ============================================================================

DROP VIEW IF EXISTS creator_stats;

CREATE OR REPLACE VIEW creator_stats AS
SELECT
  c.id,
  c.slug,
  c.name,
  c.wallet_address as solana_wallet,
  c.celo_wallet_address as celo_wallet,
  c.supported_chains,
  COUNT(DISTINCT t.id) as total_tips,
  COUNT(DISTINCT CASE WHEN t.source = 'human' THEN t.id END) as human_tips,
  COUNT(DISTINCT CASE WHEN t.source = 'agent' THEN t.id END) as agent_tips,
  COUNT(DISTINCT CASE WHEN t.chain = 'solana' THEN t.id END) as solana_tips,
  COALESCE(SUM(CASE WHEN t.chain = 'solana' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as solana_earnings,
  COUNT(DISTINCT CASE WHEN t.chain = 'celo' THEN t.id END) as celo_tips,
  COALESCE(SUM(CASE WHEN t.chain = 'celo' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as celo_earnings,
  COALESCE(SUM(CASE WHEN t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as total_earnings,
  COALESCE(SUM(CASE WHEN t.source = 'human' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as human_earnings,
  COALESCE(SUM(CASE WHEN t.source = 'agent' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as agent_earnings,
  MAX(t.created_at) as last_tip_at
FROM creators c
LEFT JOIN tips t ON c.id = t.creator_id
GROUP BY c.id, c.slug, c.name, c.wallet_address, c.celo_wallet_address, c.supported_chains;

-- ============================================================================
-- 5. Done
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Celo multi-chain support added';
END $$;
