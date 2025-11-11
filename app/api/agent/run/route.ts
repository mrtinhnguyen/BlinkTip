/**
 * API Endpoint: POST /api/agent/run
 *
 * Triggers the autonomous tipping agent
 *
 * This endpoint can be called:
 * - Manually for testing/demos
 * - By Vercel Cron for autonomous operation
 * - By external services via webhook
 */

import { NextRequest, NextResponse } from "next/server";
import { runTippingAgent } from "@/agent/lib/agent";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max execution time

export async function POST(request: NextRequest) {
  console.log("\n🚀 Agent run triggered via API\n");

  try {
    // Optional: Add authentication for production
    // const authHeader = request.headers.get("authorization");
    // if (authHeader !== `Bearer ${process.env.AGENT_API_SECRET}`) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    // Run the agent
    const result = await runTippingAgent();

    return NextResponse.json(
      {
        success: result.success,
        message: result.success
          ? "Agent run completed successfully"
          : "Agent run failed",
        data: {
          creatorsAnalyzed: result.creatorsAnalyzed,
          tipsCreated: result.tipsCreated,
          skipped: result.skipped,
          errors: result.errors,
          decisions: result.decisions,
          walletBalance: result.walletBalance,
          stats: result.stats,
        },
        timestamp: new Date().toISOString(),
      },
      { status: result.success ? 200 : 500 }
    );
  } catch (error: any) {
    console.error("❌ API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Also support GET for easy browser testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "BlinkTip Autonomous Agent",
    usage: "Send POST request to /api/agent/run to trigger agent",
    documentation: "See /docs/agent.md for more info",
    timestamp: new Date().toISOString(),
  });
}
