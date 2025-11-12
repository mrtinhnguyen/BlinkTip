# BlinkTip

**The platform where crypto content creators get tipped by humans AND autonomous AI agents.**

BlinkTip makes it easy for crypto creators on Twitter to receive USDC tips via Solana Blinks, while an autonomous AI agent evaluates and rewards creators based on their influence and authenticity.

![Platform](https://img.shields.io/badge/Platform-Next.js_15-black)
![Blockchain](https://img.shields.io/badge/Blockchain-Solana-purple)
![Protocol](https://img.shields.io/badge/Protocol-x402-blue)
![AI](https://img.shields.io/badge/AI-Claude_Sonnet_4-orange)

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [How It Works](#how-it-works)
- [Platform Features](#platform-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Running the AI Agent](#running-the-ai-agent)
- [API Reference](#api-reference)
- [Deployment](#deployment)

---

## The Problem

**There's no universal, easy way to tip creators on the internet.**

Imagine you're a content creator with Instagram, TikTok, Twitter/X, Farcaster, Medium, and more. Your audience is scattered across all these platforms:

- **On Instagram/TikTok**: Most followers don't know crypto. You use "link in bio" for PayPal, Venmo, or CashApp
- **On Twitter/X**: Maybe you drop your ENS or Solana address for on-chain tips, but only crypto natives understand that
- **On other platforms**: Same fragmented mess - different payment methods everywhere
- **For AI agents**: No way for autonomous agents to discover and tip you for your content

**The result?** You need multiple payment links, multiple bios, and you're invisible to the emerging world of autonomous AI agents that could reward quality content.

There's no single, universal tip link that works EVERYWHERE and accepts payments from ANYONE - humans AND AI agents.

## The Solution

**BlinkTip gives creators ONE universal tip link that works everywhere.**

### One Link, Everywhere

1. **Creator signs up** with their Solana wallet
2. **Gets ONE universal tip link**: `blink-tip.vercel.app/tip/yagamilighto`
3. **Shares it EVERYWHERE**: Instagram bio, TikTok bio, Twitter profile, Farcaster, Medium articles, email signature, anywhere
4. **Anyone can tip** - humans and AI agents alike

### How It Works on Different Platforms

**On Twitter/X (Solana Blinks)**
```
https://blink-tip.vercel.app/tip/ujooba
→ Unfurls as an interactive Solana Blink
→ Followers click and tip instantly without leaving Twitter
→ Powered by Solana Actions
```
[See it live](https://dial.to/?action=solana-action:https://blink-tip.vercel.app/api/actions/tip/ujooba)

**Everywhere Else (x402 Protocol)**

When someone clicks your tip link from Instagram, TikTok, Medium, or anywhere else:

1. Click tip link → Browser sends GET request
2. Server returns `402 Payment Required` with payment instructions
3. User creates Solana transaction via x402 client
4. Transaction signed → Submitted with `X-PAYMENT` header
5. Payment verified on-chain → Tip complete

**The game-changer:** AI agents can autonomously use the same x402 flow. An AI agent crawling the web can find your helpful Medium article, see your tip link, and autonomously send a tip via x402 without ANY human intervention.

### Autonomous AI Agent

BlinkTip includes a Claude Sonnet 4-powered autonomous agent that:

- **Discovers** registered creators from the platform
- **Analyzes** their crypto influence (Kaito Yaps API) and social metrics
- **Decides** who to tip using AI reasoning (authenticity, engagement, influence)
- **Tips** directly from its own CDP wallet using the same x402 infrastructure
- **Records** all decisions transparently

This demonstrates how ANY autonomous agent can discover and reward creators using x402 - whether they're on Twitter, Medium, personal blogs, or anywhere else on the internet.

---

## How It Works

### For Creators

1. **Sign up** at `blink-tip.vercel.app/register`
   - Connect Twitter via OAuth 2.0
   - Connect your Solana wallet

2. **Get your universal tip link**: `blink-tip.vercel.app/tip/yourhandle`

3. **Share it EVERYWHERE**:
   - Instagram bio: "Tip me: blink-tip.vercel.app/tip/yourhandle"
   - TikTok bio: Same link
   - Twitter bio: Link unfurls as interactive Blink
   - Medium articles: Add at the end of posts
   - Email signature: Include your tip link
   - Personal website: Link from any page

4. **Receive tips** in USDC or Phantom CASH directly to your Solana wallet from:
   - Humans on any platform (they choose the token)
   - Autonomous AI agents discovering your content

### For Human Supporters

**On Twitter/X:**
- See creator's Blink unfurl in timeline
- Click to tip (no leaving Twitter)
- Sign transaction with your Solana wallet
- Done

**On Any Other Platform:**
- Click creator's tip link from Instagram, TikTok, etc.
- Choose tip amount
- **Choose token: USDC or Phantom CASH** 👻
- Browser creates x402 payment transaction
- Sign with your wallet
- Payment verified on-chain
- Creator receives tip

### For AI Agents (Autonomous Tipping)

**How ANY AI Agent Can Tip:**

1. Agent discovers creator's tip link (on Medium, personal blog, anywhere)
2. Agent sends GET request → receives `402 Payment Required` + payment details
3. Agent builds Solana transaction from payment requirements
4. Agent signs transaction with its own wallet
5. Agent submits with `X-PAYMENT` header → verified on-chain
6. Creator receives tip

**BlinkTip's Built-in Agent:**

Our platform demonstrates this with a Claude Sonnet 4-powered agent:

1. Fetches all registered creators from platform
2. Analyzes crypto influence (Kaito Yaps) + Twitter metrics
3. AI decides who to tip based on authenticity and engagement
4. Tips via x402 using its CDP wallet
5. Logs all decisions transparently

---

## Platform Features

### Creator Dashboard
- View all tips received (human + agent)
- See agent decision reasoning
- Track total earnings
- Monitor tip frequency

### Public Creator Profiles
- Display creator bio and stats
- Show recent tips
- Link to Twitter profile
- Display Solana wallet for direct tips

### AI Agent Transparency
- All agent decisions logged publicly
- View why agent tipped or skipped
- See Kaito Yaps scores at decision time
- Track agent wallet balance and activity

### Solana Blinks
- Auto-generated for each creator
- Unfurl beautifully on Twitter
- Support custom tip amounts
- Powered by x402 protocol

### Multi-Token Support 👻💵
- **USDC**: Circle's USD stablecoin (standard)
- **Phantom CASH**: New USD stablecoin by Phantom/Bridge/Stripe
  - Launched Sept 2025
  - 1:1 USD-pegged
  - Gasless swaps in Phantom wallet
  - Perfect for Phantom wallet users
- Supporters choose their preferred token when tipping
- Both tokens work seamlessly with x402 protocol

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS
- **Auth**: NextAuth.js with Twitter OAuth 2.0
- **Wallet**: Solana Wallet Adapter

### Backend
- **API**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Payments**: x402 protocol on Solana
- **Agent Wallet**: Coinbase Developer Platform (CDP) SDK

### Blockchain
- **Network**: Solana (Devnet for testing, Mainnet ready)
- **Tokens**: USDC & Phantom CASH (SPL stablecoins)
- **Payment Protocol**: x402 with facilitator verification

### AI Agent
- **Model**: Claude Sonnet 4 (via OpenRouter)
- **Influence API**: Kaito Yaps
- **Wallet**: CDP server-side wallet

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- Coinbase Developer Platform account (for agent wallet)
- OpenRouter API key (for AI agent)
- Kaito API key (for influence scores)
- Twitter Developer account (for OAuth)

### Installation

```bash
# Clone the repository
git clone https://github.com/wamimi/BlinkTip.git
cd BlinkTip

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Configure environment variables (see below)

# Run development server
pnpm dev
```

Visit `http://localhost:3000`

### Environment Variables

Create a `.env` file with:

```bash
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Twitter OAuth (NextAuth)
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Solana
SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_NETWORK=solana-devnet

# x402 Protocol
NEXT_PUBLIC_FACILITATOR_URL=https://facilitator.payai.network

# CDP Agent Wallet
CDP_API_KEY_NAME=your-cdp-api-key
CDP_API_KEY_PRIVATE_KEY=your-cdp-private-key

# AI Agent
OPENROUTER_API_KEY=your-openrouter-key

# Platform
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Database Setup

Run the Supabase migrations:

```sql
-- See supabase/migrations/ for full schema
-- Key tables:
-- - creators (user profiles)
-- - tips (all tips, human + agent)
-- - agent_actions (agent decision log)
```

---

## Running the AI Agent

The autonomous agent can be triggered via API:

```bash
# Trigger agent run
curl -X POST http://localhost:3000/api/agent/run

# Check agent wallet
curl http://localhost:3000/api/agent/wallet

# View agent decisions
curl http://localhost:3000/api/agent/decisions
```

For automated runs, set up a cron job:

```bash
# Run every 6 hours
0 */6 * * * curl -X POST https://blink-tip.vercel.app/api/agent/run
```

See [agent/README.md](agent/README.md) for detailed agent documentation.

---

## Project Structure

```
BlinkTip/
├── app/                                    # Next.js App Router
│   ├── page.tsx                           # Homepage
│   ├── register/                          # Creator registration flow
│   │   └── page.tsx                       # Twitter OAuth + wallet connection
│   ├── tip/[slug]/                        # Tipping pages (Solana Blinks)
│   │   └── page.tsx                       # x402-powered tipping UI
│   ├── creators/                          # Public creator profiles
│   └── api/                               # API routes
│       ├── auth/[...nextauth]/            # NextAuth Twitter OAuth
│       ├── creators/                      # Creator CRUD operations
│       ├── tips/                          # Tip recording
│       ├── x402/                          # x402 payment endpoints
│       │   └── tip/[slug]/pay-solana/     # Solana payment handler
│       └── agent/                         # Agent API routes
│           ├── run/                       # Trigger agent run
│           ├── wallet/                    # Agent wallet info
│           ├── tips/                      # Agent tip recording
│           └── decisions/                 # Agent decision logging
│
├── agent/                                  # Autonomous AI Agent
│   ├── lib/
│   │   ├── agent.ts                       # Main agent orchestration
│   │   └── services/
│   │       ├── cdp-wallet.ts              # CDP wallet management
│   │       ├── cdp-tipper.ts              # Production tipping (WORKING)
│   │       ├── x402-tipper.ts             # Experimental x402 (not working yet)
│   │       ├── kaito.ts                   # Kaito Yaps API
│   │       ├── openrouter.ts              # AI model integration
│   │       └── database.ts                # Database operations
│   └── README.md                          # Agent documentation
│
├── components/                            # React components
│   ├── WalletProvider.tsx                # Solana wallet setup
│   └── AuthProvider.tsx                  # NextAuth session provider
│
├── lib/                                   # Shared utilities
├── public/                                # Static assets
└── README.md                             # This file
```

---

## API Reference

### Creator Endpoints

#### `GET /api/creators`
List all registered creators

#### `GET /api/creators?slug=nellycyberpro`
Get specific creator by slug

#### `POST /api/creators`
Register new creator (requires Twitter OAuth)

### Tipping Endpoints

#### `GET /api/x402/tip/[slug]/pay-solana?amount=0.10`
Returns 402 with payment requirements for x402 flow

#### `POST /api/x402/tip/[slug]/pay-solana`
Verifies payment and records tip (requires X-Payment header)

### Agent Endpoints

#### `GET /api/agent/wallet`
Get agent wallet address and balance

#### `POST /api/agent/run`
Trigger agent to analyze creators and tip

#### `GET /api/agent/decisions`
List all agent decisions (TIP and SKIP)

---

## Deployment

### Deploy to Vercel

```bash
# Install Vercel CLI
pnpm install -g vercel

# Deploy
vercel

# Add environment variables in Vercel dashboard
# Configure production domain
```

### Automated Agent Runs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/agent/run",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

This runs the agent every 6 hours automatically.

---

## Roadmap

### Phase 1: MVP (Current)
- [x] Creator registration with Twitter OAuth
- [x] x402-powered tipping on Solana
- [x] Solana Blinks for Twitter unfurling
- [x] Autonomous AI agent with CDP wallet
- [x] Kaito Yaps influence scoring
- [x] Agent decision transparency

### Phase 2: Enhancement
- [ ] Complete x402 server-side agent integration
- [ ] Creator dashboard with analytics
- [ ] Agent tip notifications (Twitter DM)
- [ ] Dynamic tip amounts based on influence
- [ ] Multi-token support (other SPL tokens)

### Phase 3: Scale
- [ ] Mainnet deployment
- [ ] Enhanced AI decision-making
- [ ] Creator reputation scores
- [ ] Community governance
- [ ] Multi-chain support (EVM)

---

## Known Issues

### x402 Agent Implementation
The autonomous agent's x402 integration is not working due to a Solana transaction validation error. See [agent/README.md](agent/README.md#x402-protocol-integration-experimental) for details. Currently using direct CDP wallet transfers.

### Devnet vs Mainnet
- Currently configured for Solana Devnet
- Mainnet deployment requires CDP fee payer setup
- See x402 mainnet documentation for details

---

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

Areas we'd love help with:
- x402 server-side Solana transaction format
- Enhanced AI decision-making algorithms
- UI/UX improvements
- Documentation

---

## Learn More

### x402 Protocol
- [x402 Specification](https://x402.org)
- [x402-solana Package](https://www.npmjs.com/package/x402-solana)
- [Pay AI Facilitator](https://facilitator.payai.network)

### Solana
- [Solana Blinks](https://solana.com/blinks)
- [Solana Explorer](https://explorer.solana.com)
- [SPL Token Program](https://spl.solana.com/token)

### AI & Influence
- [Kaito AI](https://kaito.ai)
- [OpenRouter](https://openrouter.ai)
- [Claude (Anthropic)](https://anthropic.com/claude)

### Coinbase CDP
- [CDP Documentation](https://docs.cdp.coinbase.com)
- [CDP Wallets](https://docs.cdp.coinbase.com/server-wallets/docs/welcome)


## License

MIT License - see [LICENSE](LICENSE) for details

---


