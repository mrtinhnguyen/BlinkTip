'use client'

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

export default function StatsCards({ stats }: { stats: StatsData }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Earnings */}
      <div className="bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl p-6 text-white shadow-lg">
        <div className="text-sm opacity-90 mb-1">Total Earnings</div>
        <div className="text-3xl font-bold">{formatCurrency(stats.totalEarnings)}</div>
        <div className="text-sm opacity-75 mt-2">{stats.totalTips} total tips</div>
      </div>

      {/* Human Earnings */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl p-6 text-white shadow-lg">
        <div className="text-sm opacity-90 mb-1">From Humans</div>
        <div className="text-3xl font-bold">{formatCurrency(stats.humanEarnings)}</div>
        <div className="text-sm opacity-75 mt-2">{stats.humanTips} tips</div>
      </div>

      {/* Agent Earnings */}
      <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-white shadow-lg">
        <div className="text-sm opacity-90 mb-1">From AI Agent</div>
        <div className="text-3xl font-bold">{formatCurrency(stats.agentEarnings)}</div>
        <div className="text-sm opacity-75 mt-2">{stats.agentTips} tips</div>
      </div>

      {/* Last Tip */}
      <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl p-6 text-white shadow-lg">
        <div className="text-sm opacity-90 mb-1">Last Tip</div>
        <div className="text-lg font-bold">
          {stats.lastTipAt
            ? new Date(stats.lastTipAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : 'Never'}
        </div>
        <div className="text-sm opacity-75 mt-2">
          {stats.lastTipAt
            ? new Date(stats.lastTipAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })
            : 'No tips yet'}
        </div>
      </div>
    </div>
  )
}

