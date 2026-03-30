'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { UniverseData } from '@/types'

interface SpaceWeatherProps {
  data: UniverseData
}

export function SpaceWeather({ data }: { data: UniverseData }) {
  // Identify Tier 1 repos (top 5 by stars)
  const tier1Repos = useMemo(() => {
    return [...data.repos]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5)
  }, [data.repos])

  // Get most recent run per repo
  const actionsData = useMemo(() => {
    const results = []
    for (const repo of tier1Repos) {
      const runs = data.repoActions?.[repo.name]
      if (runs && runs.length > 0) {
        results.push({
          repoName: repo.name,
          latest: runs[0]
        })
      }
    }
    return results
  }, [tier1Repos, data.repoActions])

  // Hide if no actions configured at all for tier 1
  if (actionsData.length === 0) return null

  // Check if everything is successful
  const allPassed = actionsData.every(a => a.latest.conclusion === 'success' && a.latest.status === 'completed')

  return (
    <motion.div 
      className="fixed bottom-[88px] md:bottom-24 right-4 z-[105] pointer-events-none w-[280px] md:w-[320px]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.8 }}
    >
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl p-3 md:p-4 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        <h3 className="font-orbitron text-[9px] tracking-[0.4em] text-white/30 mb-3 text-center uppercase">
          Space Weather
        </h3>

        {allPassed ? (
          <div className="flex items-center justify-center gap-3 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse shadow-[0_0_10px_#00ff66]" />
            <span className="font-orbitron text-[10px] text-[#00ff66] font-bold tracking-[0.1em]">
              ALL SYSTEMS NOMINAL
            </span>
          </div>
        ) : (
          <div className="space-y-2.5">
            {actionsData.map(({ repoName, latest }) => {
              const isRunning = latest.status === 'in_progress' || latest.status === 'queued'
              const isSuccess = latest.conclusion === 'success'
              const isFailure = latest.conclusion === 'failure'

              // Colors based on requirement
              const statusColor = isRunning ? '#ffd700' : (isSuccess ? '#00ff66' : '#ff2244')
              const statusText = isRunning ? 'RUNNING' : (isSuccess ? 'PASSED' : 'FAILED')
              
              return (
                <div key={repoName} className="flex items-center gap-4 text-[9px] font-mono whitespace-nowrap">
                  <div 
                    className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isRunning ? 'animate-bounce' : isSuccess ? 'animate-pulse' : 'animate-ping'}`}
                    style={{ backgroundColor: statusColor, boxShadow: `0 0 8px ${statusColor}` }}
                  />
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-white/90 font-bold truncate max-w-[100px]">{repoName}</span>
                      <span className="text-white/40 truncate text-[8px]">{latest.name}</span>
                      <span 
                        className="font-bold w-14 text-right tabular-nums"
                        style={{ color: statusColor }}
                      >
                        {statusText}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </motion.div>
  )
}
