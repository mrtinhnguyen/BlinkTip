'use client'

import { useEffect, useState } from 'react'
import { useSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StatsCards from './components/StatsCards'
import TipsList from './components/TipsList'
import AgentInsights from './components/AgentInsights'
import EarningsChart from './components/EarningsChart'

type CreatorData = {
  id: string
  slug: string
  name: string
  bio: string | null
  avatarUrl: string | null
  walletAddress: string | null
  evmWalletAddress: string | null
  supportedChains: string[]
  twitterHandle: string
  twitterVerified: boolean
  tipLink: string
  blinkUrl: string
}

type StatsData = {
  totalTips: number
  humanTips: number
  agentTips: number
  solanaTips: number
  baseTips: number
  celoTips: number
  totalEarnings: number
  humanEarnings: number
  agentEarnings: number
  solanaEarnings: number
  baseEarnings: number
  celoEarnings: number
  lastTipAt: string | null
}

export default function DashboardPage() {
  const { status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [creator, setCreator] = useState<CreatorData | null>(null)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCreatorData() {
      if (status === 'loading') return

      if (status === 'unauthenticated') {
        signIn('twitter')
        return
      }

      try {
        const response = await fetch('/api/creators/me')
        const data = await response.json()

        if (!response.ok) {
          if (response.status === 404) {
            // Creator profile not found, redirect to register
            router.push('/register')
            return
          }
          throw new Error(data.error || 'Failed to fetch creator data')
        }

        setCreator(data.creator)
        setStats(data.stats)
      } catch (err) {
        console.error('Error fetching creator data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchCreatorData()
  }, [status, router])

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">📊</div>
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">Loading dashboard...</div>
        </div>
      </div>
    )
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-5xl mb-4">😕</div>
          <div className="text-red-600 dark:text-red-400 text-xl font-bold mb-2">Error</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'Creator profile not found'}</p>
          <Link
            href="/register"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            Create Profile
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Creator Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your LinkTip profile and view earnings</p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Profile Overview */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 mb-6 border border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-6">
            {creator.avatarUrl && (
              <img
                src={creator.avatarUrl}
                alt={creator.name}
                className="w-20 h-20 rounded-full border-4 border-purple-200 dark:border-purple-800"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">{creator.name}</h2>
                {creator.twitterVerified && (
                  <span className="text-blue-500" title="Verified Twitter account">✓</span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">{creator.bio || 'No bio set'}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-500 dark:text-gray-400">@{creator.twitterHandle}</span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="text-gray-500 dark:text-gray-400">/{creator.slug}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="mb-2">
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Your Tip Link</label>
                <div className="flex items-center gap-2">
                  <code className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 rounded-lg text-sm font-mono">
                    {creator.tipLink}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(creator.tipLink)
                      alert('Tip link copied!')
                    }}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && <StatsCards stats={stats} />}

        {/* Earnings Chart */}
        {stats && stats.totalEarnings > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 mb-6 border border-gray-100 dark:border-zinc-800">
            <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Earnings Over Time</h3>
            <EarningsChart creatorSlug={creator.slug} />
          </div>
        )}

        {/* Tips List */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 mb-6 border border-gray-100 dark:border-zinc-800">
          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Recent Tips</h3>
          <TipsList creatorSlug={creator.slug} />
        </div>

        {/* Agent Insights */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-6 border border-gray-100 dark:border-zinc-800">
          <h3 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">AI Agent Insights</h3>
          <AgentInsights creatorSlug={creator.slug} />
        </div>
      </div>
    </div>
  )
}

