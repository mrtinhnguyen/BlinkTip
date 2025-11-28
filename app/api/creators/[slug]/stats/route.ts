/**
 * Creator Stats API Endpoint
 * 
 * GET /api/creators/[slug]/stats
 * 
 * Returns aggregated statistics for a creator from creator_stats view.
 * Includes per-chain breakdown (Solana, Base, Celo) and source breakdown (human/agent).
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    // Fetch creator stats from view
    const { data: stats, error } = await supabase
      .from('creator_stats')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !stats) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      stats: {
        id: stats.id,
        slug: stats.slug,
        name: stats.name,
        solanaWallet: stats.solana_wallet,
        evmWallet: stats.evm_wallet,
        supportedChains: stats.supported_chains,
        
        // Overall stats
        totalTips: Number(stats.total_tips) || 0,
        humanTips: Number(stats.human_tips) || 0,
        agentTips: Number(stats.agent_tips) || 0,
        
        // Per-chain tip counts
        solanaTips: Number(stats.solana_tips) || 0,
        baseTips: Number(stats.base_tips) || 0,
        celoTips: Number(stats.celo_tips) || 0,
        
        // Earnings
        totalEarnings: Number(stats.total_earnings) || 0,
        humanEarnings: Number(stats.human_earnings) || 0,
        agentEarnings: Number(stats.agent_earnings) || 0,
        
        // Per-chain earnings
        solanaEarnings: Number(stats.solana_earnings) || 0,
        baseEarnings: Number(stats.base_earnings) || 0,
        celoEarnings: Number(stats.celo_earnings) || 0,
        
        // Metadata
        lastTipAt: stats.last_tip_at,
      },
    })
  } catch (error) {
    console.error('[API] Error fetching creator stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

