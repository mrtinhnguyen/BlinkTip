import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    const url = new URL(request.url)
    const amount = url.searchParams.get('amount') || '0.01'

    const paymentResponse = {
      success: true,
      message: `Successfully tipped ${creator.name}`,
      tip: {
        creator: creator.name,
        amount,
        slug: creator.slug,
      },
    }

    return NextResponse.json(paymentResponse)
  } catch (error) {
    console.error('[ERROR] x402 payment:', error)
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
  const { slug } = await params

  try {
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('*')
      .eq('slug', slug)
      .single()

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    const paymentHeaders = request.headers.get('X-PAYMENT')
    const paymentResponse = request.headers.get('X-PAYMENT-RESPONSE')

    if (!paymentHeaders && !paymentResponse) {
      return NextResponse.json(
        { error: 'No payment information provided' },
        { status: 400 }
      )
    }

    const url = new URL(request.url)
    const amount = url.searchParams.get('amount') || '0.01'
    const agentId = url.searchParams.get('agent_id')

    const { data: tip, error: tipError } = await supabase
      .from('tips')
      .insert({
        creator_id: creator.id,
        from_address: agentId || 'unknown_agent',
        amount: parseFloat(amount),
        token: 'USDC',
        signature: `base_pending_${Date.now()}`,
        source: 'agent',
        status: 'confirmed',
        metadata: {
          network: 'base-sepolia',
          facilitator: 'https://x402.org/facilitator',
          agent_id: agentId,
          payment_headers: paymentHeaders || paymentResponse,
        },
      })
      .select()
      .single()

    if (tipError) {
      console.error('[ERROR] Failed to record tip:', tipError)
      return NextResponse.json(
        { error: 'Failed to record tip' },
        { status: 500 }
      )
    }

    if (agentId) {
      await supabase.from('agent_actions').insert({
        content_url: url.searchParams.get('content_url') || 'unknown',
        content_title: url.searchParams.get('content_title') || null,
        decision: 'tip',
        tip_id: tip.id,
        reasoning: 'x402 payment completed via Base',
        metadata: {
          agent_id: agentId,
          network: 'base-sepolia',
          amount: parseFloat(amount),
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully tipped ${creator.name}`,
      tip: {
        id: tip.id,
        creator: creator.name,
        amount,
        slug: creator.slug,
      },
    })
  } catch (error) {
    console.error('[ERROR] x402 payment POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
