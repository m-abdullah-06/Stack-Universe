'use client'

import { useMemo } from 'react'
import {
  RadialBarChart, RadialBar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LabelList,
} from 'recharts'
import type { UniverseData } from '@/types'
import { calcRepoHealth } from '@/lib/repo-health'

interface OverviewTabProps {
  data: UniverseData
}

export function OverviewTab({ data }: OverviewTabProps) {
  // Score breakdown using the calculation formula weights
  const breakdown = useMemo(() => {
    const starsContrib = data.totalStars * 10
    const reposContrib = data.repos.length * 5
    const langsContrib = data.languages.length * 20
    const ageContrib = Math.floor(data.accountAgeYears) * 15
    const total = starsContrib + reposContrib + langsContrib + ageContrib

    return [
      { name: 'Stars', value: starsContrib, pct: total > 0 ? (starsContrib / total * 100) : 0, color: '#ffd700' },
      { name: 'Repos', value: reposContrib, pct: total > 0 ? (reposContrib / total * 100) : 0, color: '#00e5ff' },
      { name: 'Languages', value: langsContrib, pct: total > 0 ? (langsContrib / total * 100) : 0, color: '#7b2fff' },
      { name: 'Account Age', value: ageContrib, pct: total > 0 ? (ageContrib / total * 100) : 0, color: '#ff006e' },
    ]
  }, [data])

  // System health — average of all repo health scores
  const systemHealth = useMemo(() => {
    const ownRepos = data.repos.filter(r => !r.fork)
    if (ownRepos.length === 0) return 0
    const total = ownRepos.reduce((sum, r) => sum + calcRepoHealth(r).score, 0)
    return Math.round(total / ownRepos.length)
  }, [data.repos])

  const healthColor = systemHealth >= 70 ? '#00f5d4' : systemHealth >= 40 ? '#ffd700' : '#ff4d4d'

  // Current streak — consecutive days with commits
  const streak = useMemo(() => {
    if (data.recentCommits.length === 0) return 0
    const dates = Array.from(new Set(data.recentCommits.map(c => new Date(c.date).toDateString()))).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    )
    let count = 0
    const today = new Date()
    for (let i = 0; i < dates.length; i++) {
      const expected = new Date(today)
      expected.setDate(expected.getDate() - i)
      if (new Date(dates[i]).toDateString() === expected.toDateString()) {
        count++
      } else break
    }
    return count
  }, [data.recentCommits])

  // Score gauge data
  const scoreGaugeData = [
    { name: 'score', value: Math.min(data.universeScore, 10000), fill: '#ffd700' },
  ]
  const maxScore = Math.max(10000, data.universeScore * 1.2)

  const healthGaugeData = [
    { name: 'health', value: systemHealth, fill: healthColor },
  ]

  return (
    <div className="space-y-8 pb-8">
      {/* Key Stats Row */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {[
          { label: 'Total Stars', value: `★ ${data.totalStars.toLocaleString()}`, color: 'text-space-gold' },
          { label: 'Repositories', value: data.repos.length.toString(), color: 'text-white' },
          { label: 'Languages', value: data.languages.length.toString(), color: 'text-purple-400' },
          { label: 'Streak', value: `🔥 ${streak}d`, color: 'text-orange-400' },
          { label: 'Account Age', value: `${data.accountAgeYears.toFixed(1)}y`, color: 'text-space-magenta' },
          { label: 'Universe Score', value: data.universeScore.toLocaleString(), color: 'text-space-cyan' },
        ].map(stat => (
          <div key={stat.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-3 text-center hover:bg-white/[0.06] transition-colors">
            <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className={`font-orbitron font-bold text-sm ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Gauges Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Universe Score Arc Gauge */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-2 text-center">Universe Score</p>
          <div className="h-52 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%" cy="50%"
                innerRadius="70%" outerRadius="90%"
                barSize={14}
                data={scoreGaugeData}
                startAngle={210}
                endAngle={-30}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                  background={{ fill: 'rgba(255,255,255,0.04)' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-orbitron font-black text-3xl text-space-gold text-glow-gold">
                {data.universeScore.toLocaleString()}
              </span>
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-1">
                {data.distanceLabel}
              </span>
            </div>
          </div>
        </div>

        {/* System Health Gauge */}
        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
          <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-2 text-center">System Health</p>
          <div className="h-52 relative">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%" cy="50%"
                innerRadius="70%" outerRadius="90%"
                barSize={14}
                data={healthGaugeData}
                startAngle={210}
                endAngle={-30}
              >
                <RadialBar
                  dataKey="value"
                  cornerRadius={10}
                  background={{ fill: 'rgba(255,255,255,0.04)' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-orbitron font-black text-3xl" style={{ color: healthColor }}>
                {systemHealth}
              </span>
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-1">
                / 100
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown Stacked Bar */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6">
        <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-4">Score Breakdown</p>
        
        {/* Stacked horizontal bar */}
        <div className="h-8 rounded-full overflow-hidden flex bg-white/[0.03]">
          {breakdown.map(seg => (
            <div
              key={seg.name}
              className="h-full relative group transition-all duration-300 hover:brightness-125"
              style={{ width: `${Math.max(seg.pct, 2)}%`, backgroundColor: seg.color }}
            >
              {/* Tooltip on hover */}
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black/90 border border-white/10 rounded-lg px-2 py-1 whitespace-nowrap z-10">
                <span className="text-[9px] font-mono text-white">{seg.name}: {seg.pct.toFixed(1)}%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4">
          {breakdown.map(seg => (
            <div key={seg.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
              <span className="text-[10px] font-mono text-gray-400">
                {seg.name} — <span className="text-white font-bold">{seg.pct.toFixed(1)}%</span>
                <span className="text-gray-600 ml-1">({seg.value.toLocaleString()} pts)</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
