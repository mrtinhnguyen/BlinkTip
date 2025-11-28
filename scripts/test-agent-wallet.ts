/**
 * Test script for Solana Agent Wallet
 *
 * Tests:
 * - Solana wallet creation via CDP
 * - Balance checking
 * - Wallet address generation
 */

import { getOrCreateSolanaWallet, getSolanaAgentBalance } from "../agent/lib/services/solana/solana-wallet";

async function main() {
  console.log("\n Testing Solana Agent Wallet...\n");

  try {
    // Test 1: Create/Get Wallet
    console.log("Test 1: Creating/getting Solana agent wallet...");
    const wallet = await getOrCreateSolanaWallet();
    console.log(`✓ Wallet Address: ${wallet.address}`);
    const network = process.env.NEXT_PUBLIC_NETWORK || 'solana-mainnet-beta';
    const isMainnet = network === 'solana-mainnet-beta';
    const explorerUrl = isMainnet
      ? `https://explorer.solana.com/address/${wallet.address}`
      : `https://explorer.solana.com/address/${wallet.address}?cluster=devnet`;
    console.log(`  Explorer: ${explorerUrl}\n`);

    // Test 2: Check Balance
    console.log("Test 2: Checking Solana wallet balance...");
    const balance = await getSolanaAgentBalance();
    console.log(`✓ SOL Balance: ${balance.balanceSOL.toFixed(4)} SOL`);
    console.log(`✓ USDC Balance: $${balance.balanceUSDC.toFixed(2)} USDC`);
    console.log(`✓ Can Tip: ${balance.canTip ? "Yes" : "No"}`);

    if (balance.balanceUSDC > 0) {
      const potentialTips = Math.floor(balance.balanceUSDC / 0.1);
      console.log(`✓ Potential Tips: ${potentialTips} (at $0.10 each)\n`);
    } else {
      console.log(`  No USDC balance. Fund the wallet to enable tipping.\n`);
    }

    // Test 3: Request SOL (for gas fees)
    if (balance.balanceSOL < 0.1) {
      console.log("Test 3: Requesting SOL from faucet...");
      // Note: Faucet request requires manual interaction or CDP SDK method
      console.log("  Please fund the wallet manually or use CDP SDK faucet method");
      console.log("  For devnet: https://faucet.solana.com/");
      console.log("  For mainnet: Send SOL directly to wallet address\n");
    } else {
      console.log("Test 3: Skipping faucet (sufficient SOL balance)\n");
    }

    // Summary
    console.log(" Summary");
    console.log("─────────────────────────────");
    console.log(`Wallet: ${wallet.address}`);
    console.log(`SOL: ${balance.balanceSOL.toFixed(4)}`);
    console.log(`USDC: $${balance.balanceUSDC.toFixed(2)}`);
    console.log(`Status: ${balance.canTip ? "✓ Ready to tip" : "⚠️  Needs USDC funding"}`);
    console.log("\n✅ All tests passed!\n");

    if (!balance.canTip) {
      console.log("💡 To fund the agent:");
      const network = process.env.NEXT_PUBLIC_NETWORK || 'solana-mainnet-beta';
      const isMainnet = network === 'solana-mainnet-beta';
      if (isMainnet) {
        console.log(`   1. Send USDC mainnet tokens to: ${wallet.address}`);
      } else {
        console.log(`   1. Send USDC devnet tokens to: ${wallet.address}`);
        console.log("      Get devnet USDC from: https://spl-token-faucet.com");
      }
      console.log("   2. Or use the x402 funding endpoint:");
      console.log("      POST https://linktip.xyz/api/x402/fund-agent?amount=1.0\n");
    }

  } catch (error) {
    console.error("\n Test failed:", error);
    process.exit(1);
  }
}

main();
