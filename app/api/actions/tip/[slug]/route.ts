import { NextRequest, NextResponse } from 'next/server'
import {
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from '@solana/actions'
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
} from '@solana/web3.js'
import { supabase } from '@/lib/supabase'

const DEFAULT_TIP_AMOUNT = 0.02

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
        { message: 'Creator not found' },
        { status: 404, headers: ACTIONS_CORS_HEADERS }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const payload: ActionGetResponse = {
      type: 'action',
      title: `Tip ${creator.name}`,
      icon: creator.avatar_url || `${baseUrl}/logo.png`,
      description: creator.bio || `Support ${creator.name} with a tip`,
      label: 'Tip',
      links: {
        actions: [
          {
            type: 'transaction',
            label: 'Tip 0.01 SOL',
            href: `/api/actions/tip/${slug}?amount=0.01`,
          },
          {
            type: 'transaction',
            label: 'Tip 0.05 SOL',
            href: `/api/actions/tip/${slug}?amount=0.05`,
          },
          {
            type: 'transaction',
            label: 'Tip 0.1 SOL',
            href: `/api/actions/tip/${slug}?amount=0.1`,
          },
          {
            type: 'transaction',
            label: 'Tip Custom Amount',
            href: `/api/actions/tip/${slug}?amount={amount}`,
            parameters: [
              {
                name: 'amount',
                label: 'Enter SOL amount',
                required: true,
              },
            ],
          },
        ],
      },
    }

    return NextResponse.json(payload, {
      headers: {
        ...ACTIONS_CORS_HEADERS,
        'X-Action-Version': '2.2.1',
        'X-Blockchain-Ids': 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      },
    })
  } catch (error) {
    console.error('[ERROR] Actions GET:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    )
  }
}

export async function OPTIONS() {
  return new Response(null, { headers: ACTIONS_CORS_HEADERS })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const body: ActionPostRequest = await request.json()
    const { account } = body

    let accountPubkey: PublicKey
    try {
      accountPubkey = new PublicKey(account)
    } catch {
      return NextResponse.json(
        { message: 'Invalid account provided' },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      )
    }

    const { data: creator, error } = await supabase
      .from('creators')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !creator) {
      return NextResponse.json(
        { message: 'Creator not found' },
        { status: 404, headers: ACTIONS_CORS_HEADERS }
      )
    }

    let creatorPubkey: PublicKey
    try {
      creatorPubkey = new PublicKey(creator.wallet_address)
    } catch {
      return NextResponse.json(
        { message: 'Invalid creator wallet address' },
        { status: 500, headers: ACTIONS_CORS_HEADERS }
      )
    }

    const url = new URL(request.url)
    const amountParam = url.searchParams.get('amount')
    const amount = amountParam ? parseFloat(amountParam) : DEFAULT_TIP_AMOUNT

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { message: 'Invalid tip amount' },
        { status: 400, headers: ACTIONS_CORS_HEADERS }
      )
    }

    const lamports = Math.floor(amount * 1000000000)

    const connection = new Connection(
      process.env.NEXT_PUBLIC_NETWORK === 'solana-mainnet-beta'
        ? clusterApiUrl('mainnet-beta')
        : clusterApiUrl('devnet')
    )

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: accountPubkey,
        toPubkey: creatorPubkey,
        lamports,
      })
    )

    transaction.feePayer = accountPubkey
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash()
    ).blockhash

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        type: 'transaction',
        transaction,
        message: `Tipping ${amount} SOL to ${creator.name}`,
      },
    })

    const { data: savedTip, error: dbError } = await supabase.from('tips').insert({
      creator_id: creator.id,
      from_address: accountPubkey.toBase58(),
      amount,
      token: 'SOL',
      signature: 'pending',
      source: 'human',
      status: 'pending',
      metadata: {
        network: process.env.NEXT_PUBLIC_NETWORK === 'solana-mainnet-beta' ? 'mainnet-beta' : 'devnet',
        lamports,
      },
    }).select()

    if (dbError) {
      console.error('[ERROR] Failed to record tip in database:', dbError)
      console.error('[ERROR] Database error details:', JSON.stringify(dbError, null, 2))
    } else {
      console.log('[SUCCESS] Tip saved to database:', savedTip)
    }

    return NextResponse.json(payload, {
      headers: {
        ...ACTIONS_CORS_HEADERS,
        'X-Action-Version': '2.2.1',
        'X-Blockchain-Ids': 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp',
      },
    })
  } catch (error) {
    console.error('[ERROR] Actions POST:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500, headers: ACTIONS_CORS_HEADERS }
    )
  }
}
