# LinkTip x402 API Endpoints for X402Scan.com

Base URL: `https://linktip.xyz`

## 1. Tip Creator on Solana

**Endpoint:** `GET/POST /api/x402/tip/[slug]/pay-solana`

**Description:** Tip a creator on Solana blockchain using USDC via x402 protocol.

**Parameters:**
- `slug` (path): Creator's unique slug (e.g., `vitalik`, `elonmusk`)
- `amount` (query, optional): Tip amount in USDC (default: `0.01`)
- `token` (query, optional): Token type - `USDC` or `CASH` (default: `USDC`)
- `agent_id` (query, optional): Agent ID for tracking

**Example:**
```
GET https://linktip.xyz/api/x402/tip/vitalik/pay-solana?amount=0.1&token=USDC
```

**Network:** 
- Mainnet: `solana` (Solana Mainnet)
- Devnet: `solana-devnet` (Solana Devnet)

**Facilitator:** `https://facilitator.payai.network`

**Token Addresses:**
- Mainnet USDC: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- Devnet USDC: `Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr`

---

## 2. Tip Creator on Base

**Endpoint:** `GET/POST /api/x402/tip/[slug]/pay-base`

**Description:** Tip a creator on Base blockchain using USDC via x402 protocol (thirdweb).

**Parameters:**
- `slug` (path): Creator's unique slug
- `amount` (query, optional): Tip amount in USDC (default: `0.01`)
- `token` (query, optional): Token type - `USDC` (default: `USDC`)
- `agent_id` (query, optional): Agent ID for tracking

**Example:**
```
GET https://linktip.xyz/api/x402/tip/vitalik/pay-base?amount=0.1&token=USDC
```

**Network:**
- Mainnet: `base-mainnet` (Base Mainnet, Chain ID: 8453)
- Testnet: `base-sepolia` (Base Sepolia, Chain ID: 84532)

**Facilitator:** Thirdweb x402 facilitator

**Token Address:**
- Base USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (6 decimals)

**Note:** Payments are routed through server wallet and then redistributed to creator.

---

## 3. Tip Creator on Celo

**Endpoint:** `GET/POST /api/x402/tip/[slug]/pay-celo`

**Description:** Tip a creator on Celo blockchain using USDC or cUSD via x402 protocol (thirdweb).

**Parameters:**
- `slug` (path): Creator's unique slug
- `amount` (query, optional): Tip amount (default: `0.01`)
- `token` (query, optional): Token type - `USDC` or `cUSD` (default: `USDC`)
- `agent_id` (query, optional): Agent ID for tracking

**Example:**
```
GET https://linktip.xyz/api/x402/tip/vitalik/pay-celo?amount=0.1&token=USDC
```

**Network:**
- Mainnet: `celo-mainnet` (Celo Mainnet, Chain ID: 42220)
- Testnet: `celo-sepolia` (Celo Sepolia, Chain ID: 11142220)

**Facilitator:** Thirdweb x402 facilitator

**Token Addresses:**
- Celo USDC: `0x01C5C0122039549AD1493B8220cABEdD739BC44E` (6 decimals)
- Celo cUSD: `0xdE9e4C3ce781b4bA68120d6261cbad65ce0aB00b` (18 decimals)

---

## 4. Fund Agent Wallet

**Endpoint:** `GET/POST /api/x402/fund-agent`

**Description:** Fund the LinkTip autonomous agent wallet with USDC on Base. Anyone can fund the agent to enable autonomous tipping.

**Parameters:**
- `amount` (query, optional): Funding amount in USDC (default: `1.0`)
- `token` (query, optional): Token type - `USDC` (default: `USDC`)

**Example:**
```
GET https://linktip.xyz/api/x402/fund-agent?amount=10.0&token=USDC
```

**Network:**
- Mainnet: `base-mainnet` (Base Mainnet, Chain ID: 8453)
- Testnet: `base-sepolia` (Base Sepolia, Chain ID: 84532)

**Facilitator:** Thirdweb x402 facilitator

**Token Address:**
- Base USDC: `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913` (6 decimals)

---

## 5. Get Creator Tip Info

**Endpoint:** `GET /api/x402/tip/[slug]`

**Description:** Get creator information and x402 payment endpoint details.

**Parameters:**
- `slug` (path): Creator's unique slug

**Example:**
```
GET https://linktip.xyz/api/x402/tip/vitalik
```

**Response:**
```json
{
  "creator": {
    "slug": "vitalik",
    "name": "Vitalik Buterin",
    "bio": "...",
    "avatar_url": "...",
    "wallet_address": "..."
  },
  "payment": {
    "endpoint": "https://linktip.xyz/api/x402/tip/vitalik/pay-solana",
    "network": "solana-mainnet-beta",
    "description": "Tip Vitalik Buterin via Solana (USDC)",
    "facilitator": "https://facilitator.payai.network",
    "default_amount": "$0.01",
    "token": "USDC",
    "token_mint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
  }
}
```

---

## Summary for X402Scan.com

### Quick Reference

| Endpoint | Chain | Method | Description |
|----------|-------|--------|-------------|
| `/api/x402/tip/[slug]/pay-solana` | Solana | GET/POST | Tip creator on Solana |
| `/api/x402/tip/[slug]/pay-base` | Base | GET/POST | Tip creator on Base |
| `/api/x402/tip/[slug]/pay-celo` | Celo | GET/POST | Tip creator on Celo |
| `/api/x402/fund-agent` | Base | GET/POST | Fund autonomous agent |
| `/api/x402/tip/[slug]` | Info | GET | Get creator payment info |

### Example Creator Slugs
- `vitalik` - Vitalik Buterin
- `elonmusk` - Elon Musk
- (Any verified creator's Twitter handle slug)

### Testing
Replace `[slug]` with an actual creator slug from LinkTip platform.

### Documentation
Full documentation: https://linktip.xyz/api/x402/fund-agent

