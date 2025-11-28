'use client'

import ChainBadge from './ChainBadge'

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

interface TipCardProps {
  tip: Tip
}

const getExplorerUrl = (chain: string, signature: string) => {
  switch (chain) {
    case 'solana':
      return `https://explorer.solana.com/tx/${signature}?cluster=${
        process.env.NEXT_PUBLIC_NETWORK === 'solana-mainnet-beta' ? 'mainnet' : 'devnet'
      }`
    case 'base':
      return `https://basescan.org/tx/${signature}`
    case 'celo':
      // Celo mainnet: celoscan.io, Sepolia: sepolia.celoscan.io
      const isMainnet = process.env.NEXT_PUBLIC_CELO_CHAIN_ID === "42220" || !process.env.NEXT_PUBLIC_CELO_CHAIN_ID;
      return isMainnet
        ? `https://celoscan.io/tx/${signature}`
        : `https://sepolia.celoscan.io/tx/${signature}`
    default:
      return '#'
  }
}

export default function TipCard({ tip }: TipCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
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

  const explorerUrl = getExplorerUrl(tip.chain, tip.signature)

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">
            {tip.source === 'agent' ? '🤖' : '👤'}
          </div>
          <div>
            <div className="font-bold text-lg text-gray-800 dark:text-gray-200">
              {formatCurrency(tip.amount)} {tip.token}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formatDate(tip.created_at)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ChainBadge chain={tip.chain} />
          {tip.status === 'confirmed' && (
            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-semibold">
              ✓ Confirmed
            </span>
          )}
          {tip.status === 'pending' && (
            <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs font-semibold">
              ⏳ Pending
            </span>
          )}
          {tip.status === 'failed' && (
            <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-semibold">
              ✗ Failed
            </span>
          )}
        </div>
      </div>

      {tip.metadata?.agent_reasoning && (
        <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-1">
            AI Agent Reasoning:
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">
            {tip.metadata.agent_reasoning}
          </div>
        </div>
      )}

      <div className="mt-3 flex items-center gap-2">
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-mono"
        >
          View on {tip.chain === 'solana' ? 'Solana' : tip.chain === 'base' ? 'Base' : 'Celo'} Explorer →
        </a>
      </div>
    </div>
  )
}

