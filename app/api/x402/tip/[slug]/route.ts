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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return NextResponse.json({
      creator: {
        slug: creator.slug,
        name: creator.name,
        bio: creator.bio,
        avatar_url: creator.avatar_url,
        wallet_address: creator.wallet_address,
      },
      payment: {
        endpoint: `${baseUrl}/api/x402/tip/${slug}/pay`,
        description: `Tip ${creator.name} for quality content`,
        default_amount: '$0.01',
        supported_networks: ['base-sepolia', 'solana-devnet'],
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
