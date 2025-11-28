/**
 * Base x402 Payment Endpoint
 *
 * Handles tipping on Base blockchain using thirdweb's x402 protocol.
 * Supports USDC stablecoin on Base mainnet or Base Sepolia testnet.
 *
 * Flow:
 * 1. GET: Returns 402 Payment Required with payment requirements
 * 2. POST: Verifies payment and settles on-chain via thirdweb facilitator
 */

import { NextRequest, NextResponse } from "next/server";
import { createThirdwebClient, defineChain } from "thirdweb";
import { settlePayment, facilitator } from "thirdweb/x402";
import { supabase } from "@/lib/supabase";

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
 * Redistribute USDC from server wallet to creator wallet
 * This is needed because thirdweb facilitator routes payments to server wallet first
 */
async function redistributeToCreator(
  creatorAddress: string,
  amount: number
): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
  try {
    const decimals = 6; // USDC has 6 decimals
    const amountInBaseUnits = (amount * Math.pow(10, decimals)).toString();

    console.log(`[Base x402] Redistributing ${amount} USDC to creator...`);
    console.log(`  From: ${THIRDWEB_SERVER_WALLET}`);
    console.log(`  To: ${creatorAddress}`);
    console.log(`  Amount: ${amountInBaseUnits} base units`);

    // Prepare ERC20 transfer data
    // Function signature: transfer(address,uint256) = 0xa9059cbb
    // Address: remove 0x, lowercase, pad to 64 hex chars (32 bytes)
    // Amount: convert to hex, pad to 64 hex chars (32 bytes)
    const addressHex = creatorAddress.slice(2).toLowerCase().padStart(64, '0');
    const amountHex = BigInt(amountInBaseUnits).toString(16).padStart(64, '0');
    const transferData = `0xa9059cbb${addressHex}${amountHex}`;

    // Call thirdweb transaction API to send ERC20 transfer
    const txResponse = await fetch("https://api.thirdweb.com/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret-key": THIRDWEB_SECRET_KEY,
      },
      body: JSON.stringify({
        chainId: BASE_CHAIN_ID.toString(),
        from: THIRDWEB_SERVER_WALLET,
        transactions: [
          {
            to: BASE_USDC_TOKEN,
            data: transferData,
          },
        ],
      }),
    });

    if (!txResponse.ok) {
      const errorData = await txResponse.json();
      console.error("[Base x402] Redistribution failed:", errorData);
      return {
        success: false,
        error: `Redistribution failed: ${errorData.message || "Unknown error"}`,
      };
    }

    const txData = await txResponse.json();
    const transactionHash = txData.result?.transactionHash || txData.transactionHash;

    if (!transactionHash) {
      console.error("[Base x402] No transaction hash in redistribution response:", txData);
      return {
        success: false,
        error: "No transaction hash returned from redistribution",
      };
    }

    console.log(`[Base x402] ✓ Redistribution successful: ${transactionHash}`);
    return {
      success: true,
      transactionHash,
    };
  } catch (error: unknown) {
    console.error("[Base x402] Redistribution error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown redistribution error",
    };
  }
}

/**
 * GET /api/x402/tip/[slug]/pay-base?amount=X&token=USDC&agent_id=...
 *
 * Returns 402 Payment Required with payment requirements for thirdweb x402 client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const amount = parseFloat(searchParams.get("amount") || "0");
    const token = searchParams.get("token") || "USDC";
    const agentId = searchParams.get("agent_id");
    const contentUrl = searchParams.get("content_url");

    // Check for x-payment header first (if present, this is a retry with payment)
    const paymentHeader = request.headers.get("x-payment");

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Validate token
    if (token !== "USDC") {
      return NextResponse.json(
        { error: "Unsupported token. Use USDC" },
        { status: 400 }
      );
    }

    // Get creator info
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("*")
      .eq("slug", slug)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    // Check if creator has EVM wallet (works for both Base and Celo)
    if (!creator.evm_wallet_address) {
      return NextResponse.json(
        { error: "Creator does not accept tips on Base" },
        { status: 400 }
      );
    }

    // Determine token address and price format
    const priceConfig = {
      amount: (amount * 1_000_000).toString(), // USDC has 6 decimals
      asset: {
        address: BASE_USDC_TOKEN,
        decimals: 6,
      },
    };

    // Construct resource URL (this endpoint)
    const resourceUrl = `${request.nextUrl.origin}${request.nextUrl.pathname}${request.nextUrl.search}`;

    // Determine network name for database
    const networkName = BASE_CHAIN_ID === 8453 ? "base-mainnet" : "base-sepolia";

    if (paymentHeader) {
      // Process payment - X-PAYMENT header is present
      console.log("[Base x402] Received payment header, settling payment...");
      console.log(`  Amount: ${amount} ${token}`);
      console.log(`  Creator: ${creator.slug} (${creator.evm_wallet_address})`);

      const result = await settlePayment({
        resourceUrl,
        method: "GET",
        paymentData: paymentHeader,
        payTo: creator.evm_wallet_address,
        network: baseChain,
        price: priceConfig,
        facilitator: thirdwebFacilitator,
        routeConfig: {
          description: `Tip ${creator.name} (@${creator.slug}) on LinkTip`,
          mimeType: "application/json",
          maxTimeoutSeconds: 300,
        },
      });

      if (result.status !== 200) {
        const errorBody = 'responseBody' in result ? result.responseBody : { error: 'Payment failed' };
        console.error("[Base x402] Payment failed:", errorBody);
        return NextResponse.json(errorBody, {
          status: result.status,
          headers: result.responseHeaders,
        });
      }

      console.log("[Base x402] ✓ Payment settled successfully");
      const facilitatorTxHash = result.paymentReceipt?.transaction || "unknown";
      console.log(`[Base x402] Facilitator transaction hash: ${facilitatorTxHash}`);

      // Redistribute payment from server wallet to creator wallet
      // thirdweb facilitator routes payment to server wallet, we need to forward it to creator
      const redistribution = await redistributeToCreator(
        creator.evm_wallet_address,
        amount
      );

      if (!redistribution.success) {
        console.error("[Base x402] ⚠️ Redistribution failed, but payment was received by server wallet");
        console.error(`  Error: ${redistribution.error}`);
        // Continue anyway - payment was received, just not redistributed yet
        // Could implement retry logic or manual redistribution later
      }

      // Use redistribution transaction hash if available, otherwise use facilitator hash
      const transactionHash = redistribution.transactionHash || facilitatorTxHash;

      // Record tip in database
      const isAgentTip = !!agentId;
      const source = isAgentTip ? "agent" : "human";

      const { data: tip, error: tipError } = await supabase
        .from("tips")
        .insert({
          creator_id: creator.id,
          from_address: result.paymentReceipt?.payer || "unknown",
          amount: amount,
          token: token,
          signature: transactionHash,
          source: source,
          status: "confirmed",
          chain: "base",
          network: networkName,
          is_agent_tip: isAgentTip,
          agent_reasoning: isAgentTip ? "Tipped via Base x402 protocol" : null,
          metadata: {
            agent_id: agentId,
            content_url: contentUrl,
            protocol: "x402-base",
            facilitator: "thirdweb",
            facilitator_tx: facilitatorTxHash,
            redistribution_tx: redistribution.transactionHash || null,
            redistribution_success: redistribution.success,
            server_first: true, // Payment went through server wallet first
          },
        })
        .select()
        .single();

      if (tipError) {
        console.error("[Base x402] Failed to record tip:", tipError);
      } else {
        console.log(`[Base x402] ✓ Tip recorded in database (ID: ${tip.id})`);
      }

      return NextResponse.json(
        {
          success: true,
          message: "Tip sent successfully!",
          amount: amount,
          token: token,
          chain: "base",
          network: networkName,
          transactionHash: transactionHash,
          creator: {
            slug: creator.slug,
            name: creator.name,
            wallet: creator.evm_wallet_address,
          },
        },
        {
          status: 200,
          headers: result.responseHeaders,
        }
      );
    } else {
      // No payment header - return 402 with payment requirements
      console.log("[Base x402] No payment header, returning 402 payment requirements");
      console.log(`  Creator wallet (payTo): ${creator.evm_wallet_address}`);
      console.log(`  Server wallet (facilitator): ${THIRDWEB_SERVER_WALLET}`);

      const result = await settlePayment({
        resourceUrl,
        method: "GET",
        paymentData: null,
        payTo: creator.evm_wallet_address,
        network: baseChain,
        price: priceConfig,
        facilitator: thirdwebFacilitator,
        routeConfig: {
          description: `Tip ${creator.name} (@${creator.slug}) on LinkTip`,
          mimeType: "application/json",
          maxTimeoutSeconds: 300,
        },
      });

      const responseBody = result.status === 200
        ? { success: true }
        : ('responseBody' in result ? result.responseBody : { error: 'Failed to generate payment requirements' });

      type PaymentResponse = {
        accepts?: Array<{
          payTo?: string;
          extra?: {
            facilitatorAddress?: string;
          };
        }>;
      };

      const paymentResponse = responseBody as PaymentResponse;
      console.log("[Base x402] 402 Response payTo:", paymentResponse?.accepts?.[0]?.payTo);
      console.log("[Base x402] 402 Response facilitator:", paymentResponse?.accepts?.[0]?.extra?.facilitatorAddress);

      return NextResponse.json(responseBody, {
        status: result.status,
        headers: result.responseHeaders,
      });
    }
  } catch (error: unknown) {
    console.error("[Base x402] GET error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate payment requirements",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/x402/tip/[slug]/pay-base?amount=X&token=USDC
 *
 * Verifies payment via thirdweb facilitator and records tip in database
 * Expects X-PAYMENT header with signed transaction
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const amount = parseFloat(searchParams.get("amount") || "0");
    const token = searchParams.get("token") || "USDC";
    const agentId = searchParams.get("agent_id");
    const contentUrl = searchParams.get("content_url");

    // Get payment data from header
    const paymentData = request.headers.get("x-payment");

    if (!paymentData) {
      return NextResponse.json(
        { error: "Missing X-PAYMENT header" },
        { status: 400 }
      );
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid amount" },
        { status: 400 }
      );
    }

    // Validate token
    if (token !== "USDC") {
      return NextResponse.json(
        { error: "Unsupported token. Use USDC" },
        { status: 400 }
      );
    }

    // Get creator info
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("*")
      .eq("slug", slug)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    // Check if creator has EVM wallet
    if (!creator.evm_wallet_address) {
      return NextResponse.json(
        { error: "Creator does not accept tips on Base" },
        { status: 400 }
      );
    }

    // Determine price config
    const priceConfig = {
      amount: (amount * 1_000_000).toString(), // USDC has 6 decimals
      asset: {
        address: BASE_USDC_TOKEN,
        decimals: 6,
      },
    };

    // Construct resource URL
    const resourceUrl = `${request.nextUrl.origin}${request.nextUrl.pathname}${request.nextUrl.search}`;

    // Determine network name for database
    const networkName = BASE_CHAIN_ID === 8453 ? "base-mainnet" : "base-sepolia";

    console.log("[Base x402] Settling payment...");
    console.log(`  Amount: ${amount} ${token}`);
    console.log(`  Creator: ${creator.slug} (${creator.evm_wallet_address})`);
    console.log(`  Agent: ${agentId || "human"}`);

    // Verify and settle payment via thirdweb facilitator
    const result = await settlePayment({
      resourceUrl,
      method: "POST",
      paymentData,
      payTo: creator.evm_wallet_address,
      network: baseChain,
      price: priceConfig,
      facilitator: thirdwebFacilitator,
      routeConfig: {
        description: `Tip ${creator.name} (@${creator.slug}) on LinkTip`,
        mimeType: "application/json",
        maxTimeoutSeconds: 300,
      },
    });

    // Check if payment was successful
    if (result.status !== 200) {
      const errorBody = 'responseBody' in result ? result.responseBody : { error: 'Payment failed' };
      console.error("[Base x402] Payment failed:", errorBody);
      return NextResponse.json(errorBody, {
        status: result.status,
        headers: result.responseHeaders,
      });
    }

    console.log("[Base x402] ✓ Payment settled successfully");
    const facilitatorTxHash = result.paymentReceipt?.transaction || "unknown";
    console.log(`[Base x402] Facilitator transaction hash: ${facilitatorTxHash}`);

    // Redistribute payment from server wallet to creator wallet
    // thirdweb facilitator routes payment to server wallet, we need to forward it to creator
    const redistribution = await redistributeToCreator(
      creator.evm_wallet_address,
      amount
    );

    if (!redistribution.success) {
      console.error("[Base x402] ⚠️ Redistribution failed, but payment was received by server wallet");
      console.error(`  Error: ${redistribution.error}`);
      // Continue anyway - payment was received, just not redistributed yet
      // Could implement retry logic or manual redistribution later
    }

    // Use redistribution transaction hash if available, otherwise use facilitator hash
    const transactionHash = redistribution.transactionHash || facilitatorTxHash;

    // Determine tip source and sender address
    const isAgentTip = !!agentId;
    const source = isAgentTip ? "agent" : "human";

    // For agent tips, use server wallet address
    // For human tips, extract from payment data (would need to decode)
    const fromAddress = isAgentTip
      ? THIRDWEB_SERVER_WALLET
      : result.paymentReceipt?.payer || "human-wallet-address";

    // Record tip in database
    const { data: tip, error: tipError } = await supabase
      .from("tips")
      .insert({
        creator_id: creator.id,
        from_address: fromAddress,
        amount: amount,
        token: token,
        signature: transactionHash,
        source: source,
        status: "confirmed", // thirdweb waits for confirmation
        chain: "base",
        network: networkName,
        is_agent_tip: isAgentTip,
        agent_reasoning: isAgentTip ? "Tipped via Base x402 protocol" : null,
        metadata: {
          agent_id: agentId,
          content_url: contentUrl,
          protocol: "x402-base",
          facilitator: "thirdweb",
          facilitator_tx: facilitatorTxHash,
          redistribution_tx: redistribution.transactionHash || null,
          redistribution_success: redistribution.success,
          server_first: true, // Payment went through server wallet first
        },
      })
      .select()
      .single();

    if (tipError) {
      console.error("[Base x402] Failed to record tip:", tipError);
      // Don't fail the request - payment already went through
    } else {
      console.log(`[Base x402] ✓ Tip recorded in database (ID: ${tip.id})`);

      // If agent tip, also record in agent_actions
      if (isAgentTip) {
        await supabase.from("agent_actions").insert({
          twitter_handle: creator.twitter_handle,
          content_url: contentUrl || `https://linktip.xyz/tip/${creator.slug}`,
          content_title: creator.name,
          decision: "tip",
          tip_id: tip.id,
          reasoning: "Autonomous tip via Base x402 protocol",
          chain: "base",
          evaluation_score: null,
          content_source: "x402-base",
          metadata: {
            agent_id: agentId,
            amount: amount,
            token: token,
            transaction_hash: transactionHash,
          },
        });
      }
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Tip sent successfully!",
        amount: amount,
        token: token,
        chain: "base",
        network: networkName,
        transactionHash: transactionHash,
        creator: {
          slug: creator.slug,
          name: creator.name,
          wallet: creator.evm_wallet_address,
        },
      },
      {
        status: 200,
        headers: result.responseHeaders,
      }
    );
  } catch (error: unknown) {
    console.error("[Base x402] POST error:", error);
    return NextResponse.json(
      {
        error: "Failed to process payment",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

