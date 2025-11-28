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

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return NextResponse.json({
      creator: {
        slug: creator.slug,
        name: creator.name,
        bio: creator.bio,
        avatar_url: creator.avatar_url,
        wallet_address: creator.wallet_address,
      },
      payment: {
        endpoint: `${baseUrl}/api/x402/tip/${slug}/pay-solana`,
        network: process.env.NEXT_PUBLIC_NETWORK || 'solana-mainnet-beta',
        description: `Tip ${creator.name} via Solana (USDC)`,
        facilitator: 'https://facilitator.payai.network',
        default_amount: '$0.01',
        token: process.env.NEXT_PUBLIC_NETWORK === 'solana-mainnet-beta' ? 'USDC' : 'USDC-Dev',
        token_mint: process.env.NEXT_PUBLIC_NETWORK === 'solana-mainnet-beta'
          ? 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' // Mainnet
          : 'Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr', // Devnet
      },
    })
  } catch (error) {
    console.error('[ERROR] x402 tip info:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
