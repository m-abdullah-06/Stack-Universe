'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { UniverseData } from '@/types'
import { formatLightYears } from '@/lib/universe-score'
import { useUniverseStore } from '@/store'
import { RandomUniverseButton } from './RandomUniverseButton'
import { AmbientAudio } from './AmbientAudio'

interface HUDProps {
  data: UniverseData
}

function StatRow({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-gray-500 text-xs font-mono uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-mono font-medium ${accent || 'text-white'}`}>{value}</span>
    </div>
  )
}

export function HUD({ data }: HUDProps) {
  const router = useRouter()
  const { toggleHallOfGiants, setShowShareCard } = useUniverseStore()

  return (
    <>
      {/* Top-left: Universe identity */}
      <motion.div
        className="absolute top-6 left-6 hud-panel relative rounded-lg p-5 w-80 backdrop-blur-md"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, type: 'spring', damping: 20 }}
        style={{ border: '1px solid rgba(0,229,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            {data.user.avatar_url && (
              <img
                src={data.user.avatar_url}
                alt={data.username}
                className="w-12 h-12 rounded-full border-2 border-space-cyan/40 shadow-[0_0_15px_rgba(0,229,255,0.3)]"
              />
            )}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-space-cyan border-2 border-[#030310] flex items-center justify-center text-[8px] text-[#030310] font-bold">
              ✓
            </div>
          </div>
          <div>
            <p className="font-orbitron text-[10px] text-space-cyan/50 tracking-[0.2em] mb-0.5">UNIVERSE OF</p>
            <p className="font-orbitron font-bold text-white text-lg leading-tight tracking-wide">
              @{data.username}
            </p>
          </div>
        </div>

        <div className="space-y-2 border-t border-white/5 pt-4">
          <div className="flex justify-between items-baseline group">
            <span className="text-gray-500 text-[10px] font-mono tracking-widest uppercase opacity-60">Score</span>
            <span className="text-sm font-orbitron font-bold text-space-cyan text-glow-cyan">{data.universeScore.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-baseline group">
            <span className="text-gray-500 text-[10px] font-mono tracking-widest uppercase opacity-60">Distance</span>
            <span className="text-xs font-mono text-white opacity-80">{formatLightYears(data.lightYears)}</span>
          </div>
          <div className="flex justify-between items-baseline group">
            <span className="text-gray-500 text-[10px] font-mono tracking-widest uppercase opacity-60">Status</span>
            <span className="text-[10px] font-mono text-space-cyan px-1.5 py-0.5 rounded bg-space-cyan/10 border border-space-cyan/20">
              {data.distanceLabel}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
          <div className="bg-white/5 rounded p-2 text-center">
            <p className="text-[9px] text-gray-600 font-mono uppercase mb-0.5">Stars</p>
            <p className="text-xs font-orbitron text-space-gold">★ {data.totalStars.toLocaleString()}</p>
          </div>
          <div className="bg-white/5 rounded p-2 text-center">
            <p className="text-[9px] text-gray-600 font-mono uppercase mb-0.5">Repos</p>
            <p className="text-xs font-orbitron text-white text-glow-white">{data.repos.length}</p>
          </div>
        </div>
      </motion.div>

      {/* Top-right: Controls */}
      <motion.div
        className="absolute top-6 right-6 flex flex-col gap-3 z-50 items-end"
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button
          onClick={() => router.push('/')}
          className="group flex items-center gap-2 font-mono text-[10px] text-space-cyan/40 hover:text-white transition-all tracking-[0.2em]"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span> 
          <span>EXIT UNIVERSE</span>
        </button>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => setShowShareCard(true)}
            className="hud-panel rounded-full px-5 py-2.5 font-mono text-xs text-space-magenta border border-space-magenta/30 hover:bg-space-magenta/10 transition-all tracking-widest flex items-center gap-2 group"
          >
            <span className="text-sm">⊡</span> SHARE 
          </button>
          <button
            onClick={toggleHallOfGiants}
            className="hud-panel rounded-full px-5 py-2.5 font-mono text-xs text-space-gold border border-space-gold/30 hover:bg-space-gold/10 transition-all tracking-widest flex items-center gap-2 group"
          >
            <span className="text-sm">★</span> LEADERS
          </button>
        </div>

        <div className="flex items-center gap-4 mt-2 pr-2 opacity-60 hover:opacity-100 transition-opacity">
          <RandomUniverseButton />
          <AmbientAudio />
        </div>
      </motion.div>

      {/* Bottom: Language legend */}
      <motion.div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-black/40 backdrop-blur-xl border border-white/5 rounded-full px-6 py-3"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-[10px] font-mono text-gray-600 tracking-[0.2em] border-r border-white/10 pr-4 mr-2">DNA</p>
        <div className="flex gap-4 overflow-x-auto no-scrollbar max-w-[60vw]">
          {data.languages.slice(0, 5).map((lang) => (
            <div key={lang.name} className="flex items-center gap-2 flex-shrink-0">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: lang.color, boxShadow: `0 0 8px ${lang.color}` }}
              />
              <span className="font-mono text-[10px] text-white/60">{lang.name}</span>
              <span className="font-mono text-[10px] font-bold" style={{ color: lang.color }}>
                {lang.percentage.toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Instruction hint (fades out) */}
      <motion.p
        className="absolute top-[60vh] left-1/2 -translate-x-1/2 font-mono text-[10px] text-space-cyan/20 tracking-[0.3em] pointer-events-none uppercase"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 4, duration: 2 }}
      >
        Mouse to navigate · Click to analyze
      </motion.p>
    </>
  )
}
