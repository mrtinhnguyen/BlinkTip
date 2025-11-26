-- Migration: Make wallet addresses nullable for multi-chain support
-- Allow creators to register with EITHER Solana OR EVM wallet (or both)
-- This fixes the issue where EVM-only users cannot register

-- ============================================================================
-- 1. Make wallet_address (Solana) nullable
-- ============================================================================

ALTER TABLE creators
ALTER COLUMN wallet_address DROP NOT NULL;

COMMENT ON COLUMN creators.wallet_address IS 'Solana wallet address for receiving tips on Solana (base58) - Optional if EVM wallet is provided';
COMMENT ON COLUMN creators.evm_wallet_address IS 'EVM wallet address for receiving tips on Base, Celo, and other EVM chains (0x...) - Optional if Solana wallet is provided';

-- ============================================================================
-- 2. Add check constraint to ensure at least one wallet is provided
-- ============================================================================

ALTER TABLE creators
ADD CONSTRAINT at_least_one_wallet CHECK (
  wallet_address IS NOT NULL OR evm_wallet_address IS NOT NULL
);

-- ============================================================================
-- 3. Done
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Migration completed: Wallet addresses are now nullable';
  RAISE NOTICE 'Key changes:';
  RAISE NOTICE '  - wallet_address (Solana) is now nullable';
  RAISE NOTICE '  - Added constraint: at least one wallet (Solana OR EVM) must be provided';
  RAISE NOTICE '  - Users can now register with EVM-only, Solana-only, or both';
END $$;
