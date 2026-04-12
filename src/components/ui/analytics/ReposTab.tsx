'use client'

import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import type { UniverseData } from '@/types'
import { calcRepoHealth } from '@/lib/repo-health'
import { getLanguageColor } from '@/lib/language-colors'
import { useUniverseStore } from '@/store'

interface ReposTabProps {
  data: UniverseData
}

type SortMode = 'health' | 'stars' | 'pushDate'

function getHealthBarColor(score: number) {
  if (score >= 70) return '#00f5d4'
  if (score >= 50) return '#ffd700'
  if (score >= 30) return '#ff9900'
  return '#ff4d4d'
}

export function ReposTab({ data }: ReposTabProps) {
  const [sortMode, setSortMode] = useState<SortMode>('health')
  const setSelectedPlanetIndex = useUniverseStore(s => s.setSelectedPlanetIndex)

  const repoHealthData = useMemo(() => {
    const ownRepos = data.repos.filter(r => !r.fork)
    return ownRepos.map((repo, idx) => {
      const health = calcRepoHealth(repo)
      return {
        name: repo.name,
        health: health.score,
        stars: repo.stargazers_count,
        language: repo.language,
        pushed_at: repo.pushed_at,
        idx,
      }
    })
  }, [data.repos])

  const sorted = useMemo(() => {
    const arr = [...repoHealthData]
    switch (sortMode) {
      case 'health': return arr.sort((a, b) => b.health - a.health)
      case 'stars': return arr.sort((a, b) => b.stars - a.stars)
      case 'pushDate': return arr.sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
    }
  }, [repoHealthData, sortMode])

  const handleRepoClick = (repoIdx: number) => {
    setSelectedPlanetIndex(repoIdx)
    // Reset after 3 seconds
    setTimeout(() => setSelectedPlanetIndex(null), 3000)
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const days = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (days === 0) return 'today'
    if (days === 1) return '1d ago'
    if (days < 30) return `${days}d ago`
    if (days < 365) return `${Math.floor(days / 30)}mo ago`
    return `${(days / 365).toFixed(1)}y ago`
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Sort Controls */}
      <div className="flex items-center gap-2">
        <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Sort by:</span>
        {([
          { key: 'health' as SortMode, label: 'Health Score' },
          { key: 'stars' as SortMode, label: 'Star Count' },
          { key: 'pushDate' as SortMode, label: 'Last Push' },
        ]).map(opt => (
          <button
            key={opt.key}
            onClick={() => setSortMode(opt.key)}
            className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase tracking-wider transition-all ${
              sortMode === opt.key
                ? 'bg-space-cyan/10 text-space-cyan border border-space-cyan/30'
                : 'bg-white/[0.03] text-gray-500 border border-white/5 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-6">
        <div style={{ height: Math.max(400, sorted.length * 36) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} layout="vertical" margin={{ left: 100, right: 40, top: 10, bottom: 10 }}>
              <XAxis type="number" domain={[0, 100]} tick={{ fill: '#4a4e69', fontSize: 10, fontFamily: 'JetBrains Mono' }} axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fill: '#e0f4ff', fontSize: 10, fontFamily: 'JetBrains Mono' }}
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
                formatter={(value: any) => [`${value}/100`, 'Health Score']}
              />
              <Bar dataKey="health" radius={[0, 6, 6, 0]} barSize={20} onClick={(_: any, idx: number) => handleRepoClick(sorted[idx].idx)}>
                {sorted.map((entry, i) => (
                  <Cell key={i} fill={getHealthBarColor(entry.health)} cursor="pointer" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed List */}
      <div className="space-y-1">
        {sorted.map((repo, i) => (
          <button
            key={repo.name}
            onClick={() => handleRepoClick(repo.idx)}
            className="w-full flex items-center gap-3 px-4 py-2.5 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-white/10 rounded-xl transition-all group text-left"
          >
            <span className="text-[10px] font-mono text-gray-600 w-5">{i + 1}</span>
            {/* Language dot */}
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{
                backgroundColor: repo.language ? getLanguageColor(repo.language) : '#4a4e69',
                boxShadow: repo.language ? `0 0 6px ${getLanguageColor(repo.language)}` : 'none',
              }}
            />
            <span className="flex-1 text-[11px] font-mono text-white truncate group-hover:text-space-cyan transition-colors">
              {repo.name}
            </span>
            <span className="text-[10px] font-mono text-gray-500 flex-shrink-0">
              {repo.language || '—'}
            </span>
            <span className="text-[10px] font-mono text-space-gold flex-shrink-0">
              ★ {repo.stars.toLocaleString()}
            </span>
            <span className="text-[10px] font-mono text-gray-600 flex-shrink-0 hidden md:block">
              {formatDate(repo.pushed_at)}
            </span>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <div
                className="w-12 h-1.5 rounded-full overflow-hidden bg-white/[0.05]"
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${repo.health}%`,
                    backgroundColor: getHealthBarColor(repo.health),
                  }}
                />
              </div>
              <span className="text-[10px] font-mono font-bold w-7 text-right" style={{ color: getHealthBarColor(repo.health) }}>
                {repo.health}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
