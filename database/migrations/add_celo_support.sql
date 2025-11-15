-- Migration: Add Celo Multi-Chain Support
-- Created: 2025-01-14
-- Description: Adds support for Celo blockchain alongside existing Solana support

-- ============================================================================
-- 1. Update creators table to support multi-chain wallets
-- ============================================================================

-- Add Celo wallet address (EVM address)
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS celo_wallet_address TEXT;

-- Add supported chains array
ALTER TABLE creators
ADD COLUMN IF NOT EXISTS supported_chains JSONB DEFAULT '["solana"]'::jsonb;

-- Add index for Celo wallet lookups
CREATE INDEX IF NOT EXISTS idx_creators_celo_wallet ON creators(celo_wallet_address);

-- Add comment
COMMENT ON COLUMN creators.celo_wallet_address IS 'EVM wallet address for receiving tips on Celo (0x...)';
COMMENT ON COLUMN creators.supported_chains IS 'Array of blockchains this creator accepts tips on: ["solana", "celo"]';

-- ============================================================================
-- 2. Update tips table to track which blockchain was used
-- ============================================================================

-- Add chain column to identify which blockchain the tip was on
ALTER TABLE tips
ADD COLUMN IF NOT EXISTS chain TEXT DEFAULT 'solana' CHECK (chain IN ('solana', 'celo'));

-- Add network column for specific network (devnet, mainnet, testnet, etc.)
ALTER TABLE tips
ADD COLUMN IF NOT EXISTS network TEXT;

-- Update token constraint to include Celo tokens
ALTER TABLE tips
DROP CONSTRAINT IF EXISTS valid_token;

ALTER TABLE tips
ADD CONSTRAINT valid_token CHECK (token IN ('USDC', 'CASH', 'cUSD'));

-- Add index for chain queries
CREATE INDEX IF NOT EXISTS idx_tips_chain ON tips(chain);
CREATE INDEX IF NOT EXISTS idx_tips_network ON tips(network);

-- Add comments
COMMENT ON COLUMN tips.chain IS 'Blockchain where the tip occurred: solana | celo';
COMMENT ON COLUMN tips.network IS 'Specific network: solana-devnet, solana-mainnet-beta, celo-sepolia, celo-mainnet';
COMMENT ON COLUMN tips.token IS 'Token used for tip: USDC, CASH (Solana) | USDC, cUSD (Celo)';

-- ============================================================================
-- 3. Update agent_actions table for multi-chain tracking
-- ============================================================================

-- Add chain column to agent actions
ALTER TABLE agent_actions
ADD COLUMN IF NOT EXISTS chain TEXT DEFAULT 'solana' CHECK (chain IN ('solana', 'celo', 'multi'));

-- Add index
CREATE INDEX IF NOT EXISTS idx_agent_actions_chain ON agent_actions(chain);

-- Add comment
COMMENT ON COLUMN agent_actions.chain IS 'Blockchain where the action occurred: solana | celo | multi (for cross-chain decisions)';

-- ============================================================================
-- 4. Update creator_stats view to show per-chain statistics
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

  -- Overall stats
  COUNT(DISTINCT t.id) as total_tips,
  COUNT(DISTINCT CASE WHEN t.source = 'human' THEN t.id END) as human_tips,
  COUNT(DISTINCT CASE WHEN t.source = 'agent' THEN t.id END) as agent_tips,

  -- Solana stats
  COUNT(DISTINCT CASE WHEN t.chain = 'solana' THEN t.id END) as solana_tips,
  COALESCE(SUM(CASE WHEN t.chain = 'solana' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as solana_earnings,

  -- Celo stats
  COUNT(DISTINCT CASE WHEN t.chain = 'celo' THEN t.id END) as celo_tips,
  COALESCE(SUM(CASE WHEN t.chain = 'celo' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as celo_earnings,

  -- Total earnings across all chains
  COALESCE(SUM(CASE WHEN t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as total_earnings,
  COALESCE(SUM(CASE WHEN t.source = 'human' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as human_earnings,
  COALESCE(SUM(CASE WHEN t.source = 'agent' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as agent_earnings,

  MAX(t.created_at) as last_tip_at
FROM creators c
LEFT JOIN tips t ON c.id = t.creator_id
GROUP BY c.id, c.slug, c.name, c.wallet_address, c.celo_wallet_address, c.supported_chains;

COMMENT ON VIEW creator_stats IS 'Aggregated statistics for creators across all blockchains';

-- ============================================================================
-- 5. Create helper function to validate wallet addresses
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_wallet_address(
  address TEXT,
  chain_type TEXT
) RETURNS BOOLEAN AS $$
BEGIN
  IF chain_type = 'solana' THEN
    -- Solana addresses are base58 encoded, 32-44 characters
    RETURN address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$';
  ELSIF chain_type = 'celo' OR chain_type = 'evm' THEN
    -- EVM addresses start with 0x and are 42 characters (0x + 40 hex)
    RETURN address ~* '^0x[0-9a-f]{40}$';
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION validate_wallet_address IS 'Validates wallet address format for different blockchains';

-- ============================================================================
-- 6. Add validation constraints (optional, can be added later)
-- ============================================================================

-- Uncomment these if you want strict validation
-- ALTER TABLE creators
-- ADD CONSTRAINT valid_solana_wallet CHECK (
--   wallet_address IS NULL OR validate_wallet_address(wallet_address, 'solana')
-- );

-- ALTER TABLE creators
-- ADD CONSTRAINT valid_celo_wallet CHECK (
--   celo_wallet_address IS NULL OR validate_wallet_address(celo_wallet_address, 'celo')
-- );

-- ============================================================================
-- 7. Migration complete message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Celo multi-chain support added';
  RAISE NOTICE 'Creators can now have both Solana and Celo wallets';
  RAISE NOTICE 'Tips table now tracks chain and network';
  RAISE NOTICE 'Creator stats view updated with per-chain statistics';
END $$;
