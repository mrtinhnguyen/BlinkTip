/**
 * Debug Script: Check all possible USDC token addresses on Celo Sepolia
 */

const WALLET_ADDRESS = "0x6C55de0Cdd37E15774d62c07e6D9196ADB721134";
// Use public Celo Sepolia RPC (Forno)
const RPC_URL = "https://forno.celo-sepolia.celo-testnet.org";

// All possible USDC addresses to check
const USDC_ADDRESSES = [
  { name: "Circle Official USDC", address: "0x01C5C0122039549AD1493B8220cABEdD739BC44E" },
  { name: "Celo USDC Adapter", address: "0x2F25deB3848C207fc8E0c34035B3Ba7fC157602B" },
  { name: "Celo USDC (from docs)", address: "0x4822e58de6f5e485eF90df51C41CE01721331dC0" },
];

async function checkBalance(tokenAddress: string): Promise<bigint> {
  const data = `0x70a08231000000000000000000000000${WALLET_ADDRESS.slice(2).toLowerCase()}`;

  const response = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "eth_call",
      params: [{ to: tokenAddress, data }, "latest"],
      id: 1,
    }),
  });

  const result = await response.json();

  if (result.error) {
    console.log(`  Error: ${result.error.message}`);
    return BigInt(0);
  }

  if (result.result === "0x" || result.result === "0x0" || !result.result) {
    return BigInt(0);
  }

  return BigInt(result.result);
}

async function main() {
  console.log("=".repeat(60));
  console.log("Debugging USDC Token Addresses on Celo Sepolia");
  console.log("=".repeat(60));
  console.log(`\nWallet: ${WALLET_ADDRESS}\n`);

  for (const token of USDC_ADDRESSES) {
    console.log(`Checking ${token.name}:`);
    console.log(`  Address: ${token.address}`);

    const balance = await checkBalance(token.address);
    const balanceUSDC = Number(balance) / 1e6; // Assuming 6 decimals
    const balanceUSDC18 = Number(balance) / 1e18; // In case it's 18 decimals

    console.log(`  Raw balance: ${balance.toString()}`);
    console.log(`  As 6 decimals: $${balanceUSDC.toFixed(6)}`);
    console.log(`  As 18 decimals: $${balanceUSDC18.toFixed(18)}`);
    console.log("");
  }

  // Also check cUSD
  console.log("Checking cUSD:");
  console.log("  Address: 0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80");
  const cusdBalance = await checkBalance("0xEF4d55D6dE8e8d73232827Cd1e9b2F2dBb45bC80");
  console.log(`  Raw balance: ${cusdBalance.toString()}`);
  console.log(`  As 18 decimals: $${(Number(cusdBalance) / 1e18).toFixed(6)}`);
  console.log("");

  console.log("=".repeat(60));
}

main().catch(console.error);
