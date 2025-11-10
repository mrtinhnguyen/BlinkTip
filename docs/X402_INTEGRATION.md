# x402 Payment Integration

BlinkTip integrates the x402 payment protocol to enable AI agents to autonomously tip creators using micropayments.

## Overview

The x402 protocol enables HTTP-native payments using the HTTP 402 "Payment Required" status code. This allows AI agents to:

1. Discover creator tip endpoints
2. Receive payment requirements
3. Submit cryptographically signed payments
4. Receive access to content or confirmation

## Endpoints

### GET /api/x402/tip/[slug]

Returns creator information and payment endpoint details for agents.

**Response:**
```json
{
  "creator": {
    "slug": "alice",
    "name": "Alice Creator",
    "bio": "Crypto content creator",
    "avatar_url": "https://...",
    "wallet_address": "..."
  },
  "payment": {
    "endpoint": "http://localhost:3000/api/x402/tip/alice/pay",
    "description": "Tip Alice Creator for quality content",
    "default_amount": "$0.01",
    "supported_networks": ["base-sepolia", "solana-devnet"]
  }
}
```

### GET /api/x402/tip/[slug]/pay

Protected by x402 middleware. Returns 402 Payment Required with payment details if no valid payment is provided.

**Query Parameters:**
- `amount` - Tip amount in USD (default: 0.01)
- `agent_id` - Identifier for the AI agent making the payment

**Without Payment (402 Response):**
```json
{
  "x402Version": 1,
  "accepts": [
    {
      "scheme": "eip1193",
      "network": "base-sepolia",
      "maxAmountRequired": "10000",
      "resource": "/api/x402/tip/alice/pay",
      "payTo": "0x...",
      "asset": "0x...",
      "description": "Tip creator for quality content"
    }
  ]
}
```

**With Valid Payment (200 Response):**
```json
{
  "success": true,
  "message": "Successfully tipped Alice Creator",
  "tip": {
    "id": "...",
    "creator": "Alice Creator",
    "amount": "0.01",
    "slug": "alice"
  }
}
```

### POST /api/x402/tip/[slug]/pay

Processes payment and records the tip in the database.

**Headers:**
- `X-PAYMENT` - Base64-encoded payment payload

**Response:** Same as GET with valid payment

## Supported Networks

- **Base Sepolia** (testnet) - USDC payments via EIP-1193
- **Solana Devnet** (testnet) - SOL/USDC payments

## Facilitator

BlinkTip uses the public x402.org facilitator for payment verification and settlement:
- URL: https://x402.org/facilitator
- Zero fees on testnet
- Automatic payment verification and blockchain settlement

## Agent Integration

AI agents can integrate with BlinkTip in 3 steps:

1. **Discovery**: GET /api/x402/tip/[slug] to find payment endpoint
2. **Payment Challenge**: GET payment endpoint, receive 402 with payment requirements
3. **Payment Submission**: POST payment with X-PAYMENT header containing signed transaction

## Environment Variables

Required for x402 functionality:

```env
NEXT_PUBLIC_RECEIVER_ADDRESS=<wallet-address>
NEXT_PUBLIC_NETWORK=base-sepolia|solana-devnet
NEXT_PUBLIC_FACILITATOR_URL=https://x402.org/facilitator
NEXT_PUBLIC_CDP_CLIENT_KEY=<coinbase-cdp-client-key>
```

## Testing

Run the test script to verify x402 endpoints:

```bash
pnpm test-x402
```

This will test:
- Creator info retrieval
- 402 Payment Required response
- Payment requirement structure
- Error handling

## Technical Details

The implementation uses:
- `x402-next` - Next.js middleware for x402 protocol
- `middleware.ts` - Configures payment requirements per route
- `viem` - Ethereum wallet and transaction handling
- `@solana/web3.js` - Solana transaction support

Payment verification and settlement are handled by the facilitator, so BlinkTip servers don't need to run blockchain nodes or manage transaction complexity.
