/**
 * Creator Tips API Endpoint
 * 
 * GET /api/creators/[slug]/tips?chain=solana&source=agent&limit=50&offset=0&sort=created_at
 * 
 * Returns paginated list of tips for a creator with optional filters.
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
    
    // Query parameters
    const chain = searchParams.get('chain') // solana, base, celo
    const source = searchParams.get('source') // human, agent
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const sortBy = searchParams.get('sort') || 'created_at' // created_at, amount
    const sortOrder = searchParams.get('order') || 'desc' // asc, desc

    // First, get creator ID from slug
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('id')
      .eq('slug', slug)
      .single()

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      )
    }

    // Build query
    let query = supabase
      .from('tips')
      .select('*', { count: 'exact' })
      .eq('creator_id', creator.id)

    // Apply filters
    if (chain) {
      query = query.eq('chain', chain)
    }

    if (source) {
      query = query.eq('source', source)
    }

    // Apply sorting
    if (sortBy === 'amount') {
      query = query.order('amount', { ascending: sortOrder === 'asc' })
    } else {
      query = query.order('created_at', { ascending: sortOrder === 'asc' })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: tips, error, count } = await query

    if (error) {
      console.error('[API] Error fetching tips:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tips' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tips: tips || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      },
    })
  } catch (error) {
    console.error('[API] Error in tips endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

