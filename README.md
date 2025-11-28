# LinkTip

**The platform where crypto content creators get tipped by humans AND autonomous AI agents.**

LinkTip makes it easy for crypto creators on Twitter to receive tips via Solana Blinks and Celo, while an autonomous AI agent evaluates and rewards creators based on their influence and authenticity.

![Platform](https://img.shields.io/badge/Platform-Next.js_15-black)
![Blockchain](https://img.shields.io/badge/Blockchain-Solana%20%7C%20Celo-purple)
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

**LinkTip gives creators ONE universal tip link that works everywhere.**

### One Link, Everywhere

1. **Creator signs up** with their Solana and/or Celo wallet
2. **Gets ONE universal tip link**: `linktip.xyz/tip/nellycyberpro`
3. **Shares it EVERYWHERE**: Instagram bio, TikTok bio, Twitter profile, Farcaster, Medium articles, email signature, anywhere
4. **Anyone can tip** - humans and AI agents alike, on Solana or Celo

### How It Works on Different Platforms

**On Twitter/X (Solana Blinks)**
```
https://linktip.xyz/tip/nellycyberpro
→ Unfurls as an interactive Solana Blink once action is registered
→ Followers click and tip instantly without leaving Twitter
→ Powered by Solana Actions
```
[See it live](https://dial.to/?action=solana-action:https://linktip.xyz/api/actions/tip/nellycyberpro)

**Everywhere Else (x402 Protocol)**

When someone clicks your tip link from Instagram, TikTok, Medium, or anywhere else:

1. Click tip link → Choose blockchain (Solana or Celo)
2. Browser sends GET request
3. Server returns `402 Payment Required` with payment instructions
4. User creates transaction (Solana or EVM) via x402 client
5. Transaction signed → Submitted with `X-PAYMENT` header
6. Payment verified on-chain → Tip complete

**Multi-Chain Support:**
- **Solana**: USDC, Phantom CASH (working with x402)
- **Base**: USDC (ERC-20, x402 protocol)
- **Celo**: cUSD, USDC (ERC-2612 Permit / ERC-3009 TransferWithAuthorization)

**The game-changer:** AI agents can autonomously use the same x402 flow. An AI agent crawling the web can find your helpful Medium article, see your tip link, and autonomously send a tip via x402 on either blockchain without ANY human intervention.

### Autonomous AI Agent

LinkTip includes a Claude Sonnet 4-powered autonomous agent that:

- **Discovers** registered creators from the platform
- **Analyzes** their crypto influence (Kaito Yaps API) and social metrics
- **Decides** who to tip using AI reasoning (authenticity, engagement, influence)
- **Tips** directly from its own CDP wallet using the same x402 infrastructure
- **Records** all decisions transparently

This demonstrates how ANY autonomous agent can discover and reward creators using x402 - whether they're on Twitter, Medium, personal blogs, or anywhere else on the internet.

---

## How It Works

### For Creators

1. **Sign up** at `linktip.xyz/register`
   - Connect Twitter via OAuth 2.0
   - Connect your Solana wallet
   - Optionally connect your Celo wallet for EVM chain support

2. **Get your universal tip link**: `linktip.xyz/tip/yourhandle`

3. **Share it EVERYWHERE**:
   - Instagram bio: "Tip me: linktip.xyz/tip/yourhandle"
   - TikTok bio: Same link
   - Twitter bio: Link unfurls as interactive Blink
   - Medium articles: Add at the end of posts
   - Email signature: Include your tip link
   - Personal website: Link from any page

4. **Receive tips** directly to your wallet from:
   - Humans on any platform (they choose blockchain and token)
   - Autonomous AI agents discovering your content
   - **Solana**: USDC, Phantom CASH
   - **Base**: USDC
   - **Celo**: cUSD, USDC

### For Human Supporters

**On Twitter/X:**
- See creator's Blink unfurl in timeline
- Click to tip (no leaving Twitter)
- Sign transaction with your Solana wallet
- Done

**On Any Other Platform:**
- Click creator's tip link from Instagram, TikTok, etc.
- **Choose blockchain: Solana, Base, or Celo**
- Choose tip amount and token:
  - **Solana**: USDC or Phantom CASH 👻
  - **Base**: USDC
  - **Celo**: cUSD or USDC
- Browser creates x402 payment transaction
- Sign with your wallet (gasless on Celo via Permit/Authorization)
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

**LinkTip's Built-in Agent:**

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

### Multi-Chain & Multi-Token Support

**Solana**
- **USDC**: Circle's USD stablecoin (standard)
- **Phantom CASH**: New USD stablecoin by Phantom/Bridge/Stripe
  - Launched Sept 2025
  - 1:1 USD-pegged
  - Gasless swaps in Phantom wallet
  - Perfect for Phantom wallet users

**Base**
- **USDC**: Circle's USDC on Base (6 decimals)
- **Low gas fees** on Base L2
- **Fast transactions** with Ethereum security
- **Coinbase-backed** Layer 2 network

**Celo**
- **cUSD**: Celo Dollar (native stablecoin, 18 decimals)
- **USDC**: Circle's USDC on Celo (6 decimals)
- **Gasless transfers** via ERC-2612 Permit & ERC-3009 TransferWithAuthorization
- **Mobile-first** blockchain optimized for micropayments

Supporters choose their preferred blockchain and token when tipping. All tokens work seamlessly with x402 protocol.

---

## Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS
- **Auth**: NextAuth.js with Twitter OAuth 2.0
- **Wallets**: Solana Wallet Adapter, thirdweb React SDK (EVM)

### Backend
- **API**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **Payments**: x402 protocol on Solana & Celo
- **Agent Wallet**: Coinbase Developer Platform (CDP) SDK

### Blockchain
- **Networks**:
  - Solana (Devnet for testing, Mainnet ready)
  - Base (Mainnet & Sepolia testnet)
  - Celo Sepolia (Testnet)
- **Tokens**:
  - Solana: USDC & Phantom CASH (SPL stablecoins)
  - Base: USDC (ERC-20 stablecoin)
  - Celo: cUSD & USDC (ERC-20 stablecoins)
- **Payment Protocol**: x402 with facilitator verification
- **Gasless Payments**: ERC-2612 Permit & ERC-3009 TransferWithAuthorization on Celo

### AI Agent
- **Model**: Claude Sonnet 4 (via OpenRouter)
- **Influence API**: Kaito Yaps
- **Wallet**: CDP server-side wallet

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Coinbase Developer Platform account (for agent wallet)
- OpenRouter API key (for AI agent)
- Kaito API key (for influence scores)
- Twitter Developer account (for OAuth)
- thirdweb API key (for Celo x402 support)

### Installation

```bash
# Clone the repository
git clone https://github.com/wamimi/LinkTip.git
cd LinkTip

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
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_NETWORK=solana-mainnet-beta

# x402 Protocol
NEXT_PUBLIC_FACILITATOR_URL=https://facilitator.payai.network

# Celo & thirdweb
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your-thirdweb-client-id
THIRDWEB_SECRET_KEY=your-thirdweb-secret-key
THIRDWEB_SERVER_WALLET=your-server-wallet-address

# Celo Configuration
CELO_CHAIN_ID=42220
CELO_RPC_URL=https://forno.celo.org
CELO_USDC_TOKEN=0x01C5C0122039549AD1493B8220cABEdD739BC44E
CELO_CUSD_ADDRESS=0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b

# Base Configuration
BASE_CHAIN_ID=8453
NEXT_PUBLIC_BASE_CHAIN_ID=8453
BASE_RPC_URL=https://mainnet.base.org
NEXT_PUBLIC_BASE_RPC_URL=https://mainnet.base.org
BASE_USDC_TOKEN=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913

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
-- See database/migrations/ for full schema
-- Key tables:
-- - creators (user profiles with multi-chain wallet support)
-- - tips (all tips, human + agent, multi-chain)
-- - agent_actions (agent decision log)

-- Run migrations:
-- 1. Initial schema: database/migrations/initial_schema.sql
-- 2. Celo support: database/migrations/add_celo_support.sql
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
0 */6 * * * curl -X POST https://linktip.xyz/api/agent/run
```

See [agent/README.md](agent/README.md) for detailed agent documentation.

---

## Project Structure

```
LinkTip/
├── app/                                    # Next.js App Router
│   ├── page.tsx                           # Homepage
│   ├── register/                          # Creator registration flow
│   │   └── page.tsx                       # Twitter OAuth + multi-chain wallet connection
│   ├── tip/[slug]/                        # Tipping pages (Multi-chain)
│   │   └── page.tsx                       # x402-powered tipping UI (Solana + Celo)
│   ├── creators/                          # Public creator profiles
│   └── api/                               # API routes
│       ├── auth/[...nextauth]/            # NextAuth Twitter OAuth
│       ├── creators/                      # Creator CRUD operations (multi-chain)
│       ├── tips/                          # Tip recording (multi-chain)
│       ├── x402/                          # x402 payment endpoints
│       │   └── tip/[slug]/
│       │       ├── pay-solana/            # Solana payment handler
│       │       └── pay-celo/              # Celo payment handler (ERC-2612/3009)
│       └── agent/                         # Agent API routes
│           ├── run/                       # Trigger agent run
│           ├── wallet/                    # Agent wallet info
│           ├── tips/                      # Agent tip recording
│           └── decisions/                 # Agent decision logging
│
├── agent/                                  # Autonomous AI Agent
│   ├── lib/
│   │   ├── agent.ts                       # Main agent orchestration (multi-chain)
│   │   └── services/
│   │       ├── solana/                    # Solana-specific services
│   │       │   ├── cdp-wallet.ts          # CDP wallet management
│   │       │   ├── cdp-tipper.ts          # Production tipping (WORKING)
│   │       │   └── x402-tipper.ts         # Experimental x402 (not working yet)
│   │       ├── celo/                      # Celo-specific services
│   │       │   ├── wallet.ts              # Celo wallet management
│   │       │   └── tipper.ts              # Celo tipping service
│   │       ├── kaito.ts                   # Kaito Yaps API
│   │       ├── openrouter.ts              # AI model integration
│   │       └── database.ts                # Database operations
│   └── README.md                          # Agent documentation
│
├── database/                              # Database migrations
│   └── migrations/
│       ├── initial_schema.sql             # Initial Solana-only schema
│       └── add_celo_support.sql           # Multi-chain migration
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

#### `GET /api/x402/tip/[slug]/pay-solana?amount=0.10&token=USDC`
Returns 402 with payment requirements for Solana x402 flow

#### `GET /api/x402/tip/[slug]/pay-celo?amount=1&token=cUSD`
Returns 402 with payment requirements for Celo x402 flow (ERC-2612 Permit or ERC-3009)

#### `POST /api/x402/tip/[slug]/pay-solana`
Verifies Solana payment and records tip (requires X-PAYMENT header)

#### `POST /api/x402/tip/[slug]/pay-celo`
Verifies Celo payment and records tip (requires X-PAYMENT header)

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

### Phase 2: Enhancement (In Progress)
- [x] Multi-chain support (Celo, Base)
- [x] ERC-2612 Permit & ERC-3009 TransferWithAuthorization
- [x] Multi-token support (cUSD, USDC on Celo)
- [ ] Complete x402 server-side agent integration
- [ ] Resolve thirdweb facilitator payment routing
- [ ] Creator dashboard with analytics
- [ ] Agent tip notifications (Twitter DM)
- [ ] Dynamic tip amounts based on influence

### Phase 3: Scale
- [ ] Mainnet deployment (Solana & Celo)
- [ ] Enhanced AI decision-making
- [ ] Creator reputation scores
- [ ] Community governance
- [ ] Additional EVM chains (Base, Optimism, Arbitrum)

---

## Known Issues

### EVM x402 Payment Routing (Base & Celo)
The thirdweb facilitator overrides the `payTo` parameter to route all payments through the server wallet address instead of directly to creators.

**Solution Implemented**: Server-first architecture with automatic redistribution
- Payments are received by server wallet via thirdweb facilitator
- Server automatically redistributes funds to creator wallet immediately after payment settlement
- Both transactions (facilitator + redistribution) are tracked in tip metadata
- If redistribution fails, payment is still received by server wallet (can be manually redistributed later)

**Status**: ✅ Resolved for Base. Celo implementation pending.

**Technical Details**:
- Facilitator transaction: Payment from user → Server wallet
- Redistribution transaction: Transfer from Server wallet → Creator wallet
- Both transaction hashes are stored in tip metadata for transparency

### x402 Agent Implementation (Solana)
The autonomous agent's x402 integration is not working due to a Solana transaction validation error. See [agent/README.md](agent/README.md#x402-protocol-integration-experimental) for details. Currently using direct CDP wallet transfers.

### Devnet vs Mainnet
- Solana: Currently configured for Devnet
- Celo: Currently on Sepolia Testnet
- Mainnet deployment requires CDP fee payer setup and production wallet configuration

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
- [thirdweb x402 Docs](https://portal.thirdweb.com/x402)

### Solana
- [Solana Blinks](https://solana.com/blinks)
- [Solana Explorer](https://explorer.solana.com)
- [SPL Token Program](https://spl.solana.com/token)

### Celo
- [Celo Docs](https://docs.celo.org)
- [Celo Explorer](https://explorer.celo.org)
- [ERC-2612 Permit](https://eips.ethereum.org/EIPS/eip-2612)
- [ERC-3009 TransferWithAuthorization](https://eips.ethereum.org/EIPS/eip-3009)

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


