'use client'

type Chain = 'solana' | 'base' | 'celo'

interface ChainBadgeProps {
  chain: Chain
  className?: string
}

const chainConfig: Record<Chain, { label: string; icon: string; color: string }> = {
  solana: {
    label: 'Solana',
    icon: '◎',
    color: 'from-purple-500 to-violet-500',
  },
  base: {
    label: 'Base',
    icon: '🔵',
    color: 'from-blue-500 to-cyan-500',
  },
  celo: {
    label: 'Celo',
    icon: '🌱',
    color: 'from-yellow-500 to-green-500',
  },
}

export default function ChainBadge({ chain, className = '' }: ChainBadgeProps) {
  const config = chainConfig[chain]

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-gradient-to-r ${config.color} text-white ${className}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  )
}

