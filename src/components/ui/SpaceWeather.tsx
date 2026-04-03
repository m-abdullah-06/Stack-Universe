import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useIsAnyPanelOpen, useUniverseStore } from '@/store'
import type { UniverseData, ActionRun } from '@/types'

interface SpaceWeatherProps {
  data: UniverseData
}

export function SpaceWeather({ data }: { data: UniverseData }) {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const isAnyPanelOpen = useIsAnyPanelOpen()
  const viewMode = useUniverseStore(s => s.viewMode)

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
  const allPassed = actionsData.every((a: { repoName: string; latest: ActionRun }) => a.latest.conclusion === 'success' && a.latest.status === 'completed')

  return (
    <AnimatePresence>
    {(!isAnyPanelOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && 
     (viewMode !== 'langs' || typeof window !== 'undefined' && window.innerWidth >= 768) && (
    <motion.div 
      className={`fixed z-[105] pointer-events-auto w-[min(280px,85vw)] md:w-[320px]
                  bottom-[80px] right-4
                  md:bottom-8 md:right-auto md:left-8`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ delay: 0.1, duration: 0.4 }}
    >
      <div 
        className="luxe-glass border border-white/10 rounded-xl p-3 md:p-4 shadow-[0_0_40px_rgba(0,0,0,0.6)] cursor-pointer group hud-corner"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center justify-between mb-0 md:mb-3">
          <h3 className="font-orbitron text-[8px] md:text-[9px] tracking-[0.3em] md:tracking-[0.4em] text-white/30 uppercase">
            Space Weather
          </h3>
          <div className="flex items-center gap-2">
            {!allPassed && isCollapsed && (
              <div className="w-1.5 h-1.5 rounded-full bg-[#ff2244] animate-ping shadow-[0_0_8px_#ff2244]" />
            )}
            <motion.div
              animate={{ rotate: isCollapsed ? 0 : 180 }}
              className="text-white/20 group-hover:text-white/50 transition-colors md:hidden"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </div>
        </div>

        <AnimatePresence>
          {(!isCollapsed || typeof window !== 'undefined' && window.innerWidth >= 768) && (
            <motion.div
              initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { height: 0, opacity: 0, marginTop: 0 } : false}
              animate={{ height: "auto", opacity: 1, marginTop: 12 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              className="overflow-hidden"
            >
              {allPassed ? (
                <div className="flex items-center justify-center gap-3 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#00ff66] animate-pulse shadow-[0_0_10px_#00ff66]" />
                  <span className="font-orbitron text-[10px] text-[#00ff66] font-bold tracking-[0.1em]">
                    ALL SYSTEMS NOMINAL
                  </span>
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  {actionsData.map(({ repoName, latest }: { repoName: string; latest: ActionRun }) => {
                    const isRunning = latest.status === 'in_progress' || latest.status === 'queued'
                    const isSuccess = latest.conclusion === 'success'
                    
                    const statusColor = isRunning ? '#ffd700' : (isSuccess ? '#00ff66' : '#ff2244')
                    const statusText = isRunning ? 'RUNNING' : (isSuccess ? 'PASSED' : 'FAILED')
                    
                    return (
                      <div key={repoName} className="flex items-center gap-4 text-[9px] font-mono whitespace-nowrap">
                        <div 
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isRunning ? 'animate-bounce' : isSuccess ? 'animate-pulse' : 'animate-ping'}`}
                          style={{ backgroundColor: statusColor, boxShadow: `0 0-8px ${statusColor}` }}
                        />
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="text-white/90 font-bold truncate max-w-[80px] md:max-w-[100px]">{repoName}</span>
                            <span className="text-white/40 truncate text-[8px] flex-1 text-right md:text-left">{latest.name}</span>
                            <span 
                              className="font-bold w-12 md:w-14 text-right tabular-nums"
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
    )}
    </AnimatePresence>
  )
}
