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
        amount: parseFloat(amount),
        currency: 'USDC',
        network: 'base-sepolia',
        tx_hash: null,
        tipper_address: agentId || 'unknown',
        is_agent: true,
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
        agent_id: agentId,
        action_type: 'tip',
        target_creator_id: creator.id,
        amount: parseFloat(amount),
        network: 'base-sepolia',
        success: true,
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
