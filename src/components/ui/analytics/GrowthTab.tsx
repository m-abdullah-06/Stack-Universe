'use client'

import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, Cell, ZAxis, ReferenceLine,
} from 'recharts'
import type { UniverseData } from '@/types'
import { getLanguageColor } from '@/lib/language-colors'

interface GrowthTabProps {
  data: UniverseData
}

export function GrowthTab({ data }: GrowthTabProps) {
  // Approximate cumulative star growth from repo creation dates
  const { growthData, spikes, fastest, mostStarred, mostConsistent } = useMemo(() => {
    const ownRepos = data.repos.filter(r => !r.fork && r.stargazers_count > 0)

    if (ownRepos.length === 0) {
      return { growthData: [], spikes: [], fastest: null, mostStarred: null, mostConsistent: null }
    }

    // Build timeline: sort repos by creation date, accumulate stars
    const timeline = ownRepos
      .map(r => ({
        name: r.name,
        stars: r.stargazers_count,
        created: new Date(r.updated_at).getTime(), // Use updated_at as proxy for "active growth period"
        createdDate: r.pushed_at,
      }))
      .sort((a, b) => a.created - b.created)

    // Create growth points using repo creation dates as milestones
    let cumulative = 0
    const points: { date: string; stars: number; label?: string }[] = []
    const spikes: { name: string; jump: number }[] = []

    // Add initial point
    const firstDate = new Date(ownRepos.sort((a, b) =>
      new Date(a.pushed_at).getTime() - new Date(b.pushed_at).getTime()
    )[0].pushed_at)
    points.push({ date: firstDate.toISOString().slice(0, 7), stars: 0 })

    // Sort by star count to simulate growth over time
    const byStars = [...ownRepos].sort((a, b) =>
      new Date(a.pushed_at).getTime() - new Date(b.pushed_at).getTime()
    )

    byStars.forEach(repo => {
      const prevCumulative = cumulative
      cumulative += repo.stargazers_count
      const dateStr = new Date(repo.pushed_at).toISOString().slice(0, 7) // YYYY-MM

      const jump = repo.stargazers_count
      if (jump >= cumulative * 0.3 && jump > 5) {
        spikes.push({ name: repo.name, jump })
        points.push({ date: dateStr, stars: cumulative, label: `${repo.name} — spike detected` })
      } else {
        points.push({ date: dateStr, stars: cumulative })
      }
    })

    // Stats
    const mostStarred = [...ownRepos].sort((a, b) => b.stargazers_count - a.stargazers_count)[0]

    // Fastest growing: highest stars relative to recency
    const now = Date.now()
    const fastest = [...ownRepos]
      .filter(r => r.stargazers_count > 0)
      .map(r => {
        const age = Math.max(1, (now - new Date(r.pushed_at).getTime()) / 86400000)
        return { ...r, velocity: r.stargazers_count / age }
      })
      .sort((a, b) => b.velocity - a.velocity)[0] || null

    // Most consistent: repos updated recently with moderate stars
    const mostConsistent = [...ownRepos]
      .filter(r => {
        const daysSinceUpdate = (now - new Date(r.pushed_at).getTime()) / 86400000
        return daysSinceUpdate < 90 && r.stargazers_count > 0
      })
      .sort((a, b) => b.stargazers_count - a.stargazers_count)[0] || null

    return { growthData: points, spikes, fastest, mostStarred, mostConsistent }
  }, [data.repos])

  // Scatter plot: repo age vs star count
  const scatterData = useMemo(() => {
    const now = Date.now()
    return data.repos
      .filter(r => !r.fork)
      .map(r => ({
        name: r.name,
        age: Math.round((now - new Date(r.pushed_at).getTime()) / 86400000),
        stars: r.stargazers_count,
        language: r.language || 'Unknown',
        color: r.language ? getLanguageColor(r.language) : '#4a4e69',
      }))
  }, [data.repos])

  if (growthData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <span className="text-4xl">✨</span>
        <p className="text-sm font-mono text-gray-500 text-center max-w-md">
          No starred repositories yet. The first star is always the hardest — ship something and watch the universe respond.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Cumulative Stars Line Chart */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-6">
        <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-4">Cumulative Star Growth</p>
        <div className="h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growthData} margin={{ left: 10, right: 20, top: 20, bottom: 10 }}>
              <defs>
                <linearGradient id="starGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffd700" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ffd700" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                tick={{ fill: '#4a4e69', fontSize: 9, fontFamily: 'JetBrains Mono' }}
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
                  border: '1px solid rgba(255,215,0,0.2)',
                  borderRadius: '12px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '11px',
                  color: '#e0f4ff',
                }}
                formatter={(value: any) => [`★ ${Number(value).toLocaleString()}`, 'Total Stars']}
                labelFormatter={(label: any) => String(label)}
              />
              <Line
                type="monotone"
                dataKey="stars"
                stroke="#ffd700"
                strokeWidth={2.5}
                dot={(props: any) => {
                  const { cx, cy, payload } = props
                  if (payload.label) {
                    return (
                      <g key={`dot-${cx}-${cy}`}>
                        <circle cx={cx} cy={cy} r={5} fill="#ffd700" stroke="#000" strokeWidth={2} />
                        <text x={cx} y={cy - 14} textAnchor="middle" fill="#ffd700" fontSize={8} fontFamily="JetBrains Mono">
                          {payload.label}
                        </text>
                      </g>
                    )
                  }
                  return <circle key={`dot-${cx}-${cy}`} cx={cx} cy={cy} r={2} fill="#ffd700" opacity={0.5} />
                }}
                activeDot={{ r: 5, fill: '#ffd700', stroke: '#000', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Growth Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {fastest && (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-2">🚀 Fastest Growing</p>
            <p className="font-orbitron font-bold text-sm text-space-cyan truncate">{fastest.name}</p>
            <p className="text-[10px] font-mono text-gray-500 mt-1">
              ★ {fastest.stargazers_count.toLocaleString()} stars
            </p>
          </div>
        )}
        {mostStarred && (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-2">👑 Most Starred</p>
            <p className="font-orbitron font-bold text-sm text-space-gold truncate">{mostStarred.name}</p>
            <p className="text-[10px] font-mono text-gray-500 mt-1">
              ★ {mostStarred.stargazers_count.toLocaleString()} all-time
            </p>
          </div>
        )}
        {mostConsistent && (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5">
            <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest mb-2">📈 Most Consistent</p>
            <p className="font-orbitron font-bold text-sm text-green-400 truncate">{mostConsistent.name}</p>
            <p className="text-[10px] font-mono text-gray-500 mt-1">
              ★ {mostConsistent.stargazers_count.toLocaleString()} • active
            </p>
          </div>
        )}
      </div>

      {/* Scatter Plot: Age vs Stars */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-6">
        <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-4">Repo Age vs Star Count</p>
        <p className="text-[9px] font-mono text-gray-600 mb-4">
          Each dot is a repo. Color = primary language. X = days since last push. Y = stars.
        </p>
        <div className="h-64 md:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ left: 10, right: 20, top: 10, bottom: 10 }}>
              <XAxis
                dataKey="age"
                name="Days Since Push"
                tick={{ fill: '#4a4e69', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                tickLine={false}
                label={{ value: 'Days Since Push', position: 'insideBottom', offset: -5, fill: '#4a4e69', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              />
              <YAxis
                dataKey="stars"
                name="Stars"
                tick={{ fill: '#4a4e69', fontSize: 9, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Stars', angle: -90, position: 'insideLeft', fill: '#4a4e69', fontSize: 9, fontFamily: 'JetBrains Mono' }}
              />
              <ZAxis range={[30, 200]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(0,0,15,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontFamily: 'JetBrains Mono',
                  fontSize: '10px',
                  color: '#e0f4ff',
                }}
                formatter={(value: any, name: any) => [value, name]}
                labelFormatter={(label: any) => {
                  const item = scatterData.find(d => d.age === label)
                  return item ? item.name : ''
                }}
              />
              <Scatter data={scatterData} shape="circle">
                {scatterData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={0.8} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        
        {/* Scatter legend */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/5">
          {Array.from(new Set(scatterData.map(d => d.language))).slice(0, 8).map(lang => (
            <div key={lang} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getLanguageColor(lang) }}
              />
              <span className="text-[9px] font-mono text-gray-500">{lang}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
