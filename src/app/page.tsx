'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MultiverseScene } from '@/components/multiverse/MultiverseScene'
import { SearchBar } from '@/components/multiverse/SearchBar'
import { RandomUniverseButton } from '@/components/ui/RandomUniverseButton'
import { AmbientAudio } from '@/components/ui/AmbientAudio'
import type { StoredUniverse, LeaderboardEntry } from '@/types'

const FACTS = [
  { icon: '🌌', text: 'JavaScript was written in 10 days in 1995. It now runs everywhere.' },
  { icon: '⭐', text: 'The most starred GitHub repo ever is freeCodeCamp with 400k+ stars.' },
  { icon: '🦀', text: 'Rust has been Stack Overflow\'s "most loved language" for 9 consecutive years.' },
  { icon: '🐍', text: 'Python is now the most popular language on GitHub by repo count.' },
  { icon: '⚡', text: 'The average GitHub user has 8.3 public repositories.' },
  { icon: '🌍', text: 'Over 100 million developers use GitHub worldwide.' },
  { icon: '🔭', text: 'The Linux kernel has over 30 million lines of C code.' },
  { icon: '💫', text: 'TypeScript adoption grew 400% between 2017 and 2023.' },
  { icon: '🌙', text: 'Lua means "moon" in Portuguese — it was born in Brazil in 1993.' },
  { icon: '🔮', text: 'Go was designed at Google in a single afternoon by Ken Thompson, Rob Pike, and Robert Griesemer.' },
  { icon: '🛸', text: 'WebAssembly can run C, C++, Rust, and Go code in the browser at near-native speed.' },
  { icon: '🪐', text: 'The name "Kotlin" comes from Kotlin Island near St. Petersburg, Russia.' },
]

function FunFactsTicker() {
  const [idx, setIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIdx(i => (i + 1) % FACTS.length)
        setVisible(true)
      }, 400)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const fact = FACTS[idx]

  return (
    <div className="flex items-center gap-3 max-w-lg">
      <div className="w-px h-6 bg-space-cyan/20 flex-shrink-0" />
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={idx}
            className="flex items-start gap-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            <span className="text-sm flex-shrink-0">{fact.icon}</span>
            <p className="font-mono text-xs text-gray-600 leading-relaxed">{fact.text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Home() {
  const [universes, setUniverses] = useState<StoredUniverse[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [showLeaderboard, setShowLeaderboard] = useState(false)
  const [isWarping, setIsWarping] = useState(false)

  useEffect(() => {
    // Fetch stored universes + leaderboard in parallel
    Promise.all([
      fetch('/api/universes').then((r) => r.json()).catch(() => ({ universes: [] })),
      fetch('/api/leaderboard').then((r) => r.json()).catch(() => ({ leaderboard: [] })),
    ]).then(([uData, lData]) => {
      setUniverses(uData.universes || [])
      setLeaderboard(lData.leaderboard || [])
    })
  }, [])

  return (
    <main className="relative w-screen h-screen overflow-hidden grid-overlay">
      {/* 3D Multiverse background */}
      <MultiverseScene 
        universes={universes} 
        leaderboard={leaderboard} 
        isWarping={isWarping}
        onWarpStart={() => setIsWarping(true)}
      />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,8,0.7) 100%)',
        }}
      />

      {/* Header */}
      <motion.div
        className="absolute top-6 left-1/2 -translate-x-1/2 text-center z-10 pointer-events-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="flex items-center gap-2 justify-center mb-1">
          <div className="w-8 h-px bg-space-cyan/30" />
          <span className="font-mono text-xs text-space-cyan/40 tracking-widest">
            v1.0 // MULTIVERSE VIEW
          </span>
          <div className="w-8 h-px bg-space-cyan/30" />
        </div>
        <h1 className="font-orbitron font-black text-4xl text-white tracking-tight">
          STACK{' '}
          <span className="text-space-cyan text-glow-cyan">UNIVERSE</span>
        </h1>
        <p className="font-mono text-xs text-gray-600 mt-1 tracking-widest">
          EVERY DEVELOPER HAS A UNIVERSE
        </p>
      </motion.div>

      {/* Top-right: ambient audio — z-50 to stay above canvas */}
      <motion.div
        className="absolute top-6 right-6 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <AmbientAudio />
      </motion.div>

      {/* Center search */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-8 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.8 }}
      >
        <div className="pointer-events-auto">
          <SearchBar />
        </div>

        {/* Fun facts ticker */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <FunFactsTicker />
        </motion.div>

        {/* Random drift button */}
        {universes.length > 0 && (
          <motion.div
            className="pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            <RandomUniverseButton label="⟳ DRIFT TO A RANDOM UNIVERSE" />
          </motion.div>
        )}

        {/* Stats */}
        {universes.length > 0 && (
          <motion.div
            className="flex gap-6 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            <div className="text-center">
              <p className="font-orbitron font-bold text-space-cyan text-lg">
                {universes.length}
              </p>
              <p className="font-mono text-xs text-gray-700">UNIVERSES DISCOVERED</p>
            </div>
            <div className="w-px bg-space-cyan/10" />
            <div className="text-center">
              <p className="font-orbitron font-bold text-space-magenta text-lg">
                {leaderboard[0]?.universe_score.toLocaleString() ?? '—'}
              </p>
              <p className="font-mono text-xs text-gray-700">HIGHEST SCORE</p>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Bottom: leaderboard preview */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 z-10 flex justify-center pb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <button
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          className="font-mono text-xs text-space-gold/50 hover:text-space-gold transition-colors tracking-widest flex items-center gap-2"
        >
          ★ HALL OF GIANTS
          <span className="text-gray-700">
            {showLeaderboard ? '▲ COLLAPSE' : '▼ EXPAND'}
          </span>
        </button>
      </motion.div>

      {/* Leaderboard drawer */}
      <motion.div
        className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 w-full max-w-2xl px-4 pointer-events-none"
        initial={false}
        animate={showLeaderboard ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        {showLeaderboard && (
          <div className="hud-panel rounded p-4 pointer-events-auto">
            <div className="grid grid-cols-10 gap-2 font-mono text-xs text-gray-700 mb-2 pb-2 border-b border-white/5">
              <span className="col-span-1">#</span>
              <span className="col-span-3">USERNAME</span>
              <span className="col-span-2 text-right">SCORE</span>
              <span className="col-span-2 text-right">STARS</span>
              <span className="col-span-2 text-right">REPOS</span>
            </div>
            {leaderboard.length === 0 ? (
              <p className="text-center font-mono text-xs text-gray-700 py-4">
                No universes discovered yet. Search for a GitHub user to begin.
              </p>
            ) : (
              leaderboard.map((entry, i) => (
                <a
                  key={entry.username}
                  href={`/${entry.username}`}
                  className="grid grid-cols-10 gap-2 items-center py-1.5 hover:bg-space-cyan/5 rounded transition-colors group"
                >
                  <span
                    className="col-span-1 font-orbitron text-xs"
                    style={{ color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#4a6a7a' }}
                  >
                    {i + 1}
                  </span>
                  <span className="col-span-3 font-mono text-xs text-white group-hover:text-space-cyan transition-colors">
                    @{entry.username}
                  </span>
                  <span className="col-span-2 text-right font-mono text-xs text-space-cyan">
                    {entry.universe_score.toLocaleString()}
                  </span>
                  <span className="col-span-2 text-right font-mono text-xs text-yellow-500">
                    ★ {entry.total_stars.toLocaleString()}
                  </span>
                  <span className="col-span-2 text-right font-mono text-xs text-gray-500">
                    {entry.total_repos}
                  </span>
                </a>
              ))
            )}
          </div>
        )}
      </motion.div>

      {/* Ambient hint: click on universes */}
      <motion.p
        className="absolute top-1/2 left-4 font-mono text-xs tracking-wider -rotate-90 origin-left pointer-events-none"
        style={{ color: isWarping ? '#ff006e' : '#1f2937' }}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {isWarping ? 'WARPING COMPUTE IN PROGRESS...' : '↑ CLICK DEEP SPACE FOR RANDOM'}
      </motion.p>

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-space-cyan/20 pointer-events-none" />
      <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-space-cyan/20 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-space-cyan/20 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-space-cyan/20 pointer-events-none" />
    </main>
  )
}
