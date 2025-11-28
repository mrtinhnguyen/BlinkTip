/**
 * Creator Me API Endpoint (Authenticated)
 * 
 * GET /api/creators/me
 * 
 * Returns authenticated creator's own profile, stats, and recent tips summary.
 * Requires NextAuth session with Twitter handle.
 */

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)

    if (!session?.user?.twitterHandle) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in with Twitter.' },
        { status: 401 }
      )
    }

    const twitterHandle = session.user.twitterHandle

    // Fetch creator by Twitter handle
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('*')
      .eq('twitter_handle', twitterHandle)
      .single()

    if (creatorError || !creator) {
      return NextResponse.json(
        { 
          error: 'Creator profile not found',
          message: 'Please register your creator profile first',
          redirectTo: '/register'
        },
        { status: 404 }
      )
    }

    // Fetch creator stats
    const { data: stats } = await supabase
      .from('creator_stats')
      .select('*')
      .eq('slug', creator.slug)
      .single()

    // Fetch recent tips (last 5)
    const { data: recentTips } = await supabase
      .from('tips')
      .select('*')
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: false })
      .limit(5)

    // Fetch recent agent insights (last 5)
    const { data: recentInsights } = await supabase
      .from('agent_actions')
      .select('*')
      .eq('twitter_handle', twitterHandle)
      .order('created_at', { ascending: false })
      .limit(5)

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    return NextResponse.json({
      success: true,
      creator: {
        id: creator.id,
        slug: creator.slug,
        name: creator.name,
        bio: creator.bio,
        avatarUrl: creator.avatar_url || creator.twitter_avatar_url,
        walletAddress: creator.wallet_address,
        evmWalletAddress: creator.evm_wallet_address,
        supportedChains: creator.supported_chains,
        twitterHandle: creator.twitter_handle,
        twitterVerified: creator.twitter_verified,
        tipLink: `${baseUrl}/tip/${creator.slug}`,
        blinkUrl: `https://dial.to/?action=solana-action:${baseUrl}/api/actions/tip/${creator.slug}`,
      },
      stats: stats ? {
        totalTips: Number(stats.total_tips) || 0,
        humanTips: Number(stats.human_tips) || 0,
        agentTips: Number(stats.agent_tips) || 0,
        solanaTips: Number(stats.solana_tips) || 0,
        baseTips: Number(stats.base_tips) || 0,
        celoTips: Number(stats.celo_tips) || 0,
        totalEarnings: Number(stats.total_earnings) || 0,
        humanEarnings: Number(stats.human_earnings) || 0,
        agentEarnings: Number(stats.agent_earnings) || 0,
        solanaEarnings: Number(stats.solana_earnings) || 0,
        baseEarnings: Number(stats.base_earnings) || 0,
        celoEarnings: Number(stats.celo_earnings) || 0,
        lastTipAt: stats.last_tip_at,
      } : null,
      recentTips: recentTips || [],
      recentInsights: recentInsights || [],
    })
  } catch (error) {
    console.error('[API] Error in /creators/me endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

