'use client'

import { useEffect, useState } from 'react'
import TipCard from '@/components/creator/TipCard'

interface TipsListProps {
  creatorSlug: string
}

type Tip = {
  id: string
  amount: number
  token: string
  chain: 'solana' | 'base' | 'celo'
  source: 'human' | 'agent'
  signature: string
  status: 'pending' | 'confirmed' | 'failed'
  created_at: string
  metadata?: any
}

export default function TipsList({ creatorSlug }: TipsListProps) {
  const [tips, setTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState({
    chain: '',
    source: '',
    limit: 20,
  })

  useEffect(() => {
    async function fetchTips() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (filters.chain) params.append('chain', filters.chain)
        if (filters.source) params.append('source', filters.source)
        params.append('limit', filters.limit.toString())
        params.append('sort', 'created_at')
        params.append('order', 'desc')

        const response = await fetch(`/api/creators/${creatorSlug}/tips?${params.toString()}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch tips')
        }

        setTips(data.tips || [])
      } catch (err) {
        console.error('Error fetching tips:', err)
        setError(err instanceof Error ? err.message : 'Failed to load tips')
      } finally {
        setLoading(false)
      }
    }

    fetchTips()
  }, [creatorSlug, filters.chain, filters.source, filters.limit])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400">Loading tips...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    )
  }

  if (tips.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">💰</div>
        <div className="text-gray-600 dark:text-gray-400 text-lg font-semibold mb-2">No tips yet</div>
        <div className="text-gray-500 dark:text-gray-500 text-sm">
          Share your tip link to start receiving tips!
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filters.chain}
          onChange={(e) => setFilters({ ...filters, chain: e.target.value })}
          className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200"
        >
          <option value="">All Chains</option>
          <option value="solana">Solana</option>
          <option value="base">Base</option>
          <option value="celo">Celo</option>
        </select>

        <select
          value={filters.source}
          onChange={(e) => setFilters({ ...filters, source: e.target.value })}
          className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200"
        >
          <option value="">All Sources</option>
          <option value="human">Human</option>
          <option value="agent">AI Agent</option>
        </select>

        <button
          onClick={() => setFilters({ chain: '', source: '', limit: 20 })}
          className="px-4 py-2 border border-gray-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
        >
          Clear Filters
        </button>
      </div>

      {/* Tips List */}
      <div className="space-y-4">
        {tips.map((tip) => (
          <TipCard key={tip.id} tip={tip} />
        ))}
      </div>

      {tips.length >= filters.limit && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setFilters({ ...filters, limit: filters.limit + 20 })}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}

