'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUniverseStore } from '@/store'
import type { LeaderboardEntry } from '@/types'

const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32']
const RANK_LABELS = ['TITAN', 'GIANT', 'GIANT']

export function HallOfGiants() {
  const { showHallOfGiants, toggleHallOfGiants, leaderboard, setLeaderboard } =
    useUniverseStore()
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<'db' | 'github' | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Always re-fetch when opened — don't rely on stale store
    if (!showHallOfGiants) return
    setLoading(true)
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((d) => {
        setLeaderboard(d.leaderboard || [])
        setSource(d.source ?? null)
      })
      .catch(() => setLeaderboard([]))
      .finally(() => setLoading(false))
  }, [showHallOfGiants, setLeaderboard])

  return (
    <AnimatePresence>
      {showHallOfGiants && (
        <motion.div
          className="absolute top-4 right-52 w-80 hud-panel rounded overflow-hidden"
          style={{ zIndex: 50 }}
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 20 }}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-space-gold/20 flex items-center justify-between">
            <div>
              <p className="font-orbitron text-xs text-space-gold/60 tracking-widest">
                ◈ HALL OF GIANTS
              </p>
              <p className="font-orbitron font-bold text-space-gold text-sm"
                style={{ textShadow: '0 0 10px #ffd700, 0 0 20px #ffd70080' }}>
                TOP 10 UNIVERSES
              </p>
            </div>
            <button
              onClick={toggleHallOfGiants}
              className="text-gray-600 hover:text-white font-mono text-xs transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Source badge */}
          {source === 'github' && !loading && (
            <div className="px-4 pt-2">
              <p className="font-mono text-xs text-gray-700 italic">
                ↳ showing notable devs — search users to populate your DB
              </p>
            </div>
          )}

          {/* Column headers */}
          <div className="px-4 pt-2 pb-1 grid grid-cols-12 gap-1 text-gray-700 font-mono text-xs">
            <span className="col-span-1">#</span>
            <span className="col-span-5">USERNAME</span>
            <span className="col-span-3 text-right">SCORE</span>
            <span className="col-span-3 text-right">STARS</span>
          </div>

          {/* List */}
          <div className="px-4 pb-4 space-y-1 max-h-80 overflow-y-auto">
            {loading ? (
              <div className="py-8 text-center">
                <motion.div
                  className="font-mono text-xs text-space-gold"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                >
                  SCANNING UNIVERSE DATABASE...
                </motion.div>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-gray-700">
                No data available.
                <br />
                Check your GITHUB_TOKEN env var.
              </div>
            ) : (
              leaderboard.map((entry: LeaderboardEntry, i) => (
                <motion.a
                  key={entry.username}
                  href={`/universe/${entry.username}`}
                  className="w-full grid grid-cols-12 gap-1 items-center py-1.5 px-2 rounded hover:bg-space-gold/5 transition-colors group text-left"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => {
                    toggleHallOfGiants()
                    router.push(`/${entry.username}`)
                  }}
                >
                  <span
                    className="col-span-1 font-orbitron font-bold text-xs"
                    style={{ color: RANK_COLORS[i] ?? '#4a6a7a' }}
                  >
                    {i + 1}
                  </span>
                  <span className="col-span-5 font-mono text-xs text-white group-hover:text-space-gold transition-colors truncate">
                    @{entry.username}
                    {i < 3 && (
                      <span className="ml-1 text-xs opacity-60" style={{ color: RANK_COLORS[i] }}>
                        [{RANK_LABELS[i]}]
                      </span>
                    )}
                  </span>
                  <span className="col-span-3 text-right font-mono text-xs text-space-cyan">
                    {entry.universe_score.toLocaleString()}
                  </span>
                  <span className="col-span-3 text-right font-mono text-xs text-yellow-500">
                    ★{entry.total_stars.toLocaleString()}
                  </span>
                </motion.a>
              ))
            )}
          </div>

          <div className="h-px w-full bg-gradient-to-r from-transparent via-space-gold/40 to-transparent" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
