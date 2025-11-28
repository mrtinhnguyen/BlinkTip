'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ChainBadge from '@/components/creator/ChainBadge'
import TipCard from '@/components/creator/TipCard'
import QRCode from '@/components/creator/QRCode'

type Creator = {
  id: string
  slug: string
  name: string
  bio: string | null
  avatar_url: string | null
  twitter_handle: string
  twitter_verified: boolean
  wallet_address: string | null
  evm_wallet_address: string | null
  supported_chains: string[]
}

type Stats = {
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

export default function CreatorProfilePage() {
  const params = useParams()
  const slug = params.slug as string

  const [creator, setCreator] = useState<Creator | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentTips, setRecentTips] = useState<Tip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch creator
        const creatorResponse = await fetch(`/api/creators?slug=${slug}`)
        const creatorData = await creatorResponse.json()

        if (!creatorResponse.ok || !creatorData.creator) {
          throw new Error('Creator not found')
        }

        setCreator(creatorData.creator)

        // Fetch stats
        const statsResponse = await fetch(`/api/creators/${slug}/stats`)
        const statsData = await statsResponse.json()

        if (statsResponse.ok && statsData.stats) {
          setStats(statsData.stats)
        }

        // Fetch recent tips
        const tipsResponse = await fetch(`/api/creators/${slug}/tips?limit=5&sort=created_at&order=desc`)
        const tipsData = await tipsResponse.json()

        if (tipsResponse.ok && tipsData.tips) {
          setRecentTips(tipsData.tips)
        }
      } catch (err) {
        console.error('Error fetching creator data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load creator profile')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchData()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">👤</div>
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (error || !creator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-5xl mb-4">😕</div>
          <div className="text-red-600 dark:text-red-400 text-xl font-bold mb-2">Creator Not Found</div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'This creator profile does not exist'}</p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const tipLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/tip/${creator.slug}`

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 dark:from-zinc-900 dark:via-black dark:to-zinc-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors mb-4"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Profile Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 dark:border-zinc-800">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {creator.avatar_url && (
              <img
                src={creator.avatar_url}
                alt={creator.name}
                className="w-24 h-24 rounded-full border-4 border-purple-200 dark:border-purple-800"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">{creator.name}</h1>
                {creator.twitter_verified && (
                  <span className="text-blue-500" title="Verified Twitter account">✓</span>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">{creator.bio || 'No bio available'}</p>
              <div className="flex items-center gap-4 text-sm mb-4">
                <a
                  href={`https://twitter.com/${creator.twitter_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  @{creator.twitter_handle}
                </a>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <span className="text-gray-500 dark:text-gray-400">/{creator.slug}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {creator.supported_chains?.map((chain) => (
                  <ChainBadge key={chain} chain={chain as 'solana' | 'base' | 'celo'} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-100 dark:border-zinc-800">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Tips</div>
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">{stats.totalTips}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {stats.humanTips} human • {stats.agentTips} agent
              </div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-100 dark:border-zinc-800">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Earnings</div>
              <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">
                ${stats.totalEarnings.toFixed(2)}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">USDC</div>
            </div>
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-gray-100 dark:border-zinc-800">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Last Tip</div>
              <div className="text-lg font-bold text-gray-800 dark:text-gray-200">
                {stats.lastTipAt
                  ? new Date(stats.lastTipAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Never'}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {stats.lastTipAt
                  ? new Date(stats.lastTipAt).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })
                  : 'No tips yet'}
              </div>
            </div>
          </div>
        )}

        {/* Tip Link Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 mb-6 border border-gray-100 dark:border-zinc-800">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Send a Tip</h2>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-1">
              <div className="mb-2">
                <label className="text-sm text-gray-500 dark:text-gray-400 block mb-1">Tip Link</label>
                <div className="flex items-center gap-2">
                  <code className="px-4 py-2 bg-gray-100 dark:bg-zinc-800 rounded-lg text-sm font-mono flex-1">
                    {tipLink}
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(tipLink)
                      alert('Tip link copied!')
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
                  >
                    Copy
                  </button>
                </div>
              </div>
              <Link
                href={`/tip/${creator.slug}`}
                className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold transition-colors mt-4"
              >
                Go to Tip Page →
              </Link>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Scan to Tip</div>
              <QRCode url={tipLink} size={150} />
            </div>
          </div>
        </div>

        {/* Recent Tips */}
        {recentTips.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-zinc-800">
            <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Recent Tips</h2>
            <div className="space-y-4">
              {recentTips.map((tip) => (
                <TipCard key={tip.id} tip={tip} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

