import { NextRequest, NextResponse } from 'next/server'
import { X402PaymentHandler } from 'x402-solana/server'
import { supabase } from '@/lib/supabase'

const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'

const x402Handler = new X402PaymentHandler({
  network: 'solana-devnet',
  treasuryAddress: process.env.TREASURY_WALLET_ADDRESS!,
  facilitatorUrl: 'https://facilitator.payai.network',
})

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

    const paymentHeader = x402Handler.extractPayment(request.headers)

    const url = new URL(request.url)
    const amount = url.searchParams.get('amount') || '0.01'
    const amountInMicroUsdc = Math.floor(parseFloat(amount) * 1_000_000).toString()

    const paymentRequirements = await x402Handler.createPaymentRequirements({
      price: {
        amount: amountInMicroUsdc,
        asset: {
          address: USDC_DEVNET_MINT,
        },
      },
      network: 'solana-devnet',
      config: {
        description: `Tip ${creator.name} for quality content`,
        resource: `${process.env.NEXT_PUBLIC_BASE_URL}/api/x402/tip/${slug}/pay-solana?amount=${amount}`,
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
        amount: parseFloat(amount),
        currency: 'USDC',
        network: 'solana-devnet',
        tx_hash: settleResult.transaction || null,
        tipper_address: agentId || 'unknown',
        is_agent: true,
      })
      .select()
      .single()

    if (tipError) {
      console.error('[ERROR] Failed to record tip:', tipError)
    }

    if (agentId && !tipError) {
      await supabase.from('agent_actions').insert({
        agent_id: agentId,
        action_type: 'tip',
        target_creator_id: creator.id,
        amount: parseFloat(amount),
        network: 'solana-devnet',
        success: true,
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
        network: 'solana-devnet',
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
