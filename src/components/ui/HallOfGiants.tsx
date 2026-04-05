'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useUniverseStore } from '@/store'
import type { LeaderboardEntry } from '@/types'

const RANK_COLORS = ['#ffd700', '#c0c0c0', '#cd7f32']
const RANK_LABELS = ['TITAN', 'GIANT', 'GIANT']

export function HallOfGiants() {
  const { leaderboard, setLeaderboard, setActivePanel } =
    useUniverseStore()
  const [loading, setLoading] = useState(false)
  const [source, setSource] = useState<'db' | 'github' | null>(null)
  const router = useRouter()

  useEffect(() => {
    setLoading(true)
    fetch('/api/leaderboard')
      .then((r) => r.json())
      .then((d) => {
        setLeaderboard(d.leaderboard || [])
        setSource(d.source ?? null)
      })
      .catch(() => setLeaderboard([]))
      .finally(() => setLoading(false))
  }, [setLeaderboard])

  return (
    <>
      {/* Backdrop — click to close */}
      <motion.div
        className="fixed inset-0 bg-black/50 z-[390]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => setActivePanel(null)}
      />

      {/* Panel — Mobile: bottom sheet, Desktop: side card */}
      <motion.div
        className="fixed z-[400]
                    inset-x-0 bottom-0 max-h-[85vh]
                    md:inset-auto md:top-6 md:right-6 md:bottom-auto md:w-96 md:max-h-[80vh]
                    bg-black/90 backdrop-blur-[50px] border border-white/10
                    rounded-t-3xl md:rounded-2xl
                    overflow-hidden flex flex-col
                    shadow-[0_-10px_60px_rgba(0,0,0,0.6)] md:shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
      >
        {/* Mobile drag handle */}
        <div className="md:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mt-3" />

        {/* Header */}
        <div className="px-5 py-4 border-b border-space-gold/20 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="font-orbitron text-[9px] text-space-gold/50 tracking-widest">
              ◈ HALL OF GIANTS
            </p>
            <p className="font-orbitron font-bold text-space-gold text-sm"
              style={{ textShadow: '0 0 10px #ffd700, 0 0 20px #ffd70080' }}>
              TOP 10 UNIVERSES
            </p>
          </div>
          <button
            onClick={() => setActivePanel(null)}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-500 hover:text-white hover:bg-white/10 transition-all text-sm"
          >
            ✕
          </button>
        </div>

        {/* Source badge */}
        {source === 'github' && !loading && (
          <div className="px-5 pt-2">
            <p className="font-mono text-[10px] text-gray-600 italic">
              ↳ showing notable devs — search users to populate your DB
            </p>
          </div>
        )}

        {/* Column headers */}
        <div className="px-5 pt-3 pb-2 grid grid-cols-12 gap-1 text-gray-600 font-mono text-[9px] uppercase tracking-widest flex-shrink-0">
          <span className="col-span-1">#</span>
          <span className="col-span-5">Username</span>
          <span className="col-span-3 text-right">Score</span>
          <span className="col-span-3 text-right">Stars</span>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-3 pb-6 md:pb-4 custom-scrollbar">
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
            <div className="py-8 text-center font-mono text-xs text-gray-600">
              No data available.
            </div>
          ) : (
            leaderboard.map((entry: LeaderboardEntry, i) => (
              <motion.a
                key={entry.username}
                href={`/universe/${entry.username}`}
                className="w-full grid grid-cols-12 gap-1 items-center py-2.5 px-3 rounded-lg hover:bg-space-gold/5 transition-colors group text-left"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={(e) => {
                  e.preventDefault()
                  setActivePanel(null)
                  router.push(`/universe/${entry.username}`)
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
                    <span className="ml-1 text-[9px] opacity-50" style={{ color: RANK_COLORS[i] }}>
                      [{RANK_LABELS[i]}]
                    </span>
                  )}
                </span>
                <span className="col-span-3 text-right font-mono text-[11px] text-space-cyan">
                  {entry.universe_score.toLocaleString()}
                </span>
                <span className="col-span-3 text-right font-mono text-[11px] text-yellow-500/80">
                  ★{entry.total_stars.toLocaleString()}
                </span>
              </motion.a>
            ))
          )}
        </div>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-space-gold/30 to-transparent flex-shrink-0" />
      </motion.div>
    </>
  )
}
