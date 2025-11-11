/**
 * API Endpoint: GET /api/agent/status
 *
 * Check agent wallet status and statistics
 */

import { NextResponse } from "next/server";
import { getAgentBalance, getOrCreateAgentWallet } from "@/agent/lib/services/cdp-wallet";
import { getAgentStats } from "@/agent/lib/services/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get wallet info
    const wallet = await getOrCreateAgentWallet();
    const balance = await getAgentBalance();

    // Get agent stats
    const stats = await getAgentStats();

    // Calculate potential tips
    const potentialTips = Math.floor(balance.balanceUSDC / 0.1);

    return NextResponse.json({
      success: true,
      wallet: {
        address: wallet.address,
        balanceSOL: balance.balanceSOL,
        balanceUSDC: balance.balanceUSDC,
        canTip: balance.canTip,
        potentialTips: potentialTips,
        explorerUrl: `https://explorer.solana.com/address/${wallet.address}?cluster=devnet`,
      },
      stats: {
        totalDecisions: stats.totalDecisions,
        totalTips: stats.totalTips,
        totalSkips: stats.totalSkips,
        totalTippedUSDC: stats.totalTippedUSDC,
        averageTipAmount:
          stats.totalTips > 0
            ? (stats.totalTippedUSDC / stats.totalTips).toFixed(2)
            : 0,
      },
      fundingInstructions: {
        method1: "Send USDC to agent wallet address via x402 protocol",
        method2: "Use Solana devnet faucet for testing",
        endpoint: `${process.env.NEXT_PUBLIC_BASE_URL}/api/x402/fund-agent`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Error getting agent status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
