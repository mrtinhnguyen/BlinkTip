/**
 * Thirdweb Server Wallet Service for Base
 *
 * Manages the agent's server-side wallet on Base using thirdweb SDK.
 * This wallet is used for autonomous tipping on Base blockchain.
 *
 * Similar to celo/thirdweb-wallet.ts but for Base chain.
 */

import { createThirdwebClient, defineChain } from "thirdweb";
import { getRpcClient, eth_getBalance, eth_blockNumber } from "thirdweb/rpc";

const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY!;
const THIRDWEB_SERVER_WALLET = process.env.THIRDWEB_SERVER_WALLET_ADDRESS!;
const BASE_CHAIN_ID = parseInt(process.env.BASE_CHAIN_ID || "8453"); // 8453 mainnet, 84532 Sepolia
const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const BASE_USDC_TOKEN = process.env.BASE_USDC_TOKEN!;

// Initialize thirdweb client (singleton)
let thirdwebClient: ReturnType<typeof createThirdwebClient> | null = null;

export function getThirdwebClient() {
  if (!thirdwebClient) {
    thirdwebClient = createThirdwebClient({
      secretKey: THIRDWEB_SECRET_KEY,
    });
  }
  return thirdwebClient;
}

// Define Base chain
export const baseChain = defineChain({
  id: BASE_CHAIN_ID,
  rpc: BASE_RPC_URL,
});

/**
 * Get the agent's server wallet address
 */
export function getServerWalletAddress(): string {
  return THIRDWEB_SERVER_WALLET;
}

/**
 * Get agent wallet balances on Base
 * Returns balances for native token (ETH) and stablecoin (USDC)
 */
export async function getAgentBalanceBase(): Promise<{
  address: string;
  balanceETH: number;
  balanceUSDC: number;
  blockNumber: number;
}> {
  try {
    const client = getThirdwebClient();
    const walletAddress = THIRDWEB_SERVER_WALLET;

    console.log(`[Base Wallet] Fetching balances for: ${walletAddress}`);

    // Get RPC client for the chain
    const rpcRequest = getRpcClient({ client, chain: baseChain });

    // Get native ETH balance
    const ethBalance = await eth_getBalance(rpcRequest, {
      address: walletAddress as `0x${string}`,
    });

    // Get current block number
    const blockNumber = await eth_blockNumber(rpcRequest);

    // Get ERC20 token balance (USDC) via direct RPC call
    let usdcBalance = BigInt(0);

    try {
      // Use public RPC for ERC20 balance queries
      const publicRpc = BASE_RPC_URL;

      // Query USDC balance (6 decimals)
      const usdcResult = await fetch(publicRpc, {
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
        usdcBalance = BigInt(usdcData.result);
      }
    } catch (error) {
      console.warn("[Base Wallet] Failed to fetch USDC balance:", error);
    }

    // Convert to human-readable amounts
    const balanceETH = Number(ethBalance) / 1e18;
    const balanceUSDC = Number(usdcBalance) / 1e6; // 6 decimals

    console.log("[Base Wallet] Balances:");
    console.log(`  ETH: ${balanceETH.toFixed(4)} ETH`);
    console.log(`  USDC: $${balanceUSDC.toFixed(2)}`);
    console.log(`  Block: ${blockNumber}`);

    return {
      address: walletAddress,
      balanceETH,
      balanceUSDC,
      blockNumber: Number(blockNumber),
    };
  } catch (error: unknown) {
    console.error("[Base Wallet] Error fetching balances:", error);
    throw new Error(
      `Failed to get Base wallet balance: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Check if agent wallet has sufficient balance for a tip
 */
export async function hasSufficientBalance(
  amount: number,
  token: "USDC" | "ETH"
): Promise<boolean> {
  const balances = await getAgentBalanceBase();

  switch (token) {
    case "USDC":
      return balances.balanceUSDC >= amount;
    case "ETH":
      return balances.balanceETH >= amount;
    default:
      return false;
  }
}

/**
 * Get wallet info summary
 */
export async function getWalletInfo(): Promise<string> {
  try {
    const balances = await getAgentBalanceBase();
    return `
Base Server Wallet: ${balances.address}
├─ ETH: ${balances.balanceETH.toFixed(4)} ETH
├─ USDC: $${balances.balanceUSDC.toFixed(2)}
└─ Block: ${balances.blockNumber}
    `.trim();
  } catch (error) {
    return `Error fetching Base wallet info: ${error instanceof Error ? error.message : String(error)}`;
  }
}

