'use client'

import { useMemo, useState } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Sector,
} from 'recharts'
import type { UniverseData } from '@/types'

// Cast Pie to any to work around activeIndex/activeShape type definition gaps
const ActivePie = Pie as any

interface LanguagesTabProps {
  data: UniverseData
}

const renderActiveShape = (props: any) => {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill,
    payload, percent, value,
  } = props

  return (
    <g>
      <Sector
        cx={cx} cy={cy}
        innerRadius={innerRadius - 4}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.9}
      />
      <Sector
        cx={cx} cy={cy}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        opacity={0.4}
      />
      <text x={cx} y={cy - 14} textAnchor="middle" fill="#fff" fontFamily="Orbitron" fontWeight="bold" fontSize={16}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 8} textAnchor="middle" fill={fill} fontFamily="JetBrains Mono" fontSize={12}>
        {(percent * 100).toFixed(1)}%
      </text>
      <text x={cx} y={cy + 26} textAnchor="middle" fill="#4a4e69" fontFamily="JetBrains Mono" fontSize={10}>
        {payload.repoCount} {payload.repoCount === 1 ? 'repo' : 'repos'}
      </text>
    </g>
  )
}

export function LanguagesTab({ data }: LanguagesTabProps) {
  const [activeIndex, setActiveIndex] = useState(0)

  const pieData = useMemo(() => {
    return data.languages.map(lang => ({
      name: lang.name,
      value: lang.percentage,
      color: lang.color,
      repoCount: lang.repos.length,
      daysSince: lang.daysSinceActivity,
    }))
  }, [data.languages])

  // Trend estimation: languages with recently pushed repos are "growing", others are "stable/shrinking"
  const trends = useMemo(() => {
    return data.languages.map(lang => {
      if (lang.daysSinceActivity < 30) return 'growing'
      if (lang.daysSinceActivity < 180) return 'stable'
      return 'shrinking'
    })
  }, [data.languages])

  return (
    <div className="space-y-6 pb-8">
      {/* Donut Chart */}
      <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 md:p-6">
        <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mb-4 text-center">Language Distribution</p>
        <div className="h-72 md:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ActivePie
                activeIndex={activeIndex}
                activeShape={renderActiveShape}
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                dataKey="value"
                onMouseEnter={(_: any, i: number) => setActiveIndex(i)}
                paddingAngle={2}
                strokeWidth={0}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </ActivePie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Language List */}
      <div className="space-y-2">
        <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest px-1">Languages by Usage</p>
        {data.languages.map((lang, i) => (
          <div
            key={lang.name}
            className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/5 rounded-xl hover:bg-white/[0.05] transition-colors"
            onMouseEnter={() => setActiveIndex(i)}
          >
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{
                backgroundColor: lang.color,
                boxShadow: `0 0 8px ${lang.color}60`,
              }}
            />
            <span className="flex-1 text-[11px] font-mono text-white font-bold">
              {lang.name}
            </span>
            
            {/* Progress bar */}
            <div className="w-32 md:w-48 h-2 rounded-full overflow-hidden bg-white/[0.05]">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${lang.percentage}%`,
                  backgroundColor: lang.color,
                  boxShadow: `0 0 6px ${lang.color}40`,
                }}
              />
            </div>
            
            <span className="text-[10px] font-mono font-bold w-12 text-right" style={{ color: lang.color }}>
              {lang.percentage.toFixed(1)}%
            </span>
            
            <span className="text-[10px] font-mono text-gray-500 w-14 text-right">
              {lang.repos.length} {lang.repos.length === 1 ? 'repo' : 'repos'}
            </span>

            {/* Trend arrow */}
            <div className="flex-shrink-0 w-4 text-center">
              {trends[i] === 'growing' && (
                <span className="text-green-400 text-xs" title="Growing">↑</span>
              )}
              {trends[i] === 'shrinking' && (
                <span className="text-red-400 text-xs" title="Declining">↓</span>
              )}
              {trends[i] === 'stable' && (
                <span className="text-gray-500 text-xs" title="Stable">—</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
