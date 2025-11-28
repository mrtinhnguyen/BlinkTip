/**
 * LinkTip Autonomous Tipping Agent - Multi-Chain Edition
 *
 * This agent:
 * 1. Discovers verified creators from LinkTip database
 * 2. Fetches their Kaito Yaps scores (influence metrics)
 * 3. Uses AI (OpenRouter + Claude) to decide who to tip
 * 4. Sends USDC tips on MULTIPLE chains:
 *    - Solana (via CDP Server-Side Wallet + x402)
 *    - Celo (via Thirdweb Server Wallet + x402)
 * 5. Logs all decisions to database for transparency
 *
 * Multi-Chain Strategy:
 * - If creator supports BOTH chains: tip on BOTH ($0.05 each)
 * - If creator supports ONE chain: tip on that chain ($0.10)
 */

import { ChatOpenAI } from "@langchain/openai";
import {
  getAllVerifiedCreators,
  checkRecentAgentTip,
  logAgentDecision,
  getAgentStats,
  type Creator,
} from "./services/database";
import {
  getYapsScore,
  analyzeYapsScore,
  type KaitoYapsScore,
} from "./services/kaito";
import { getAgentBalanceBase, getServerWalletAddress } from "./services/base/base-wallet";
import { tipCreatorViaBaseX402 } from "./services/base/base-tipper";
import { getSolanaAgentBalance, getOrCreateSolanaWallet } from "./services/solana/solana-wallet";
import { tipCreatorViaX402 } from "./services/x402-tipper";
import { getAgentBalanceCelo } from "./services/celo/thirdweb-wallet";
import { tipCreatorViaCeloX402 } from "./services/celo/celo-tipper";

// Agent configuration
const AGENT_CONFIG = {
  MIN_YAPS_THRESHOLD: 0, // Minimum 7-day Yaps score to consider 
  TIP_AMOUNT_USDC: 0.1, // $0.10 per tip
  MAX_TIPS_PER_RUN: 5, // Max tips in a single run
  DAYS_BETWEEN_TIPS: 7, // Don't tip same creator within 7 days
};

export interface AgentRunResult {
  success: boolean;
  creatorsAnalyzed: number;
  tipsCreated: number;
  solanaTips: number;
  celoTips: number;
  baseTips: number;
  skipped: number;
  errors: string[];
  decisions: Array<{
    creator: string;
    decision: "TIP" | "SKIP";
    reason: string;
    amount?: number;
    chains?: string[]; // Which chains were tipped
    signatures?: { chain: string; signature: string }[];
  }>;
  walletBalances: {
    solana: {
      sol: number;
      usdc: number;
    };
    celo: {
      celo: number;
      usdc: number;
      cusd: number;
    };
    base: {
      eth: number;
      usdc: number;
    };
  };
  stats: {
    totalDecisions: number;
    totalTips: number;
    totalSkips: number;
    totalTippedUSDC: number;
  };
}

/**
 * Initialize OpenRouter LLM client
 */
function initializeAI() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY not found in environment variables");
  }

  return new ChatOpenAI({
    model: "anthropic/claude-sonnet-4",
    apiKey: apiKey,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
    temperature: 0.7,
  });
}

/**
 * AI analyzes creator and decides whether to tip
 */
async function aiDecision(
  creator: Creator,
  yapsScore: KaitoYapsScore | null,
  recentTipCheck: { wasTippedRecently: boolean; recommendation: string }
): Promise<{ decision: "TIP" | "SKIP"; reason: string }> {
  const llm = initializeAI();

  // Calculate account age in days
  const accountAgeDays = creator.twitterCreatedAt
    ? Math.floor(
        (Date.now() - new Date(creator.twitterCreatedAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  const prompt = `You are an autonomous AI agent that tips crypto creators on LinkTip, a decentralized tipping platform.

Your mission: Identify and reward high-quality, influential creators across ALL platforms (Twitter, Instagram, TikTok, YouTube, etc).

CREATOR PROFILE:
- Name: ${creator.name}
- Twitter: @${creator.twitterHandle}
- Bio: ${creator.bio || "No bio"}
- Verified: ${creator.twitterVerified ? "✓ Yes" : "✗ No"}

SOCIAL METRICS:
- Twitter Followers: ${creator.twitterFollowerCount.toLocaleString()}
- Account Age: ${accountAgeDays ? `${accountAgeDays} days (${(accountAgeDays / 365).toFixed(1)} years)` : "Unknown"}

KAITO YAPS SCORE (Crypto Influence - Optional):
${
  yapsScore && yapsScore.yaps7d > 0
    ? `- 7-day score: ${yapsScore.yaps7d.toFixed(2)}
- 30-day score: ${yapsScore.yaps30d.toFixed(2)}
- All-time score: ${yapsScore.yapsAll.toFixed(2)}
- Trend: ${analyzeYapsScore(yapsScore).trend}
- Priority: ${analyzeYapsScore(yapsScore).priority}
- Note: High Yaps score = strong crypto Twitter influence`
    : "- No Yaps score (not crypto-focused or new to crypto Twitter)"
}

RECENT TIP HISTORY:
${recentTipCheck.recommendation}

YOUR BUDGET:
- $${AGENT_CONFIG.TIP_AMOUNT_USDC} USDC per tip
- You can tip up to ${AGENT_CONFIG.MAX_TIPS_PER_RUN} creators per run

DECISION CRITERIA (Be Lenient for MVP):
1. Yaps score is OPTIONAL - reward creators even without it
2. Should NOT have been tipped in last ${AGENT_CONFIG.DAYS_BETWEEN_TIPS} days
3. PRIORITIZE (tip these creators):
   - High Yaps score (crypto influencers) → definitely tip
   - 1000+ followers + account age 1+ year → tip to welcome them
   - Complete profile (bio, verified) → shows legitimacy
   - Rising stars (good engagement) → support early
4. SKIP if:
   - Very new account (<30 days) AND low followers (<100)
   - Recently tipped
   - Suspicious/incomplete profile

Be LENIENT. This is an MVP to test the platform. Tip most verified creators to encourage adoption.

Respond ONLY with valid JSON in this exact format:
{
  "decision": "TIP" or "SKIP",
  "reason": "Brief explanation (1-2 sentences)"
}`;

  try {
    const response = await llm.invoke(prompt);
    const content = response.content.toString();

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      decision: parsed.decision.toUpperCase() as "TIP" | "SKIP",
      reason: parsed.reason,
    };
  } catch (error) {
    console.error("[Agent AI] Error making decision:", error);
    return {
      decision: "SKIP",
      reason: "AI decision error - skipping to be safe",
    };
  }
}

/**
 * Run the autonomous tipping agent
 */
export async function runTippingAgent(): Promise<AgentRunResult> {
  console.log("\n🤖 ===== LinkTip Autonomous Agent Starting ===== 🤖\n");

  const result: AgentRunResult = {
    success: false,
    creatorsAnalyzed: 0,
    tipsCreated: 0,
    solanaTips: 0,
    celoTips: 0,
    baseTips: 0,
    skipped: 0,
    errors: [],
    decisions: [],
    walletBalances: {
      solana: { sol: 0, usdc: 0 },
      celo: { celo: 0, usdc: 0, cusd: 0 },
      base: { eth: 0, usdc: 0 },
    },
    stats: { totalDecisions: 0, totalTips: 0, totalSkips: 0, totalTippedUSDC: 0 },
  };

  try {
    console.log("📍 Step 1: Checking agent wallets...\n");
    
    // Check Base wallet (Priority 1)
    const baseWalletAddress = getServerWalletAddress();
    const baseBalance = await getAgentBalanceBase();
    result.walletBalances.base = {
      eth: baseBalance.balanceETH,
      usdc: baseBalance.balanceUSDC,
    };
    console.log(`Base Wallet: ${baseWalletAddress}`);
    console.log(`  Balance: ${baseBalance.balanceETH.toFixed(4)} ETH, $${baseBalance.balanceUSDC.toFixed(2)} USDC`);

    // Check Solana wallet (Priority 2)
    try {
      const solanaWallet = await getOrCreateSolanaWallet();
      const solanaBalance = await getSolanaAgentBalance();
      result.walletBalances.solana = {
        sol: solanaBalance.balanceSOL,
        usdc: solanaBalance.balanceUSDC,
      };
      console.log(`Solana Wallet: ${solanaWallet.address}`);
      console.log(`  Balance: ${solanaBalance.balanceSOL.toFixed(4)} SOL, $${solanaBalance.balanceUSDC.toFixed(2)} USDC`);
    } catch (error) {
      console.log(`⚠️  Solana wallet check failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Check Celo wallet (Priority 3)
    try {
      const celoBalance = await getAgentBalanceCelo();
      result.walletBalances.celo = {
        celo: celoBalance.balanceCELO,
        usdc: celoBalance.balanceUSDC,
        cusd: celoBalance.balanceCUSD,
      };
      console.log(`Celo Wallet: ${celoBalance.address}`);
      console.log(`  Balance: ${celoBalance.balanceCELO.toFixed(4)} CELO, $${celoBalance.balanceUSDC.toFixed(2)} USDC, $${celoBalance.balanceCUSD.toFixed(2)} cUSD`);
    } catch (error) {
      console.log(`⚠️  Celo wallet check failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    // Check if we have sufficient funds on any chain
    const hasBaseFunds = baseBalance.balanceUSDC >= AGENT_CONFIG.TIP_AMOUNT_USDC;
    const hasSolanaFunds = result.walletBalances.solana.usdc >= AGENT_CONFIG.TIP_AMOUNT_USDC;
    const hasCeloFunds = result.walletBalances.celo.usdc >= AGENT_CONFIG.TIP_AMOUNT_USDC || result.walletBalances.celo.cusd >= AGENT_CONFIG.TIP_AMOUNT_USDC;

    if (!hasBaseFunds && !hasSolanaFunds && !hasCeloFunds) {
      const error = `Insufficient funds on all chains. Need at least $${AGENT_CONFIG.TIP_AMOUNT_USDC} USDC on one chain.`;
      console.log(` ${error}\n`);
      result.errors.push(error);
      return result;
    }

    const availableTips = Math.floor(
      (baseBalance.balanceUSDC + result.walletBalances.solana.usdc + result.walletBalances.celo.usdc + result.walletBalances.base.usdc) / AGENT_CONFIG.TIP_AMOUNT_USDC
    );
    console.log(`✓ Wallets ready. Can send up to ${availableTips} tips across all chains.\n`);

    console.log(" Step 2: Fetching verified creators...\n");
    const creators = await getAllVerifiedCreators();
    console.log(`Found ${creators.length} verified creators\n`);

    if (creators.length === 0) {
      const error = "No verified creators found in database";
      result.errors.push(error);
      return result;
    }

    console.log(" Step 3: Analyzing creators...\n");
    let tipsCreated = 0;

    for (const creator of creators) {
      if (tipsCreated >= AGENT_CONFIG.MAX_TIPS_PER_RUN) {
        console.log(`\n✓ Reached max tips per run (${AGENT_CONFIG.MAX_TIPS_PER_RUN}). Stopping.\n`);
        break;
      }

      console.log(`\n--- Analyzing @${creator.twitterHandle} ---`);
      result.creatorsAnalyzed++;

      try {
        const yapsScore = await getYapsScore(creator.twitterHandle);

        const recentTipCheck = await checkRecentAgentTip(
          creator.twitterHandle,
          AGENT_CONFIG.DAYS_BETWEEN_TIPS
        );

        if (recentTipCheck.wasTippedRecently) {
          console.log(`⏭️  SKIP - ${recentTipCheck.recommendation}`);
          result.skipped++;
          result.decisions.push({
            creator: creator.twitterHandle,
            decision: "SKIP",
            reason: recentTipCheck.recommendation,
          });

          await logAgentDecision({
            twitterHandle: creator.twitterHandle,
            decision: "SKIP",
            reason: recentTipCheck.recommendation,
            yapsScore7d: yapsScore?.yaps7d,
            yapsScore30d: yapsScore?.yaps30d,
          });

          continue;
        }

        console.log(" Asking AI for decision...");
        const aiResponse = await aiDecision(creator, yapsScore, recentTipCheck);
        console.log(`AI Decision: ${aiResponse.decision} - ${aiResponse.reason}`);

        if (aiResponse.decision === "SKIP") {
          result.skipped++;
          result.decisions.push({
            creator: creator.twitterHandle,
            decision: "SKIP",
            reason: aiResponse.reason,
          });

          await logAgentDecision({
            twitterHandle: creator.twitterHandle,
            decision: "SKIP",
            reason: aiResponse.reason,
            yapsScore7d: yapsScore?.yaps7d,
            yapsScore30d: yapsScore?.yaps30d,
          });

          continue;
        }

        // Determine which chains to tip on
        // Priority order: Base -> Solana -> Celo
        const hasEVMWallet = !!creator.evmWalletAddress;
        const hasSolanaWallet = !!creator.walletAddress;
        const chainsToTip: string[] = [];
        const signatures: { chain: string; signature: string }[] = [];

        // Priority 1: Tip on Base if creator has EVM wallet and we have Base funds
        if (hasEVMWallet && result.walletBalances.base.usdc >= AGENT_CONFIG.TIP_AMOUNT_USDC) {
          console.log(`\n💰 [Priority 1] Sending $${AGENT_CONFIG.TIP_AMOUNT_USDC} USDC tip on Base...`);
          const baseTipResult = await tipCreatorViaBaseX402(
            creator.slug,
            AGENT_CONFIG.TIP_AMOUNT_USDC,
            aiResponse.reason
          );

          if (baseTipResult.success) {
            console.log(`✓ Base TIP SENT! TX: ${baseTipResult.signature}`);
            chainsToTip.push("base");
            signatures.push({ chain: "base", signature: baseTipResult.signature || "unknown" });
            result.baseTips++;
            tipsCreated++;
          } else {
            console.log(`⚠️  Base tip failed: ${baseTipResult.error}`);
          }
        }

        // Priority 2: Tip on Solana if creator has Solana wallet and we have Solana funds (and haven't tipped on Base)
        if (hasSolanaWallet && chainsToTip.length === 0 && result.walletBalances.solana.usdc >= AGENT_CONFIG.TIP_AMOUNT_USDC) {
          console.log(`\n💰 [Priority 2] Sending $${AGENT_CONFIG.TIP_AMOUNT_USDC} USDC tip on Solana...`);
          const solanaTipResult = await tipCreatorViaX402(
            creator.slug,
            AGENT_CONFIG.TIP_AMOUNT_USDC,
            aiResponse.reason
          );

          if (solanaTipResult.success) {
            console.log(`✓ Solana TIP SENT! TX: ${solanaTipResult.signature}`);
            chainsToTip.push("solana");
            signatures.push({ chain: "solana", signature: solanaTipResult.signature || "unknown" });
            result.solanaTips++;
            tipsCreated++;
          } else {
            console.log(`⚠️  Solana tip failed: ${solanaTipResult.error}`);
          }
        }

        // Priority 3: Tip on Celo if creator has EVM wallet and we have Celo funds (and haven't tipped on Base or Solana)
        if (hasEVMWallet && chainsToTip.length === 0 && 
            (result.walletBalances.celo.usdc >= AGENT_CONFIG.TIP_AMOUNT_USDC || 
             result.walletBalances.celo.cusd >= AGENT_CONFIG.TIP_AMOUNT_USDC)) {
          console.log(`\n💰 [Priority 3] Sending $${AGENT_CONFIG.TIP_AMOUNT_USDC} USDC tip on Celo...`);
          const celoTipResult = await tipCreatorViaCeloX402(
            creator.slug,
            AGENT_CONFIG.TIP_AMOUNT_USDC,
            "USDC",
            aiResponse.reason
          );

          if (celoTipResult.success) {
            console.log(`✓ Celo TIP SENT! TX: ${celoTipResult.signature}`);
            chainsToTip.push("celo");
            signatures.push({ chain: "celo", signature: celoTipResult.signature || "unknown" });
            result.celoTips++;
            tipsCreated++;
          } else {
            console.log(`⚠️  Celo tip failed: ${celoTipResult.error}`);
          }
        }

        // Record decision if at least one tip succeeded
        if (chainsToTip.length > 0) {
          await logAgentDecision({
            twitterHandle: creator.twitterHandle,
            decision: "TIP",
            reason: aiResponse.reason,
            yapsScore7d: yapsScore?.yaps7d,
            yapsScore30d: yapsScore?.yaps30d,
            amountUSDC: AGENT_CONFIG.TIP_AMOUNT_USDC * chainsToTip.length,
          });

          result.decisions.push({
            creator: creator.twitterHandle,
            decision: "TIP",
            reason: aiResponse.reason,
            amount: AGENT_CONFIG.TIP_AMOUNT_USDC * chainsToTip.length,
            chains: chainsToTip,
            signatures: signatures,
          });
        } else {
          const error = `Failed to tip @${creator.twitterHandle} on any chain`;
          console.log(` ${error}`);
          result.errors.push(error);
        }
      } catch (error: unknown) {
        const errorMsg = `Error analyzing @${creator.twitterHandle}: ${error instanceof Error ? error.message : String(error)}`;
        console.error(` ${errorMsg}`);
        result.errors.push(errorMsg);
      }

      // Small delay between creators
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    result.tipsCreated = tipsCreated;

    console.log("\n Step 4: Fetching agent statistics...\n");
    result.stats = await getAgentStats();

    result.success = true;

    console.log("\n ===== Agent Run Complete ===== \n");
    console.log(`Creators Analyzed: ${result.creatorsAnalyzed}`);
    console.log(`Tips Created: ${result.tipsCreated}`);
    console.log(`  - Base: ${result.baseTips}`);
    console.log(`  - Celo: ${result.celoTips}`);
    console.log(`Skipped: ${result.skipped}`);
    console.log(`Errors: ${result.errors.length}`);
    console.log(`\nAll-Time Stats:`);
    console.log(`- Total Decisions: ${result.stats.totalDecisions}`);
    console.log(`- Total Tips: ${result.stats.totalTips}`);
    console.log(`- Total Tipped: $${result.stats.totalTippedUSDC.toFixed(2)} USDC\n`);

    return result;
  } catch (error: unknown) {
    console.error("\n Agent run failed:", error);
    result.errors.push(error instanceof Error ? error.message : String(error));
    return result;
  }
}
