/**
 * Solana Wallet Service for Autonomous Agent
 *
 * This service handles:
 * - Creating/loading the agent's Solana wallet via CDP
 * - Checking balance (SOL and USDC)
 * - Used for Solana tipping operations
 */

import { CdpClient } from "@coinbase/cdp-sdk";
import {
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
} from "@solana/spl-token";

// Lazy initialization of CDP client to avoid build-time errors
let cdp: CdpClient | null = null;

function getCdpClient(): CdpClient {
  if (!cdp) {
    cdp = new CdpClient();
  }
  return cdp;
}

// Solana configuration - default to mainnet for production
const SOLANA_NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'solana-mainnet-beta';
const IS_MAINNET = SOLANA_NETWORK === 'solana-mainnet-beta';
const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || (IS_MAINNET 
  ? "https://api.mainnet-beta.solana.com" 
  : "https://api.devnet.solana.com");
const USDC_MINT = new PublicKey(
  IS_MAINNET
    ? "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" // Mainnet
    : "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr" // Devnet
);

const connection = new Connection(SOLANA_RPC_URL, "confirmed");

export interface SolanaWalletInfo {
  address: string;
  balanceSOL: number;
  balanceUSDC: number;
  canTip: boolean;
}

export async function getOrCreateSolanaWallet() {
  try {
    const cdpClient = getCdpClient();
    const account = await cdpClient.solana.getOrCreateAccount({ name: "linktip-agent-solana" });
    console.log(`[Solana Wallet] Agent wallet: ${account.address}`);
    return account;
  } catch (error) {
    console.error("[Solana Wallet] Error creating/getting agent wallet:", error);
    throw error;
  }
}

/**
 * Get agent Solana wallet balance (both SOL and USDC)
 */
export async function getSolanaAgentBalance(): Promise<SolanaWalletInfo> {
  try {
    const account = await getOrCreateSolanaWallet();
    const pubkey = new PublicKey(account.address);

    // Get SOL balance
    const balanceLamports = await connection.getBalance(pubkey);
    const balanceSOL = balanceLamports / LAMPORTS_PER_SOL;

    // Get USDC balance
    let balanceUSDC = 0;
    try {
      const usdcTokenAccount = await getAssociatedTokenAddress(
        USDC_MINT,
        pubkey
      );
      const tokenAccountInfo = await connection.getTokenAccountBalance(
        usdcTokenAccount
      );
      balanceUSDC = Number(tokenAccountInfo.value.uiAmount || 0);
    } catch (error) {
      // Token account doesn't exist yet - that's okay
      console.log("[Solana Wallet] No USDC token account yet");
    }

    return {
      address: account.address,
      balanceSOL,
      balanceUSDC,
      canTip: balanceUSDC >= 0.01, // Need at least $0.01 USDC
    };
  } catch (error) {
    console.error("[Solana Wallet] Error getting balance:", error);
    throw error;
  }
}

