# LinkTip Autonomous AI Agent

An autonomous AI agent that discovers crypto content creators on Twitter, evaluates their influence and authenticity, and autonomously tips them with USDC on Solana.

## Overview

The LinkTip Agent is a **fully autonomous AI agent** powered by Claude Sonnet 4 that:

1. **Discovers** registered crypto creators from the LinkTip platform
2. **Analyzes** their influence using on-chain metrics (Kaito Yaps API) and social signals (Twitter OAuth)
3. **Decides** whether to tip based on authenticity, engagement, and crypto relevance
4. **Executes** USDC tips directly from its own Coinbase Developer Platform (CDP) wallet
5. **Records** all decisions and tips transparently on the platform

The agent operates completely autonomously - it owns its wallet, signs its own transactions, and makes its own decisions about who to support.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    LinkTip Agent                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │
│  │   Creator    │    │  Influence   │    │  AI Decision │ │
│  │  Discovery   │───▶│   Analysis   │───▶│    Engine    │ │
│  │              │    │              │    │ (Claude 4)   │ │
│  └──────────────┘    └──────────────┘    └──────┬───────┘ │
│         │                    │                    │         │
│         │                    │                    ▼         │
│         │                    │            ┌──────────────┐ │
│         │                    │            │   CDP Wallet │ │
│         │                    │            │   Tipping    │ │
│         │                    │            └──────────────┘ │
│         │                    │                             │
└─────────┼────────────────────┼─────────────────────────────┘
          │                    │
          ▼                    ▼
   ┌─────────────┐      ┌─────────────┐
   │  LinkTip   │      │    Kaito    │
   │  Platform   │      │  Yaps API   │
   │   (Next.js) │      │ (Influence) │
   └─────────────┘      └─────────────┘
          │
          ▼
   ┌─────────────┐
   │   Solana    │
   │  Blockchain │
   └─────────────┘
```

## Core Components

### 1. Creator Discovery
- Fetches registered creators from LinkTip platform API
- Retrieves creator profiles with Twitter handles, wallet addresses, and bios
- Filters creators who haven't been analyzed recently

### 2. Influence Analysis
- **Kaito Yaps API**: On-chain crypto influence scoring (0-100)
  - Real crypto engagement metrics
  - Not gameable like follower counts
- **Twitter OAuth 2.0**: Social verification
  - Follower count
  - Account age
  - Verified status
  - Profile completeness

### 3. AI Decision Engine (Claude Sonnet 4 via OpenRouter)
The agent uses Claude Sonnet 4 to make nuanced decisions about who to support.

**Example AI Prompt:**
```
You are an autonomous AI agent that tips crypto content creators on Twitter.

Your goal: Support genuine crypto creators with real influence and engagement.

Creator Profile:
- Name: Nelly the ZK Menace
- Twitter: @nellycyberpro
- Bio: Building ZK infrastructure for privacy-first DeFi
- Followers: 1,847
- Account Age: 3.4 years
- Kaito Yaps Score: 42.5 (crypto influence)
- Twitter Verified: Yes
- Wallet: FsJ7...x9K2

Available Balance: $1,050 USDC
Tip Amount: $0.10 USDC

Should you tip this creator? Respond with:
TIP or SKIP
Reason: [Your reasoning in 1-2 sentences]
```

**AI Decision Factors:**
- Authenticity (verified, complete profile, account age)
- Crypto relevance (bio mentions crypto topics)
- Influence (Kaito score, followers)
- Engagement quality over vanity metrics

### 4. Tipping Execution

The agent executes tips using **direct CDP wallet transfers** on Solana.

**Current Method: CDP Direct Transfers** ([cdp-tipper.ts](lib/services/cdp-tipper.ts))
- Agent's CDP wallet sends USDC directly to creator's wallet
- Simple, reliable, production-ready
- Full transaction signing by agent

**Experimental: x402 Protocol** ([x402-tipper.ts](lib/services/x402-tipper.ts))
- HTTP-native micropayment protocol
- Currently encountering Solana transaction validation error
- See "x402 Protocol Integration" section below

## Technology Stack

- **AI Model**: Claude Sonnet 4 (via OpenRouter)
- **Agent Wallet**: Coinbase Developer Platform (CDP) SDK
- **Blockchain**: Solana (Devnet for testing, Mainnet support ready)
- **Influence API**: Kaito Yaps (crypto-native influence scoring)
- **Social Auth**: Twitter OAuth 2.0
- **Backend**: Next.js 15 API routes
- **Language**: TypeScript

## How It Works

### Step 1: Agent Initialization
```typescript
const agentWallet = await getOrCreateAgentWallet();
const balance = await getAgentBalance();
console.log(`Agent wallet: ${agentWallet.address}`);
console.log(`Balance: ${balance.balanceUSDC} USDC`);
```

### Step 2: Creator Discovery
```typescript
const creatorsResponse = await fetch(`${BASE_URL}/api/creators`);
const { creators } = await creatorsResponse.json();
// Filters creators not analyzed in last 24h
```

### Step 3: Influence Analysis
```typescript
// Get Kaito Yaps score (crypto influence)
const yapsData = await fetch(
  `https://api.kaito.ai/yaps?twitter=${creator.twitter_handle}`
);

// Get Twitter social metrics via OAuth
const twitterMetrics = {
  followers: creator.followers_count,
  accountAge: creator.account_created_at,
  isVerified: creator.is_verified,
};
```

### Step 4: AI Decision
```typescript
const aiResponse = await queryOpenRouter({
  model: "anthropic/claude-sonnet-4",
  messages: [{
    role: "user",
    content: buildDecisionPrompt(creator, yapsScore, twitterMetrics)
  }]
});

// Parse response: TIP or SKIP
const decision = aiResponse.includes("TIP") ? "TIP" : "SKIP";
```

### Step 5: Execute Tip
```typescript
if (decision === "TIP") {
  const tipResult = await tipCreatorViaCDP(
    creator.walletAddress,
    AGENT_CONFIG.TIP_AMOUNT_USDC,
    aiResponse.reason
  );

  // Record tip on platform
  await fetch(`${BASE_URL}/api/agent/tips`, {
    method: "POST",
    body: JSON.stringify({
      creator_id: creator.id,
      amount: AGENT_CONFIG.TIP_AMOUNT_USDC,
      transaction: tipResult.signature,
      reason: aiResponse.reason,
    }),
  });
}
```

### Step 6: Record Decision
```typescript
// All decisions (TIP and SKIP) are recorded
await fetch(`${BASE_URL}/api/agent/decisions`, {
  method: "POST",
  body: JSON.stringify({
    creator_id: creator.id,
    decision: decision, // "TIP" or "SKIP"
    reason: aiResponse.reason,
    yaps_score: yapsScore,
    amount: decision === "TIP" ? AGENT_CONFIG.TIP_AMOUNT_USDC : null,
  }),
});
```

## Agent Configuration

Key settings in [agent.ts](lib/agent.ts):

```typescript
const AGENT_CONFIG = {
  TIP_AMOUNT_USDC: 0.10,           // Tip amount per creator
  MAX_CREATORS_PER_RUN: 10,         // Process up to 10 creators per run
  DECISION_WINDOW_HOURS: 24,        // Don't re-analyze same creator within 24h
};
```

Environment variables required:

```bash
# Coinbase CDP Wallet
CDP_API_KEY_NAME=your-cdp-api-key
CDP_API_KEY_PRIVATE_KEY=your-private-key

# AI Model (OpenRouter)
OPENROUTER_API_KEY=your-openrouter-key


# Platform
NEXT_PUBLIC_BASE_URL=https://your-domain.com

# Blockchain
SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_NETWORK=solana-devnet
```

## Running the Agent

### Option 1: Via API Route
```bash
# The agent runs automatically when deployed
# Access via API endpoint (protected with auth)
curl -X POST https://your-domain.com/api/agent/run \
  -H "Authorization: Bearer YOUR_AGENT_API_KEY"
```

### Option 2: Programmatically
```typescript
import { runAgent } from './agent/lib/agent';

const result = await runAgent();
console.log(`Tips created: ${result.data.tipsCreated}`);
console.log(`Creators analyzed: ${result.data.creatorsAnalyzed}`);
```

### Option 3: Scheduled (Recommended)
Set up a cron job or scheduled task:
```bash
# Run every 6 hours
0 */6 * * * curl -X POST https://your-domain.com/api/agent/run
```

## Project Structure

```
agent/
├── lib/
│   ├── agent.ts                         # Main agent orchestration
│   ├── services/
│   │   ├── cdp-wallet.ts                # CDP wallet management
│   │   ├── cdp-tipper.ts                # Production tipping service
│   │   ├── x402-tipper.ts               # Experimental x402 (not working)
│   │   ├── kaito.ts                     # Kaito Yaps API integration
│   │   ├── openrouter.ts                # AI model integration
│   │   └── database.ts                  # Database operations
│   └── types/
│       └── agent.ts                     # TypeScript types
└── README.md                            # This file

app/api/agent/
├── run/route.ts                         # POST /api/agent/run - Trigger agent
├── wallet/route.ts                      # GET /api/agent/wallet - Check balance
├── tips/route.ts                        # Agent tips management
└── decisions/route.ts                   # Agent decisions management
```

## x402 Protocol Integration (Experimental)

We attempted to integrate the x402 HTTP-native micropayment protocol for tipping, which would enable:
- Standardized payment flow
- Facilitator-verified transactions
- Protocol-level payment guarantees

### Current Status: Not Working

**Error**: `invalid_exact_svm_payload_transaction_instructions_length`

**What We Know**:
- This error occurs during `facilitatorClient.verifyPayment()`
- The error code is NOT documented in the x402 specification
- Human browser-based tipping works perfectly with the same endpoint
- x402 documentation confirms autonomous agents ARE supported

**What We Tried**:
1. Building VersionedTransaction with single SPL token transfer instruction
2. Using `extra.feePayer` from payment requirements as fee payer
3. Using `payTo` from payment requirements as fee payer
4. Creating token accounts separately before x402 transaction
5. Signing with CDP wallet (server-side)

**Issue**: The facilitator is rejecting our transaction structure. It appears to be validating the number of compiled instructions and finding a mismatch with what it expects for the Solana "exact" payment scheme.

**Next Steps**: Waiting for clarification from x402/Pay AI team on correct Solana transaction format for server-side autonomous agents in Node.js environment.

**Meanwhile**: Agent uses direct CDP wallet transfers (see [cdp-tipper.ts](lib/services/cdp-tipper.ts)), which works reliably.

**Preserved Code**: The x402 implementation is preserved in [x402-tipper.ts](lib/services/x402-tipper.ts) for future use once the transaction format is clarified.

## Security Considerations

1. **Agent Wallet**: Stored securely via CDP, never exposed
2. **API Keys**: All credentials in environment variables, never committed
3. **Rate Limiting**: Agent processes max 10 creators per run
4. **Decision Window**: 24-hour cooldown prevents duplicate analysis
5. **Balance Checks**: Agent verifies sufficient USDC before tipping
6. **Transaction Verification**: All transactions confirmed on Solana before recording

## Monitoring & Stats

The agent provides comprehensive logging and stats:

```json
{
  "success": true,
  "data": {
    "creatorsAnalyzed": 10,
    "tipsCreated": 3,
    "skipped": 7,
    "errors": [],
    "decisions": [
      {
        "creator": "nellycyberpro",
        "decision": "TIP",
        "reason": "Verified account with complete profile, 3.4 years old with decent follower base, and ZK engineering focus shows technical expertise in crypto space.",
        "amount": 0.10,
        "signature": "61ymQk24e...HoYvLyEF"
      }
    ],
    "walletBalance": {
      "sol": 0.001245,
      "usdc": 1049.90
    }
  }
}
```

## Database Schema

### `tips` table (agent-specific columns)
```sql
- is_agent_tip: BOOLEAN      # True if from agent
- agent_reasoning: TEXT       # AI explanation
```

### `agent_actions` table
```sql
- twitter_handle: VARCHAR(255)
- decision: VARCHAR(10)       # TIP or SKIP
- reasoning: TEXT             # AI explanation
- yaps_score_7d: DECIMAL
- yaps_score_30d: DECIMAL
- tip_id: UUID                # Foreign key if TIP
```

## Example Agent Run

```
🤖 ===== LinkTip Autonomous Agent Starting ===== 🤖

📍 Step 1: Checking agent wallet...
Wallet Address: FsJ7x9K2...
Balance: 0.0012 SOL, $1,050.00 USDC
✓ Wallet ready. Can send up to 10,500 tips.

📍 Step 2: Fetching creators...
Found 25 registered creators

📍 Step 3: Analyzing creators...

--- Analyzing @nellycyberpro ---
[Kaito] ✓ @nellycyberpro - 7d: 42.5, 30d: 38.2
🤔 Asking AI for decision...
AI Decision: TIP - Verified account with complete profile, 3.4 years old
with decent follower base, and ZK engineering focus shows technical
expertise in crypto space.
💰 Sending $0.10 USDC tip...
✓ TIP SENT! TX: 61ymQk24eVsyPoMdyZyeLvoRpHkE7DSM7XBZ9Kjtoqm2GXTAR1tEwbt36DYtt3GbVDsfvoSNPxg8u5L7HoYvLyEF

--- Analyzing @alice ---
⏭️  SKIP - Already analyzed 12 hour(s) ago

--- Analyzing @bob ---
[Kaito] ✓ @bob - 7d: 8.5, 30d: 12.1
🤔 Asking AI for decision...
AI Decision: SKIP - Low recent engagement score

🤖 ===== Agent Run Complete ===== 🤖
Creators Analyzed: 10
Tips Created: 1
Skipped: 9
```

## Future Enhancements

1. **x402 Protocol**: Complete integration once Solana transaction format is clarified
2. **Dynamic Tipping**: Adjust tip amounts based on creator influence
3. **Multi-chain Support**: Extend to other Solana SPL tokens or EVM chains
4. **Enhanced AI**: More sophisticated decision-making with historical analysis
5. **Creator Feedback Loop**: Learn from tip success and creator growth
6. **Notifications**: Alert creators when they receive agent tips

## Troubleshooting

### Agent has no balance
```bash
# Fund the agent wallet with USDC on Solana
# Get agent address:
curl https://your-domain.com/api/agent/wallet

# Send USDC to that address using Phantom, Solflare, etc.
```

### Kaito API rate limits
```bash
# Increase DECISION_WINDOW_HOURS to reduce API calls
# Or upgrade Kaito API plan
```

### OpenRouter errors
```bash
# Check API key is valid
# Verify model "anthropic/claude-sonnet-4" is available
# Check rate limits and credits
```

### CDP wallet errors
```bash
# Verify CDP_API_KEY_NAME and CDP_API_KEY_PRIVATE_KEY are set
# Check CDP console for wallet status
# Ensure wallet has SOL for transaction fees
```

## Cost Estimates

**Per Agent Run (analyzing 10 creators):**
- Kaito API: Free tier (100 calls per 5 minutes)
- OpenRouter (Claude Sonnet 4): ~$0.015 per decision
- Solana transactions (gas): ~$0.0001 per tip
- USDC tips: $0.10 × tips created

**Example: 3 tips per run: ~$0.35 total**

## Learn More

- **x402 Protocol**: [x402.sh](https://x402.sh)
- **Coinbase CDP**: [docs.cdp.coinbase.com](https://docs.cdp.coinbase.com)
- **Kaito AI**: [kaito.ai](https://kaito.ai)
- **Solana**: [solana.com](https://solana.com)
- **OpenRouter**: [openrouter.ai](https://openrouter.ai)

---

**Built with autonomy in mind.** This agent makes its own decisions, signs its own transactions, and supports the creators it believes in.
