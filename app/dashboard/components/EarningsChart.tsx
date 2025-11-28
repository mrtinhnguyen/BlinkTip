'use client'

import { useEffect, useState } from 'react'

interface EarningsChartProps {
  creatorSlug: string
}

type TipData = {
  created_at: string
  amount: number
  chain: string
}

export default function EarningsChart({ creatorSlug }: EarningsChartProps) {
  const [tips, setTips] = useState<TipData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTips() {
      try {
        const response = await fetch(`/api/creators/${creatorSlug}/tips?limit=100&sort=created_at&order=asc`)
        const data = await response.json()

        if (response.ok && data.tips) {
          setTips(data.tips.filter((tip: any) => tip.status === 'confirmed'))
        }
      } catch (err) {
        console.error('Error fetching tips for chart:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchTips()
  }, [creatorSlug])

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading chart data...</div>
      </div>
    )
  }

  if (tips.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">No data to display</div>
      </div>
    )
  }

  // Group tips by date and calculate cumulative earnings
  const dailyEarnings = new Map<string, number>()
  let cumulative = 0

  tips.forEach((tip) => {
    const date = new Date(tip.created_at).toISOString().split('T')[0]
    cumulative += tip.amount
    dailyEarnings.set(date, cumulative)
  })

  const dates = Array.from(dailyEarnings.keys()).sort()
  const values = dates.map((date) => dailyEarnings.get(date) || 0)

  const maxValue = Math.max(...values, 1)
  const minValue = Math.min(...values, 0)
  const range = maxValue - minValue || 1

  const width = 800
  const height = 300
  const padding = 40

  const points = dates.map((date, index) => {
    const x = padding + (index / (dates.length - 1 || 1)) * (width - 2 * padding)
    const y = height - padding - ((values[index] - minValue) / range) * (height - 2 * padding)
    return { x, y, date, value: values[index] }
  })

  // Create path for line
  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ')

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="w-full h-auto">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + ratio * (height - 2 * padding)
          const value = maxValue - ratio * range
          return (
            <g key={ratio}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-200 dark:text-gray-700"
                strokeDasharray="4 4"
              />
              <text
                x={padding - 10}
                y={y + 4}
                textAnchor="end"
                className="text-xs fill-gray-500 dark:fill-gray-400"
              >
                ${value.toFixed(2)}
              </text>
            </g>
          )
        })}

        {/* Line chart */}
        <path
          d={pathData}
          fill="none"
          stroke="url(#gradient)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9333ea" stopOpacity="1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Area under curve */}
        <path
          d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
          fill="url(#gradient)"
          fillOpacity="0.1"
        />

        {/* Data points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill="url(#gradient)"
              className="cursor-pointer hover:r-6 transition-all"
            >
              <title>
                {point.date}: ${point.value.toFixed(2)}
              </title>
            </circle>
          </g>
        ))}

        {/* X-axis labels */}
        {dates
          .filter((_, index) => index % Math.ceil(dates.length / 6) === 0 || index === dates.length - 1)
          .map((date, index) => {
            const pointIndex = dates.indexOf(date)
            const x = padding + (pointIndex / (dates.length - 1 || 1)) * (width - 2 * padding)
            return (
              <text
                key={date}
                x={x}
                y={height - padding + 20}
                textAnchor="middle"
                className="text-xs fill-gray-600 dark:fill-gray-400"
              >
                {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </text>
            )
          })}
      </svg>
    </div>
  )
}

