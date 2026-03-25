'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatLightYears } from '@/lib/universe-score'

interface EntryCinematicProps {
  username: string
  lightYears: number
  distanceLabel: string
  claimData?: any | null
  onComplete: () => void
}

const WARP_LINES = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  width: Math.random() * 1.5 + 0.5,
  opacity: Math.random() * 0.7 + 0.3,
  delay: Math.random() * 0.3,
  duration: Math.random() * 0.4 + 0.4,
}))

export function EntryCinematic({
  username,
  lightYears,
  distanceLabel,
  claimData,
  onComplete,
}: EntryCinematicProps) {
  const [phase, setPhase] = useState<
    'start' | 'coordinates' | 'distance' | 'approach' | 'done'
  >('start')
  const [displayDistance, setDisplayDistance] = useState(0)
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const t = timerRef.current
    // Helper to queue a phase change
    const after = (ms: number, fn: () => void) => {
      const id = setTimeout(fn, ms)
      t.push(id)
      return id
    }

    after(400, () => setPhase('coordinates'))
    after(1400, () => setPhase('distance'))

    // Animate the distance counter
    const start = Date.now()
    const duration = 1200
    const animInterval = setInterval(() => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      setDisplayDistance(Math.floor(progress * lightYears))
      if (progress >= 1) clearInterval(animInterval)
    }, 30)

    after(2800, () => setPhase('approach'))
    after(4800, () => {
      setPhase('done')
      onComplete()
    })

    return () => {
      t.forEach(clearTimeout)
      t.length = 0
      clearInterval(animInterval)
    }
  }, [lightYears, onComplete])

  if (phase === 'done') return null

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-hidden bg-space-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Warp lines */}
      <div className="absolute inset-0">
        {WARP_LINES.map((line) => (
          <div
            key={line.id}
            className="absolute h-px origin-left"
            style={{
              left: `${line.x}%`,
              top: `${line.y}%`,
              width: `${line.width}px`,
              opacity: phase === 'start' ? 0 : line.opacity,
              backgroundColor: '#00e5ff',
              boxShadow: `0 0 4px #00e5ff`,
              transform: `scaleX(1)`,
              transformOrigin: 'center',
              transition: `all ${line.duration}s ease-in ${line.delay}s`,
              ...(phase !== 'start' && {
                width: `${line.width * 200}px`,
                opacity: 0,
              }),
            }}
          />
        ))}
      </div>

      {/* Radial speed lines from center */}
      <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
        {Array.from({ length: 60 }, (_, i) => {
          const angle = (i / 60) * Math.PI * 2
          const cx = 50
          const cy = 50
          const r1 = 5
          const r2 = 80
          return (
            <motion.line
              key={i}
              x1={`${cx + Math.cos(angle) * r1}%`}
              y1={`${cy + Math.sin(angle) * r1}%`}
              x2={`${cx + Math.cos(angle) * r2}%`}
              y2={`${cy + Math.sin(angle) * r2}%`}
              stroke="#00e5ff"
              strokeWidth="0.5"
              strokeOpacity={0.3}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={
                phase !== 'start'
                  ? { pathLength: 1, opacity: [0, 0.6, 0] }
                  : {}
              }
              transition={{ duration: 1.5, delay: i * 0.01, ease: 'easeIn' }}
            />
          )
        })}
      </svg>

      {/* Central bright flash */}
      <AnimatePresence>
        {phase !== 'start' && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="w-4 h-4 rounded-full"
              style={{
                background: '#fff',
                boxShadow:
                  '0 0 60px 30px #00e5ff, 0 0 120px 60px #00e5ff40, 0 0 200px 100px #00e5ff20',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-6">
        <AnimatePresence mode="wait">
          {phase === 'start' && (
            <motion.p
              key="start"
              className="cinematic-text text-sm tracking-widest"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              INITIATING WARP SEQUENCE
            </motion.p>
          )}

          {phase === 'coordinates' && (
            <motion.div
              key="coords"
              className="text-center space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="cinematic-text text-xs tracking-widest opacity-60">
                ▶ CALCULATING COORDINATES...
              </p>
              <div className="flex gap-8 font-mono text-xs text-space-cyan opacity-40">
                {['RA', 'DEC', 'DIST', 'VEL'].map((label) => (
                  <div key={label} className="text-center">
                    <div className="text-space-cyan-dim">{label}</div>
                    <div className="text-space-cyan">
                      {(Math.random() * 999).toFixed(3)}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {phase === 'distance' && (
            <motion.div
              key="distance"
              className="text-center space-y-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="font-mono text-xs text-space-cyan opacity-50 tracking-widest">
                DISTANCE TO TARGET
              </p>
              <p
                className="font-orbitron font-bold text-4xl text-space-cyan text-glow-cyan tabular-nums"
              >
                {formatLightYears(displayDistance)}
              </p>
              <p className="font-mono text-xs text-space-magenta tracking-widest">
                ◆ {distanceLabel.toUpperCase()} ◆
              </p>
            </motion.div>
          )}

          {phase === 'approach' && (
            <motion.div
              key="approach"
              className="text-center space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.5 }}
            >
              <p className="font-mono text-xs text-space-cyan opacity-50 tracking-widest">
                ▶ DESTINATION LOCKED
              </p>
              <p className="font-orbitron font-bold text-3xl text-white">
                Approaching the universe of
              </p>
              <p
                className="font-orbitron font-black text-5xl text-space-cyan text-glow-cyan"
              >
                @{username}
              </p>
              
              {claimData?.entry_msg && (
                <motion.p
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="font-mono text-sm text-white/60 mt-4 italic max-w-lg mx-auto"
                >
                  "{claimData.entry_msg}"
                </motion.p>
              )}

              <motion.div
                className="flex items-center justify-center gap-2 mt-4"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                <div className="w-1 h-1 rounded-full bg-space-cyan" />
                <p className="font-mono text-xs text-space-cyan opacity-70 tracking-widest">
                  PREPARING LANDING SEQUENCE
                </p>
                <div className="w-1 h-1 rounded-full bg-space-cyan" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom status bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <div className="w-32 h-px bg-space-cyan opacity-30" />
        <span className="font-mono text-xs text-space-cyan opacity-30 tracking-widest">
          STACK UNIVERSE // WARP DRIVE ACTIVE
        </span>
        <div className="w-32 h-px bg-space-cyan opacity-30" />
      </div>
    </motion.div>
  )
}
