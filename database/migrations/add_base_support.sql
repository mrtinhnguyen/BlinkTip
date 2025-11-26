-- Migration: Add Base Chain Support and Unify EVM Wallet Address
-- This adds Base blockchain support and renames celo_wallet_address to evm_wallet_address
-- since one EVM address works for both Base and Celo

-- ============================================================================
-- 1. Update creators table - rename celo_wallet_address to evm_wallet_address
-- ============================================================================

-- Rename column to be more generic (works for Base, Celo, and any EVM chain)
ALTER TABLE creators
RENAME COLUMN celo_wallet_address TO evm_wallet_address;

-- Update index name
DROP INDEX IF EXISTS idx_creators_celo_wallet;
CREATE INDEX IF NOT EXISTS idx_creators_evm_wallet ON creators(evm_wallet_address);

COMMENT ON COLUMN creators.evm_wallet_address IS 'EVM wallet address for receiving tips on Base, Celo, and other EVM chains (0x...)';
COMMENT ON COLUMN creators.wallet_address IS 'Solana wallet address for receiving tips on Solana (base58)';

-- ============================================================================
-- 2. Update tips table to support Base chain
-- ============================================================================

-- Update chain constraint to include base
ALTER TABLE tips
DROP CONSTRAINT IF EXISTS valid_chain;

ALTER TABLE tips
ADD CONSTRAINT valid_chain CHECK (chain IN ('solana', 'celo', 'base'));

COMMENT ON COLUMN tips.chain IS 'Blockchain where the tip occurred: solana | base | celo';
COMMENT ON COLUMN tips.network IS 'Specific network: solana-devnet, solana-mainnet-beta, solana-testnet | base-mainnet, base-sepolia | celo-mainnet, celo-sepolia';

-- ============================================================================
-- 3. Update agent_actions table for Base support
-- ============================================================================

ALTER TABLE agent_actions
DROP CONSTRAINT IF EXISTS valid_agent_chain;

ALTER TABLE agent_actions
ADD CONSTRAINT valid_agent_chain CHECK (chain IN ('solana', 'celo', 'base', 'multi'));

COMMENT ON COLUMN agent_actions.chain IS 'Blockchain where the action occurred: solana | base | celo | multi (for cross-chain decisions)';

-- ============================================================================
-- 4. Update creator_stats view with Base support
-- ============================================================================

DROP VIEW IF EXISTS creator_stats;

CREATE OR REPLACE VIEW creator_stats AS
SELECT
  c.id,
  c.slug,
  c.name,
  c.wallet_address as solana_wallet,
  c.evm_wallet_address as evm_wallet,
  c.supported_chains,
  COUNT(DISTINCT t.id) as total_tips,
  COUNT(DISTINCT CASE WHEN t.source = 'human' THEN t.id END) as human_tips,
  COUNT(DISTINCT CASE WHEN t.source = 'agent' THEN t.id END) as agent_tips,

  -- Per-chain tip counts
  COUNT(DISTINCT CASE WHEN t.chain = 'solana' THEN t.id END) as solana_tips,
  COUNT(DISTINCT CASE WHEN t.chain = 'base' THEN t.id END) as base_tips,
  COUNT(DISTINCT CASE WHEN t.chain = 'celo' THEN t.id END) as celo_tips,

  -- Per-chain earnings
  COALESCE(SUM(CASE WHEN t.chain = 'solana' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as solana_earnings,
  COALESCE(SUM(CASE WHEN t.chain = 'base' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as base_earnings,
  COALESCE(SUM(CASE WHEN t.chain = 'celo' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as celo_earnings,

  -- Total earnings
  COALESCE(SUM(CASE WHEN t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as total_earnings,
  COALESCE(SUM(CASE WHEN t.source = 'human' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as human_earnings,
  COALESCE(SUM(CASE WHEN t.source = 'agent' AND t.status = 'confirmed' THEN t.amount ELSE 0 END), 0) as agent_earnings,
  MAX(t.created_at) as last_tip_at
FROM creators c
LEFT JOIN tips t ON c.id = t.creator_id
GROUP BY c.id, c.slug, c.name, c.wallet_address, c.evm_wallet_address, c.supported_chains;

-- ============================================================================
-- 5. Done
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Base chain support added and EVM wallet unified';
  RAISE NOTICE 'Key changes:';
  RAISE NOTICE '  - celo_wallet_address → evm_wallet_address (works for Base + Celo)';
  RAISE NOTICE '  - Added "base" to supported chains';
  RAISE NOTICE '  - Updated creator_stats view with Base metrics';
END $$;
