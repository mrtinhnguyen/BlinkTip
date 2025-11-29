/**
 * X402 Funding Endpoint for Agent Wallet (Base)
 *
 * GET /api/x402/fund-agent
 * - Returns agent wallet info for funding
 *
 * POST /api/x402/fund-agent
 * - x402 payment endpoint on Base
 * - Anyone can fund the agent's wallet with USDC on Base
 * - Returns 402 Payment Required until payment is verified
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerWalletAddress, getAgentBalanceBase } from "@/agent/lib/services/base/base-wallet";
import { createThirdwebClient, defineChain } from "thirdweb";
import { settlePayment, facilitator } from "thirdweb/x402";

export const dynamic = "force-dynamic";

// Environment configuration
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY!;
const THIRDWEB_SERVER_WALLET = process.env.THIRDWEB_SERVER_WALLET_ADDRESS!;
const BASE_CHAIN_ID = parseInt(process.env.BASE_CHAIN_ID || "8453"); // 8453 mainnet, 84532 Sepolia
const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";

// Token address on Base
const BASE_USDC_TOKEN = process.env.BASE_USDC_TOKEN! as `0x${string}`; // 6 decimals

// Initialize thirdweb client
const client = createThirdwebClient({
  secretKey: THIRDWEB_SECRET_KEY,
});

// Define Base chain
const baseChain = defineChain({
  id: BASE_CHAIN_ID,
  rpc: BASE_RPC_URL,
});

// Create thirdweb facilitator
const thirdwebFacilitator = facilitator({
  client,
  serverWalletAddress: THIRDWEB_SERVER_WALLET,
  waitUntil: "confirmed", // Wait for on-chain confirmation
});

/**
 * GET - Return agent wallet info
 */
export async function GET() {
  try {
    const walletAddress = getServerWalletAddress();
    const balance = await getAgentBalanceBase();
    const networkName = BASE_CHAIN_ID === 8453 ? "base-mainnet" : "base-sepolia";
    const explorerUrl = BASE_CHAIN_ID === 8453
      ? `https://basescan.org/address/${walletAddress}`
      : `https://sepolia.basescan.org/address/${walletAddress}`;

    return NextResponse.json({
      success: true,
      message: "LinkTip Autonomous Agent Funding (Base)",
      wallet: {
        address: walletAddress,
        network: networkName,
        chainId: BASE_CHAIN_ID,
        currentBalance: {
          eth: balance.balanceETH,
          usdc: balance.balanceUSDC,
        },
        canTip: balance.balanceUSDC >= 0.01,
        explorerUrl: explorerUrl,
      },
      fundingInstructions: {
        description:
          "Fund the agent wallet to enable autonomous tipping of crypto creators on Base",
        acceptedTokens: ["USDC"],
        minimumAmount: 0.01,
        recommendedAmount: 1.0,
        tipPerCreator: 0.1,
        howToFund: [
          "1. Send USDC directly to the agent wallet address above on Base",
          "2. Or use the x402 payment protocol via POST to this endpoint",
          BASE_CHAIN_ID === 8453
            ? "3. Get USDC from a DEX or bridge on Base"
            : "3. Get testnet USDC from Base Sepolia faucet",
        ],
      },
      x402Endpoint: {
        url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/x402/fund-agent`,
        method: "POST",
        queryParams: {
          amount: "Amount in USDC (e.g., 1.0)",
        },
        description: "Use x402 protocol for payment-gated funding on Base",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("❌ Error getting agent wallet info:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST - x402 payment endpoint on Base
 */
export async function POST(request: NextRequest) {
  try {
    // Get agent wallet address
    const walletAddress = getServerWalletAddress();

    // Get amount from query params
    const url = new URL(request.url);
    const amount = parseFloat(url.searchParams.get("amount") || "1.0");
    const token = url.searchParams.get("token") || "USDC";

    // Construct resource URL
    const resourceUrl = `${request.nextUrl.origin}${request.nextUrl.pathname}${request.nextUrl.search}`;

    // Price configuration for x402
    const priceConfig = {
      amount: amount.toString(),
      asset: {
        address: BASE_USDC_TOKEN,
        decimals: 6,
      },
    };

    // Extract payment header from request
    const paymentHeader = request.headers.get("x-payment");

    // Determine network name
    const networkName = BASE_CHAIN_ID === 8453 ? "base-mainnet" : "base-sepolia";

    if (!paymentHeader) {
      // Return 402 Payment Required
      console.log("[Base x402 Fund Agent] Returning 402 Payment Required");
      console.log(`  Amount: ${amount} ${token}`);
      console.log(`  Wallet: ${walletAddress}`);

      // Use settlePayment to get payment requirements
      // This will return 402 with payment requirements
      const result = await settlePayment({
        resourceUrl,
        method: "POST",
        paymentData: undefined, // No payment data yet
        payTo: walletAddress,
        network: baseChain,
        price: priceConfig,
        facilitator: thirdwebFacilitator,
        routeConfig: {
          description: "Fund LinkTip autonomous tipping agent on Base",
          mimeType: "application/json",
          maxTimeoutSeconds: 300,
        },
      });

      return NextResponse.json(
        'responseBody' in result ? result.responseBody : { error: 'Payment required' },
        {
          status: result.status,
          headers: result.responseHeaders,
        }
      );
    }

    // Process payment - X-PAYMENT header is present
    console.log("[Base x402 Fund Agent] Processing payment...");
    console.log(`  Amount: ${amount} ${token}`);
    console.log(`  Wallet: ${walletAddress}`);

    const result = await settlePayment({
      resourceUrl,
      method: "POST",
      paymentData: paymentHeader,
      payTo: walletAddress,
      network: baseChain,
      price: priceConfig,
      facilitator: thirdwebFacilitator,
      routeConfig: {
        description: "Fund LinkTip autonomous tipping agent on Base",
        mimeType: "application/json",
        maxTimeoutSeconds: 300,
      },
    });

    if (result.status !== 200) {
      const errorBody = 'responseBody' in result ? result.responseBody : { error: 'Payment failed' };
      console.error("[Base x402 Fund Agent] Payment failed:", errorBody);
      return NextResponse.json(errorBody, {
        status: result.status,
        headers: result.responseHeaders,
      });
    }

    console.log("[Base x402 Fund Agent] ✓ Payment settled successfully");
    const transactionHash = result.paymentReceipt?.transaction || "unknown";
    console.log(`[Base x402 Fund Agent] Transaction hash: ${transactionHash}`);

    // Get updated balance
    const balance = await getAgentBalanceBase();

    const explorerUrl = BASE_CHAIN_ID === 8453
      ? `https://basescan.org/tx/${transactionHash}`
      : `https://sepolia.basescan.org/tx/${transactionHash}`;

    return NextResponse.json({
      success: true,
      message: "Agent wallet funded successfully on Base!",
      payment: {
        amount: amount,
        token: token,
        transaction: transactionHash,
        network: networkName,
      },
      wallet: {
        address: walletAddress,
        newBalance: {
          eth: balance.balanceETH,
          usdc: balance.balanceUSDC,
        },
        explorerUrl: explorerUrl,
      },
      impact: {
        potentialTips: Math.floor(balance.balanceUSDC / 0.1),
        message: `Agent can now tip ~${Math.floor(balance.balanceUSDC / 0.1)} creators at $0.10 each`,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error("❌ x402 funding error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
