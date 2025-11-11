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

**Content creators in crypto face three major challenges:**

1. **Discoverability**: Great creators get lost in the noise of crypto Twitter
2. **Monetization**: Building an audience doesn't always translate to income
3. **Recognition**: Real influence and expertise go unrewarded while engagement farmers thrive

Traditional tipping is manual, requires finding wallet addresses, and offers no way to systematically reward quality creators.

## The Solution

**BlinkTip combines three powerful technologies to solve this:**

### 1. Solana Blinks (Twitter Integration)
Creators register once and get a personalized tipping link that unfurls beautifully on Twitter:

```
https://blinktip.xyz/tip/nellycyberpro
→ Unfurls into interactive tipping card on Twitter
→ Supporters tip directly from their timeline
→ Powered by x402 protocol for instant USDC payments
```

### 2. x402 Payment Protocol
The HTTP-native payment protocol that makes crypto tipping as easy as clicking a button:

- **No wallet copying**: Tips happen directly in the browser
- **Instant verification**: Payments verified on Solana blockchain
- **Secure**: Protocol-level payment guarantees via facilitator
- **Standards-based**: Uses HTTP 402 status code (Payment Required)

### 3. Autonomous AI Agent
A Claude Sonnet 4-powered agent that discovers and rewards creators automatically:

- **Discovers** creators via Kaito Yaps (crypto influence API)
- **Evaluates** authenticity (Twitter verification, account age, profile quality)
- **Decides** who to tip using AI reasoning
- **Tips** directly from its own CDP wallet
- **Records** all decisions transparently

---

## How It Works

### For Creators (Human Tips)

1. **Register**: Connect Twitter + Solana wallet
2. **Get Blink**: Receive personalized tip link
3. **Share**: Post on Twitter, link unfurls into tipping card
4. **Receive Tips**: USDC arrives directly in wallet

### For Supporters (Human Tips)

1. **Find Creator**: Discover via Twitter or search platform
2. **Click Tip**: Solana Blink unfurls on Twitter
3. **Choose Amount**: Select preset or custom USDC amount
4. **Pay via x402**: Wallet signs transaction, verified on-chain
5. **Done**: Creator receives tip instantly

### For the AI Agent (Autonomous Tips)

1. **Scan**: Agent fetches all registered creators
2. **Analyze**: Queries Kaito Yaps API for crypto influence scores
3. **Evaluate**: AI analyzes profile completeness, account age, follower count
4. **Decide**: Claude Sonnet 4 makes TIP/SKIP decision with reasoning
5. **Execute**: Agent's CDP wallet sends USDC tip directly
6. **Record**: Decision and transaction logged to database

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
- **Token**: USDC (SPL token)
- **Payment Protocol**: x402 with facilitator verification

### AI Agent
- **Model**: Claude Sonnet 4 (via OpenRouter)
- **Influence API**: Kaito Yaps
- **Wallet**: CDP server-side wallet
- **Decision Window**: 24-hour cooldown per creator

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
git clone https://github.com/yourusername/BlinkTip.git
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
KAITO_API_KEY=your-kaito-key

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
0 */6 * * * curl -X POST https://blinktip.xyz/api/agent/run
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
- [x402 Specification](https://x402.sh)
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

---

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/BlinkTip/issues)
- **Twitter**: [@blinktip](https://twitter.com/blinktip)
- **Discord**: [Join our community](https://discord.gg/blinktip)

---

## License

MIT License - see [LICENSE](LICENSE) for details

---

**Built for the x402 Hackathon** | **Powered by Solana, x402, and Claude AI** | **Making crypto creator tipping autonomous and accessible**
