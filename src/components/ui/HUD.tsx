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
        className="absolute top-4 left-4 hud-panel hud-corner relative rounded p-4 w-72"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <div className="flex items-center gap-3 mb-3">
          {data.user.avatar_url && (
            <img
              src={data.user.avatar_url}
              alt={data.username}
              className="w-10 h-10 rounded-full border border-space-cyan/30"
            />
          )}
          <div>
            <p className="font-orbitron text-xs text-gray-500 tracking-widest">UNIVERSE OF</p>
            <p className="font-orbitron font-bold text-space-cyan text-glow-cyan text-base leading-tight">
              @{data.username}
            </p>
          </div>
        </div>

        {data.user.name && (
          <p className="font-mono text-xs text-gray-400 mb-2">{data.user.name}</p>
        )}

        <div className="space-y-1.5 border-t border-space-cyan/10 pt-2">
          <StatRow label="Universe Score" value={data.universeScore.toLocaleString()} accent="text-space-cyan" />
          <StatRow label="Distance" value={formatLightYears(data.lightYears)} />
          <StatRow label="Region" value={data.distanceLabel} />
          <StatRow label="Total Stars" value={`★ ${data.totalStars.toLocaleString()}`} accent="text-yellow-400" />
          <StatRow label="Repositories" value={data.repos.length} />
          <StatRow label="Languages" value={data.languages.length} />
          <StatRow
            label="Account Age"
            value={`${data.accountAgeYears.toFixed(1)} years`}
          />
        </div>
      </motion.div>

      {/* Top-right: Controls */}
      <motion.div
        className="absolute top-4 right-4 flex flex-col gap-2 z-50"
        style={{ pointerEvents: 'auto' }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4 }}
      >
        <button
          onClick={() => router.push('/')}
          className="hud-panel rounded px-4 py-2 font-mono text-xs text-space-cyan hover:bg-space-cyan/10 transition-colors tracking-wider"
        >
          ← MULTIVERSE
        </button>
        <button
          onClick={() => setShowShareCard(true)}
          className="hud-panel rounded px-4 py-2 font-mono text-xs text-space-magenta hover:bg-space-magenta/10 transition-colors tracking-wider"
        >
          ⊡ SHARE UNIVERSE
        </button>
        <button
          onClick={toggleHallOfGiants}
          className="hud-panel rounded px-4 py-2 font-mono text-xs text-space-gold hover:bg-space-gold/10 transition-colors tracking-wider"
        >
          ★ HALL OF GIANTS
        </button>
        <RandomUniverseButton />
        <AmbientAudio />
      </motion.div>

      {/* Bottom: Language legend */}
      <motion.div
        className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {data.languages.slice(0, 8).map((lang) => (
          <div
            key={lang.name}
            className="flex items-center gap-1.5 bg-black/60 border border-white/5 rounded px-2 py-1 backdrop-blur-sm"
          >
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: lang.color, boxShadow: `0 0 4px ${lang.color}` }}
            />
            <span className="font-mono text-xs text-gray-400">{lang.name}</span>
            <span className="font-mono text-xs" style={{ color: lang.color }}>
              {lang.percentage.toFixed(0)}%
            </span>
          </div>
        ))}
      </motion.div>

      {/* Instruction hint (fades out) */}
      <motion.p
        className="absolute top-1/2 left-1/2 -translate-x-1/2 font-mono text-xs text-space-cyan/30 tracking-widest pointer-events-none"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 3, duration: 2 }}
      >
        SCROLL TO ZOOM · DRAG TO ROTATE · CLICK PLANETS TO EXPLORE
      </motion.p>
    </>
  )
}
