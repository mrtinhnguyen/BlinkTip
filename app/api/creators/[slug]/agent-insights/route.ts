/**
 * Creator Agent Insights API Endpoint
 * 
 * GET /api/creators/[slug]/agent-insights
 * 
 * Returns agent decisions (TIP/SKIP) for a creator with AI reasoning and Yaps scores.
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // First, get creator info
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('id, twitter_handle')
      .eq('slug', slug)
      .single()

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    // Fetch agent actions for this creator
    const { data: actions, error } = await supabase
      .from('agent_actions')
      .select('*')
      .eq('twitter_handle', creator.twitter_handle)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[API] Error fetching agent insights:', error)
      return NextResponse.json(
        { error: 'Failed to fetch agent insights' },
        { status: 500 }
      )
    }

    // Format response
    const insights = (actions || []).map((action) => ({
      id: action.id,
      decision: action.decision, // 'tip' | 'skip' | 'error'
      reasoning: action.reasoning,
      yapsScore7d: action.yaps_score_7d,
      yapsScore30d: action.yaps_score_30d,
      evaluationScore: action.evaluation_score,
      chain: action.chain,
      contentUrl: action.content_url,
      contentTitle: action.content_title,
      tipId: action.tip_id,
      metadata: action.metadata,
      createdAt: action.created_at,
    }))

    return NextResponse.json({
      success: true,
      insights,
      summary: {
        total: insights.length,
        tips: insights.filter((i) => i.decision === 'tip').length,
        skips: insights.filter((i) => i.decision === 'skip').length,
      },
    })
  } catch (error) {
    console.error('[API] Error in agent-insights endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

