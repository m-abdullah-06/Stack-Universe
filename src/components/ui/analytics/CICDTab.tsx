'use client'

import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'
import type { UniverseData } from '@/types'

interface CICDTabProps {
  data: UniverseData
}

export function CICDTab({ data }: CICDTabProps) {
  // Filter repos that have actual GitHub Actions runs
  const reposWithActions = useMemo(() => {
    return Object.entries(data.repoActions)
      .filter(([_, runs]) => runs.length > 0)
      .map(([name, runs]) => {
        const last10 = runs.slice(0, 10)
        const passed = last10.filter(r => r.conclusion === 'success').length
        const failed = last10.filter(r => r.conclusion === 'failure').length
        const other = last10.length - passed - failed
        const passRate = last10.length > 0 ? (passed / last10.length) * 100 : 0

        // Current deploy streak
        let deployStreak = 0
        for (const run of last10) {
          if (run.conclusion === 'success') deployStreak++
          else break
        }

        const lastRun = last10[0] || null

        return {
          name,
          runs: last10,
          passed,
          failed,
          other,
          passRate,
          deployStreak,
          lastRun,
          chartData: last10.map((r, i) => ({
            idx: i + 1,
            status: r.conclusion === 'success' ? 1 : r.conclusion === 'failure' ? -1 : 0,
            conclusion: r.conclusion || 'in_progress',
            name: r.name,
            date: new Date(r.created_at).toLocaleDateString(),
          })).reverse(),
        }
      })
      .sort((a, b) => b.runs.length - a.runs.length)
  }, [data.repoActions])

  // Empty state
  if (reposWithActions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="relative">
          <span className="text-5xl">🛰️</span>
          <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-gray-600 animate-pulse" />
        </div>
        <div className="text-center max-w-md">
          <p className="text-sm font-mono text-gray-400 mb-2">
            No GitHub Actions detected
          </p>
          <p className="text-[11px] font-mono text-gray-600 leading-relaxed">
            Add a workflow to see your space weather history here. CI/CD data powers the build frequency and reliability metrics for your universe.
          </p>
        </div>
      </div>
    )
  }

  const formatDate = (d: string) => {
    const date = new Date(d)
    const now = new Date()
    const hours = Math.floor((now.getTime() - date.getTime()) / 3600000)
    if (hours < 1) return 'just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 30) return `${days}d ago`
    return `${Math.floor(days / 30)}mo ago`
  }

  return (
    <div className="space-y-6 pb-8">
      {reposWithActions.map(repo => (
        <div key={repo.name} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-orbitron font-bold text-sm text-white">{repo.name}</h3>
            <div className="flex items-center gap-2">
              {repo.lastRun && (
                <span className={`text-[9px] font-mono px-2 py-1 rounded-full border ${
                  repo.lastRun.conclusion === 'success'
                    ? 'text-green-400 border-green-400/20 bg-green-400/5'
                    : repo.lastRun.conclusion === 'failure'
                    ? 'text-red-400 border-red-400/20 bg-red-400/5'
                    : 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5'
                }`}>
                  {repo.lastRun.conclusion === 'success' ? '✓ PASSED' : repo.lastRun.conclusion === 'failure' ? '✗ FAILED' : '⟳ RUNNING'}
                </span>
              )}
            </div>
          </div>

          {/* Build History Bar Chart */}
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repo.chartData} margin={{ left: 10, right: 10 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: '#4a4e69', fontSize: 8, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(0,0,15,0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '10px',
                    color: '#e0f4ff',
                  }}
                  formatter={(value: any, name: any, props: any) => {
                    const conclusion = props.payload.conclusion
                    return [conclusion === 'success' ? 'Passed' : conclusion === 'failure' ? 'Failed' : 'Other', props.payload.name]
                  }}
                />
                <Bar dataKey="status" barSize={20} radius={[4, 4, 0, 0]}>
                  {repo.chartData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={
                        entry.conclusion === 'success' ? '#00f5d4'
                        : entry.conclusion === 'failure' ? '#ff4d4d'
                        : '#ffd700'
                      }
                      opacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Pass Rate */}
            <div className="space-y-2">
              <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Pass Rate</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden bg-white/[0.05]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${repo.passRate}%`,
                      backgroundColor: repo.passRate >= 80 ? '#00f5d4' : repo.passRate >= 50 ? '#ffd700' : '#ff4d4d',
                    }}
                  />
                </div>
                <span className="text-[11px] font-mono font-bold text-white">{repo.passRate.toFixed(0)}%</span>
              </div>
            </div>
            {/* Deploy Streak */}
            <div>
              <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Deploy Streak</p>
              <p className={`font-orbitron font-bold text-lg ${repo.deployStreak >= 5 ? 'text-green-400' : 'text-white'}`}>
                {repo.deployStreak} <span className="text-[10px] text-gray-500">in a row</span>
              </p>
            </div>
            {/* Last Build */}
            <div>
              <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Last Build</p>
              <p className="text-[11px] font-mono text-gray-400">
                {repo.lastRun ? formatDate(repo.lastRun.created_at) : '—'}
              </p>
            </div>
            {/* Builds */}
            <div>
              <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Total (last 10)</p>
              <p className="text-[11px] font-mono text-gray-400">
                <span className="text-green-400">{repo.passed}✓</span>
                {' / '}
                <span className="text-red-400">{repo.failed}✗</span>
                {repo.other > 0 && <span className="text-yellow-400"> / {repo.other}⟳</span>}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
