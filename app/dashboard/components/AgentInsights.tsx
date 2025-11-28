'use client'

import { useEffect, useState } from 'react'
import ChainBadge from '@/components/creator/ChainBadge'

interface AgentInsightsProps {
  creatorSlug: string
}

type AgentInsight = {
  id: string
  decision: 'tip' | 'skip' | 'error'
  reasoning: string | null
  yapsScore7d: number | null
  yapsScore30d: number | null
  evaluationScore: number | null
  chain: string | null
  contentUrl: string | null
  contentTitle: string | null
  tipId: string | null
  metadata: any
  createdAt: string
}

export default function AgentInsights({ creatorSlug }: AgentInsightsProps) {
  const [insights, setInsights] = useState<AgentInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInsights() {
      setLoading(true)
      try {
        const response = await fetch(`/api/creators/${creatorSlug}/agent-insights?limit=20`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch agent insights')
        }

        setInsights(data.insights || [])
      } catch (err) {
        console.error('Error fetching agent insights:', err)
        setError(err instanceof Error ? err.message : 'Failed to load insights')
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [creatorSlug])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400">Loading agent insights...</div>
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

  if (insights.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4">🤖</div>
        <div className="text-gray-600 dark:text-gray-400 text-lg font-semibold mb-2">No agent insights yet</div>
        <div className="text-gray-500 dark:text-gray-500 text-sm">
          The AI agent hasn&apos;t analyzed your profile yet.
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-4">
      {insights.map((insight) => (
        <div
          key={insight.id}
          className={`rounded-lg border p-4 ${
            insight.decision === 'tip'
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
              : insight.decision === 'skip'
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
          }`}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {insight.decision === 'tip' ? '✅' : insight.decision === 'skip' ? '⏭️' : '❌'}
              </div>
              <div>
                <div className="font-bold text-lg">
                  {insight.decision === 'tip' ? 'TIP' : insight.decision === 'skip' ? 'SKIP' : 'ERROR'}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(insight.createdAt)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {insight.chain && insight.chain !== 'multi' && (
                <ChainBadge chain={insight.chain as 'solana' | 'base' | 'celo'} />
              )}
            </div>
          </div>

          {insight.reasoning && (
            <div className="mt-3 p-3 bg-white dark:bg-zinc-800 rounded-lg">
              <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                AI Reasoning:
              </div>
              <div className="text-sm text-gray-800 dark:text-gray-200">{insight.reasoning}</div>
            </div>
          )}

          {(insight.yapsScore7d !== null || insight.yapsScore30d !== null) && (
            <div className="mt-3 flex items-center gap-4 text-sm">
              {insight.yapsScore7d !== null && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">7d Yaps:</span>{' '}
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {insight.yapsScore7d.toFixed(2)}
                  </span>
                </div>
              )}
              {insight.yapsScore30d !== null && (
                <div>
                  <span className="text-gray-600 dark:text-gray-400">30d Yaps:</span>{' '}
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {insight.yapsScore30d.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {insight.tipId && (
            <div className="mt-3 text-sm">
              <span className="text-gray-600 dark:text-gray-400">Tip ID: </span>
              <span className="font-mono text-gray-800 dark:text-gray-200">{insight.tipId}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

