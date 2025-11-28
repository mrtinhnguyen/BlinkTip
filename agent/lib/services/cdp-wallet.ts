/**
 * Base Chain Wallet Service for Autonomous Agent
 *
 * This service handles:
 * - Managing the agent's Base wallet via thirdweb
 * - Checking balance (ETH and USDC)
 * - Sending USDC tips to creators
 * - Signing transactions on Base
 */

import { createThirdwebClient, defineChain } from "thirdweb";
import { getRpcClient, eth_getBalance } from "thirdweb/rpc";

const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY!;
const THIRDWEB_SERVER_WALLET = process.env.THIRDWEB_SERVER_WALLET_ADDRESS!;
const BASE_CHAIN_ID = parseInt(process.env.BASE_CHAIN_ID || "8453"); // 8453 mainnet, 84532 Sepolia
const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const BASE_USDC_TOKEN = process.env.BASE_USDC_TOKEN! as `0x${string}`;

// Lazy initialization of thirdweb client to avoid build-time errors
let thirdwebClient: ReturnType<typeof createThirdwebClient> | null = null;

function getThirdwebClient() {
  if (!thirdwebClient) {
    thirdwebClient = createThirdwebClient({
      secretKey: THIRDWEB_SECRET_KEY,
    });
  }
  return thirdwebClient;
}

// Define Base chain
const baseChain = defineChain({
  id: BASE_CHAIN_ID,
  rpc: BASE_RPC_URL,
});

export interface AgentWalletInfo {
  address: string;
  balanceETH: number;
  balanceUSDC: number;
  canTip: boolean;
}

export interface TipResult {
  success: boolean;
  signature?: string;
  error?: string;
  amount?: number;
  recipient?: string;
}

export async function getOrCreateAgentWallet() {
  try {
    // For Base, we use the server wallet address directly
    // No need to create account like Solana CDP
    const address = THIRDWEB_SERVER_WALLET;
    console.log(`[Base Wallet] Agent wallet: ${address}`);
    return { address };
  } catch (error) {
    console.error("[Base Wallet] Error getting agent wallet:", error);
    throw error;
  }
}

/**
 * Get agent wallet balance (both ETH and USDC)
 */
export async function getAgentBalance(): Promise<AgentWalletInfo> {
  try {
    const account = await getOrCreateAgentWallet();
    const walletAddress = account.address as `0x${string}`;

    const client = getThirdwebClient();
    const rpcRequest = getRpcClient({ client, chain: baseChain });

    // Get native ETH balance
    const ethBalance = await eth_getBalance(rpcRequest, {
      address: walletAddress,
    });
    const balanceETH = Number(ethBalance) / 1e18;

    // Get USDC balance via ERC20 balanceOf call
    let balanceUSDC = 0;
    try {
      const usdcResult = await fetch(BASE_RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_call",
          params: [
            {
              to: BASE_USDC_TOKEN,
              data: `0x70a08231000000000000000000000000${walletAddress.slice(2).toLowerCase()}`,
            },
            "latest",
          ],
          id: 1,
        }),
      });
      const usdcData = await usdcResult.json();
      if (usdcData.result && usdcData.result !== "0x") {
        balanceUSDC = Number(BigInt(usdcData.result)) / 1e6; // USDC has 6 decimals
      }
    } catch {
      console.log("[Base Wallet] No USDC token balance yet");
    }

    return {
      address: account.address,
      balanceETH,
      balanceUSDC,
      canTip: balanceUSDC >= 0.01, // Need at least $0.01 USDC
    };
  } catch (error) {
    console.error("[Base Wallet] Error getting balance:", error);
    throw error;
  }
}

/**
 * Send USDC tip to a creator on Base
 *
 * @param creatorWallet - Creator's EVM wallet address (Base)
 * @param amountUSDC - Amount in USDC (e.g., 0.10 for 10 cents)
 * @param reason - Why the agent is tipping
 */
export async function sendUSDCTip(
  creatorWallet: string,
  amountUSDC: number,
  reason: string
): Promise<TipResult> {
  try {
    console.log(
      `[Base Wallet] Sending ${amountUSDC} USDC to ${creatorWallet}`
    );
    console.log(`[Base Wallet] Reason: ${reason}`);

    // Get agent account
    const account = await getOrCreateAgentWallet();

    // Check balance
    const walletInfo = await getAgentBalance();
    if (walletInfo.balanceUSDC < amountUSDC) {
      return {
        success: false,
        error: `Insufficient USDC. Have: $${walletInfo.balanceUSDC.toFixed(
          2
        )}, Need: $${amountUSDC.toFixed(2)}`,
      };
    }

    // Convert USDC amount to token amount (6 decimals for USDC)
    const amountInBaseUnits = (amountUSDC * 1_000_000).toString();

    // Prepare ERC20 transfer data
    // Function signature: transfer(address,uint256) = 0xa9059cbb
    const addressHex = creatorWallet.slice(2).toLowerCase().padStart(64, '0');
    const amountHex = BigInt(amountInBaseUnits).toString(16).padStart(64, '0');
    const transferData = `0xa9059cbb${addressHex}${amountHex}`;

    // Call thirdweb transaction API to send ERC20 transfer
    console.log("[Base Wallet] Sending transaction via thirdweb API...");
    const txResponse = await fetch("https://api.thirdweb.com/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-secret-key": THIRDWEB_SECRET_KEY,
      },
      body: JSON.stringify({
        chainId: BASE_CHAIN_ID.toString(),
        from: account.address,
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
      console.error("[Base Wallet] Transaction API error:", errorData);
      return {
        success: false,
        error: `Transaction failed: ${errorData.message || "Unknown error"}`,
      };
    }

    const txData = await txResponse.json();
    const transactionHash = txData.result?.transactionHash || txData.transactionHash;

    if (!transactionHash) {
      return {
        success: false,
        error: "No transaction hash returned",
      };
    }

    console.log(
      `[Base Wallet] ✓ Tipped $${amountUSDC} USDC to ${creatorWallet}`
    );
    const explorerUrl = BASE_CHAIN_ID === 8453
      ? `https://basescan.org/tx/${transactionHash}`
      : `https://sepolia.basescan.org/tx/${transactionHash}`;
    console.log(`[Base Wallet] Transaction: ${explorerUrl}`);

    return {
      success: true,
      signature: transactionHash,
      amount: amountUSDC,
      recipient: creatorWallet,
    };
  } catch (error: unknown) {
    console.error("[Base Wallet] Tip failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Request ETH from Base Sepolia faucet (for gas fees)
 * Note: For mainnet, you need to fund the wallet manually
 */
export async function requestDevnetSOL(): Promise<boolean> {
  try {
    const account = await getOrCreateAgentWallet();

    if (BASE_CHAIN_ID === 8453) {
      console.log("[Base Wallet] Mainnet detected - cannot use faucet. Please fund wallet manually.");
      return false;
    }

    console.log("[Base Wallet] Requesting ETH from Base Sepolia faucet...");
    // Base Sepolia faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
    // Or use: https://app.optimism.io/faucet
    console.log("[Base Wallet] Please use Base Sepolia faucet to fund wallet:");
    console.log(`[Base Wallet] Address: ${account.address}`);
    console.log("[Base Wallet] Faucet: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet");

    return false; // Faucet requires manual interaction
  } catch (error) {
    console.error("[Base Wallet] Faucet request failed:", error);
    return false;
  }
}
