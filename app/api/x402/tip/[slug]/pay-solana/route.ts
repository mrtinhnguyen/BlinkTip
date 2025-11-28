import { NextRequest, NextResponse } from 'next/server'
import { X402PaymentHandler } from 'x402-solana/server'
import { supabase } from '@/lib/supabase'

// Token mint addresses
// Solana Mainnet USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
// Solana Devnet USDC: Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr
const SOLANA_NETWORK = process.env.NEXT_PUBLIC_NETWORK || 'solana-mainnet-beta';
const IS_MAINNET = SOLANA_NETWORK === 'solana-mainnet-beta';

const TOKENS = {
  USDC: IS_MAINNET 
    ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // USDC Mainnet
    : 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr', // USDC Devnet
  CASH: 'CASHedBw9NfhsLBXq1WNVfueVznx255j8LLTScto3S6s', // Phantom CASH
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const { data: creator, error } = await supabase
      .from('creators')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    // Create x402 handler with THIS creator's wallet address
    // x402-solana uses "solana" for mainnet, "solana-devnet" for devnet
    const networkName = IS_MAINNET ? 'solana' : 'solana-devnet';
    const x402Handler = new X402PaymentHandler({
      network: networkName,
      treasuryAddress: creator.wallet_address, // ✅ Use creator's wallet, not treasury!
      facilitatorUrl: 'https://facilitator.payai.network',
    })

    const paymentHeader = x402Handler.extractPayment(request.headers)

    const url = new URL(request.url)
    const amount = url.searchParams.get('amount') || '0.01'
    const token = (url.searchParams.get('token') || 'USDC') as 'USDC' | 'CASH'
    const tokenMint = TOKENS[token]
    const amountInMicroUsdc = Math.floor(parseFloat(amount) * 1_000_000).toString()

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resourceUrl = `${baseUrl}/api/x402/tip/${slug}/pay-solana?amount=${amount}&token=${token}` as `${string}://${string}`

    const paymentRequirements = await x402Handler.createPaymentRequirements({
      price: {
        amount: amountInMicroUsdc,
        asset: {
          address: tokenMint,
          decimals: 6,
        },
      },
      network: networkName,
      config: {
        description: `Tip ${creator.name} with ${token} for quality content`,
        resource: resourceUrl,
      },
    })

    if (!paymentHeader) {
      const response = x402Handler.create402Response(paymentRequirements)
      return NextResponse.json(response.body, { status: response.status })
    }

    const verified = await x402Handler.verifyPayment(
      paymentHeader,
      paymentRequirements
    )

    if (!verified.isValid) {
      return NextResponse.json(
        { error: 'Invalid payment', reason: verified.invalidReason },
        { status: 402 }
      )
    }

    const settleResult = await x402Handler.settlePayment(
      paymentHeader,
      paymentRequirements
    )

    if (!settleResult.success) {
      return NextResponse.json(
        { error: 'Payment settlement failed', reason: settleResult.errorReason },
        { status: 500 }
      )
    }

    const agentId = url.searchParams.get('agent_id')

    const { data: tip, error: tipError } = await supabase
      .from('tips')
      .insert({
        creator_id: creator.id,
        from_address: agentId || 'unknown_agent',
        amount: parseFloat(amount),
        token: 'USDC',
        signature: settleResult.transaction || `pending_${Date.now()}`,
        source: 'agent',
        status: settleResult.success ? 'confirmed' : 'pending',
        metadata: {
          network: networkName,
          facilitator: 'https://facilitator.payai.network',
          agent_id: agentId,
        },
      })
      .select()
      .single()

    if (tipError) {
      console.error('[ERROR] Failed to record tip:', tipError)
    }

    if (agentId && !tipError) {
      await supabase.from('agent_actions').insert({
        content_url: url.searchParams.get('content_url') || 'unknown',
        content_title: url.searchParams.get('content_title') || null,
        decision: 'tip',
        tip_id: tip?.id,
        reasoning: 'x402 payment completed via Solana',
        metadata: {
          agent_id: agentId,
          network: networkName,
          amount: parseFloat(amount),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully tipped ${creator.name}`,
      tip: {
        id: tip?.id,
        creator: creator.name,
        amount,
        slug: creator.slug,
        transaction: settleResult.transaction,
        network: networkName,
      },
    })
  } catch (error) {
    console.error('[ERROR] x402 Solana payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return GET(request, { params })
}
