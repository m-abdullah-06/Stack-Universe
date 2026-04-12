'use client'

import { useMemo } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { UniverseData } from '@/types'

interface ActivityTabProps {
  data: UniverseData
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const AREA_COLORS = ['#00e5ff', '#ff006e', '#ffd700', '#7b2fff', '#00f5d4']

export function ActivityTab({ data }: ActivityTabProps) {
  // Build 12-month chart data from commitActivity
  const { chartData, topRepos, insights } = useMemo(() => {
    const entries = Object.entries(data.commitActivity)
    if (entries.length === 0) {
      return { chartData: [], topRepos: [], insights: null }
    }

    // Sort by total commits, take top 3
    const sorted = entries
      .map(([name, months]) => ({ name, months, total: months.reduce((s, n) => s + n, 0) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 3)

    const topRepoNames = sorted.map(r => r.name)

    // Build chart data — 12 months, oldest first
    const now = new Date()
    const data12: any[] = []
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
      const monthLabel = MONTH_LABELS[date.getMonth()]
      const row: any = { month: monthLabel }
      sorted.forEach(repo => {
        row[repo.name] = repo.months[i] || 0
      })
      data12.push(row)
    }

    // Insights
    let mostActiveMonth = ''
    let maxCommits = 0
    let totalCommits = 0
    let longestQuiet = 0
    let currentQuiet = 0

    data12.forEach(row => {
      const monthTotal = sorted.reduce((s, r) => s + (row[r.name] || 0), 0)
      totalCommits += monthTotal
      if (monthTotal > maxCommits) {
        maxCommits = monthTotal
        mostActiveMonth = row.month
      }
      if (monthTotal === 0) {
        currentQuiet++
        longestQuiet = Math.max(longestQuiet, currentQuiet)
      } else {
        currentQuiet = 0
      }
    })

    return {
      chartData: data12,
      topRepos: topRepoNames,
      insights: {
        mostActiveMonth,
        maxCommits,
        avgPerWeek: (totalCommits / 52).toFixed(1),
        longestQuiet: longestQuiet * 30, // approximate days
        totalCommits,
      },
    }
  }, [data.commitActivity])

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <span className="text-4xl">🌑</span>
        <p className="text-sm font-mono text-gray-500 text-center max-w-md">
          No commit activity data available. The universe is silent — perhaps a new explorer has yet to leave their mark.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Area Chart */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-6">
        <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-4">12-Month Commit Activity</p>
        <div className="h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                {topRepos.map((name, i) => (
                  <linearGradient key={name} id={`color-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={AREA_COLORS[i]} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={AREA_COLORS[i]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis
                dataKey="month"
                tick={{ fill: '#4a4e69', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#4a4e69', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,15,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '11px',
                  color: '#e0f4ff',
                }}
              />
              <Legend
                wrapperStyle={{ fontFamily: 'JetBrains Mono', fontSize: '10px' }}
              />
              {topRepos.map((name, i) => (
                <Area
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={AREA_COLORS[i]}
                  fill={`url(#color-${i})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: AREA_COLORS[i] }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights */}
      {insights && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center">
            <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-2">Most Active Month</p>
            <p className="font-orbitron font-bold text-xl text-space-cyan">{insights.mostActiveMonth}</p>
            <p className="text-[10px] font-mono text-gray-500 mt-1">{insights.maxCommits} commits</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center">
            <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-2">Avg Commits / Week</p>
            <p className="font-orbitron font-bold text-xl text-white">{insights.avgPerWeek}</p>
            <p className="text-[10px] font-mono text-gray-500 mt-1">{insights.totalCommits} total</p>
          </div>
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 text-center">
            <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-2">Longest Quiet Period</p>
            <p className={`font-orbitron font-bold text-xl ${insights.longestQuiet > 90 ? 'text-orange-400' : 'text-green-400'}`}>
              {insights.longestQuiet > 0 ? `${insights.longestQuiet}d` : '0d'}
            </p>
            <p className="text-[10px] font-mono text-gray-500 mt-1">
              {insights.longestQuiet > 180
                ? 'The universe is cooling'
                : insights.longestQuiet > 60
                ? 'Some dormant periods'
                : 'Consistently active'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
