/**
 * Base Tipping Service for Agent
 *
 * Implements autonomous agent tipping on Base via x402 protocol using thirdweb.
 * Supports USDC (6 decimals) stablecoin.
 *
 * This service uses thirdweb's x402 client-side wrapper to pay for API endpoints.
 */

import { createThirdwebClient } from "thirdweb";
import { wrapFetchWithPayment } from "thirdweb/x402";
import { getAgentBalanceBase, baseChain } from "./base-wallet";
import { supabase } from "@/lib/supabase";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY!;
const THIRDWEB_SERVER_WALLET = process.env.THIRDWEB_SERVER_WALLET_ADDRESS!;

export interface BaseTipResult {
  success: boolean;
  signature?: string;
  error?: string;
  amount?: number;
  token?: string;
}

/**
 * Tip a creator on Base via x402 protocol
 *
 * Uses thirdweb's wrapFetchWithPayment to handle x402 flow automatically
 *
 * @param creatorSlug - Creator's slug
 * @param amountUSDC - Tip amount in USDC
 * @param reason - AI reasoning for tip
 * @returns Tip result with transaction signature
 */
export async function tipCreatorViaBaseX402(
  creatorSlug: string,
  amountUSDC: number,
  reason: string
): Promise<BaseTipResult> {
  try {
    console.log(`[Base Tipper] Tipping @${creatorSlug} via Base x402...`);
    console.log(`[Base Tipper] Amount: $${amountUSDC} USDC`);
    console.log(`[Base Tipper] Reason: ${reason}`);

    // Check agent balance first
    const balance = await getAgentBalanceBase();

    if (balance.balanceUSDC < amountUSDC) {
      return {
        success: false,
        error: `Insufficient USDC. Have: $${balance.balanceUSDC.toFixed(2)}, Need: $${amountUSDC.toFixed(2)}`,
      };
    }

    // Get creator info
    const creatorResponse = await fetch(`${BASE_URL}/api/creators?slug=${creatorSlug}`);
    if (!creatorResponse.ok) {
      return {
        success: false,
        error: "Creator not found",
      };
    }

    const { creator } = await creatorResponse.json();

    if (!creator.evm_wallet_address) {
      return {
        success: false,
        error: "Creator does not accept tips on Base",
      };
    }

    // Construct x402 endpoint URL
    const x402Endpoint = `${BASE_URL}/api/x402/tip/${creatorSlug}/pay-base?amount=${amountUSDC}&token=USDC&agent_id=linktip_agent&content_url=https://twitter.com/${creator.twitter_handle}`;

    console.log(`[Base Tipper] Calling x402 endpoint...`);

    // Use thirdweb's transaction API
    const result = await tipViaThirdwebAPI(
      x402Endpoint,
      creator,
      amountUSDC,
      reason
    );

    return result;
  } catch (error: unknown) {
    console.error("[Base Tipper] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Alternative: Tip using thirdweb's transaction API directly
 *
 * This bypasses x402 and sends ERC20 transfer directly from server wallet
 */
async function tipViaThirdwebAPI(
  endpoint: string,
  creator: any,
  amount: number,
  reason: string
): Promise<BaseTipResult> {
  try {
    const BASE_CHAIN_ID = process.env.BASE_CHAIN_ID || "8453";
    const BASE_USDC_TOKEN = process.env.BASE_USDC_TOKEN!;

    // Determine token address and decimals
    const tokenAddress = BASE_USDC_TOKEN;
    const decimals = 6;
    const amountInBaseUnits = (amount * Math.pow(10, decimals)).toString();

    console.log(`[Base Tipper] Preparing ERC20 transfer...`);
    console.log(`  Token: USDC (${tokenAddress})`);
    console.log(`  Amount: ${amount} USDC (${amountInBaseUnits} base units)`);
    console.log(`  To: ${creator.evm_wallet_address}`);

    // Call thirdweb transaction API to send ERC20 transfer
    const txResponse = await fetch("https://api.thirdweb.com/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret-key": THIRDWEB_SECRET_KEY,
      },
      body: JSON.stringify({
        chainId: BASE_CHAIN_ID,
        from: THIRDWEB_SERVER_WALLET,
        transactions: [
          {
            to: tokenAddress,
            // ERC20 transfer(address to, uint256 amount)
            data: `0xa9059cbb000000000000000000000000${creator.evm_wallet_address.slice(2)}${BigInt(amountInBaseUnits).toString(16).padStart(64, '0')}`,
          },
        ],
      }),
    });

    if (!txResponse.ok) {
      const errorData = await txResponse.json();
      console.error("[Base Tipper] Transaction API error:", errorData);
      return {
        success: false,
        error: `Transaction failed: ${errorData.message || "Unknown error"}`,
      };
    }

    const txData = await txResponse.json();
    const transactionHash = txData.result?.transactionHash || txData.transactionHash;

    if (!transactionHash) {
      console.error("[Base Tipper] No transaction hash in response:", txData);
      return {
        success: false,
        error: "No transaction hash returned",
      };
    }

    console.log(`[Base Tipper] ✓ Transaction sent: ${transactionHash}`);

    // Record tip in database
    try {
      const { data: creatorData, error: creatorError } = await supabase
        .from("creators")
        .select("*")
        .eq("evm_wallet_address", creator.evm_wallet_address)
        .single();

      if (creatorError || !creatorData) {
        console.log(`[Base Tipper] ⚠️ Creator not found in database`);
      } else {
        // Determine network name
        const BASE_CHAIN_ID = parseInt(process.env.BASE_CHAIN_ID || "8453");
        const networkName = BASE_CHAIN_ID === 8453 ? "base-mainnet" : "base-sepolia";

        // Record tip
        const { data: tip, error: tipError } = await supabase
          .from("tips")
          .insert({
            creator_id: creatorData.id,
            from_address: THIRDWEB_SERVER_WALLET,
            amount: amount,
            token: "USDC",
            signature: transactionHash,
            source: "agent",
            status: "confirmed",
            chain: "base",
            network: networkName,
            is_agent_tip: true,
            agent_reasoning: reason,
            metadata: {
              network: networkName,
              protocol: "thirdweb-direct",
              agent_id: "linktip_agent",
            },
          })
          .select()
          .single();

        if (tipError) {
          console.error("[Base Tipper] Failed to record tip:", tipError);
        } else {
          console.log(`[Base Tipper] ✓ Tip recorded in database! Tip ID: ${tip.id}`);

          // Record agent decision
          await supabase.from("agent_actions").insert({
            twitter_handle: creatorData.twitter_handle,
            content_url: `https://twitter.com/${creatorData.twitter_handle}`,
            content_title: creatorData.name,
            decision: "tip",
            tip_id: tip.id,
            reasoning: reason || "Autonomous tip on Base",
            chain: "base",
            yaps_score_7d: null,
            yaps_score_30d: null,
            evaluation_score: null,
            content_source: "base-direct",
            metadata: {
              agent_id: "linktip_agent",
              network: networkName,
              amount: amount,
              token: "USDC",
              signature: transactionHash,
            },
          });

          console.log(`[Base Tipper] ✓ Agent action recorded`);
        }
      }
    } catch (error: unknown) {
      console.log(`[Base Tipper] ⚠️ Database recording error:`, error instanceof Error ? error.message : String(error));
    }

    return {
      success: true,
      signature: transactionHash,
      amount: amount,
      token: "USDC",
    };
  } catch (error: unknown) {
    console.error("[Base Tipper] tipViaThirdwebAPI error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get Base tipping status
 */
export async function getBaseTippingStatus(): Promise<{
  enabled: boolean;
  balance: number;
  currency: string;
}> {
  try {
    const balance = await getAgentBalanceBase();
    return {
      enabled: balance.balanceUSDC > 0,
      balance: balance.balanceUSDC,
      currency: "USDC",
    };
  } catch (error) {
    return {
      enabled: false,
      balance: 0,
      currency: "USDC",
    };
  }
}

