'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type { UniverseData } from '@/types'
import { useUniverseStore } from '@/store'
import { AmbientAudio } from './AmbientAudio'

interface HUDProps {
  data: UniverseData
}

export function HUD({ data }: HUDProps) {
  const router = useRouter()
  const { toggleHallOfGiants, setShowShareCard, viewMode, setViewMode } = useUniverseStore()

  return (
    <>
      {/* ─── HUD: Mobile = Top Bar, Desktop = Side Card ─────────── */}
      <motion.div
        className={`fixed z-[100] bg-black/85 backdrop-blur-2xl shadow-[0_4px_30px_rgba(0,0,0,0.5)]
                    top-0 left-0 right-0 border-b border-white/10
                    md:top-6 md:left-6 md:right-auto md:bottom-auto md:w-72 md:rounded-2xl md:border md:border-white/10`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {/* ── MOBILE LAYOUT (< md) ── */}
        <div className="md:hidden">
          {/* Row 1: Avatar + Name + Score + Actions */}
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative flex-shrink-0">
                {data.user.avatar_url && (
                  <img src={data.user.avatar_url} alt={data.username}
                    className="w-8 h-8 rounded-full border-2 border-space-cyan/30" />
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-space-cyan border-[1.5px] border-black flex items-center justify-center text-[5px] text-black font-bold">✓</div>
              </div>
              <div className="min-w-0">
                <p className="font-orbitron font-bold text-white text-[11px] leading-tight truncate">@{data.username}</p>
                <p className="text-[9px] font-orbitron font-bold text-space-cyan">{data.universeScore.toLocaleString()} <span className="text-[7px] font-mono text-gray-500 font-normal">PTS</span></p>
              </div>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button onClick={() => router.push('/')} className="p-1.5 text-gray-500 hover:text-white transition-colors" title="Exit">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              </button>
              <button onClick={() => setShowShareCard(true)} className="p-1.5 text-space-magenta/70 hover:text-space-magenta transition-colors" title="Share">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
              </button>
              <button onClick={toggleHallOfGiants} className="p-1.5 text-space-gold/70 hover:text-space-gold transition-colors" title="Leaderboard">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              </button>
            </div>
          </div>
          {/* Row 2: Stats + Toggle */}
          <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-orbitron text-space-gold font-bold">★{data.totalStars.toLocaleString()}</span>
              <span className="text-[10px] font-orbitron text-white font-bold">{data.repos.length} <span className="text-[8px] font-mono text-gray-600 font-normal">repos</span></span>
            </div>
            <div className="flex bg-white/5 rounded-full p-0.5 border border-white/10">
              {(['repos', 'langs'] as const).map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`px-2.5 py-0.5 rounded-full font-mono text-[8px] uppercase tracking-widest transition-all ${
                    viewMode === mode
                      ? 'bg-space-cyan text-black font-bold shadow-[0_0_10px_rgba(0,229,255,0.4)]'
                      : 'text-gray-500 hover:text-white'
                  }`}
                >{mode}</button>
              ))}
            </div>
          </div>
        </div>

        {/* ── DESKTOP LAYOUT (md+) ── */}
        <div className="hidden md:block p-5 space-y-4">
          {/* Identity */}
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              {data.user.avatar_url && (
                <img src={data.user.avatar_url} alt={data.username}
                  className="w-12 h-12 rounded-full border-2 border-space-cyan/30 shadow-[0_0_15px_rgba(0,229,255,0.2)]" />
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-space-cyan border-2 border-black flex items-center justify-center text-[7px] text-black font-bold">✓</div>
            </div>
            <div>
              <p className="font-orbitron text-[9px] text-space-cyan/40 tracking-[0.2em] mb-0.5">UNIVERSE OF</p>
              <p className="font-orbitron font-bold text-white text-base leading-tight">@{data.username}</p>
            </div>
          </div>

          {/* Score */}
          <div className="border-t border-white/5 pt-3">
            <div className="flex justify-between items-baseline">
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Universe Score</span>
              <span className="text-sm font-orbitron font-bold text-space-cyan">{data.universeScore.toLocaleString()}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/[0.03] rounded-lg p-3 text-center">
              <p className="text-[8px] font-mono text-gray-600 uppercase tracking-widest mb-1">Stars</p>
              <p className="font-orbitron text-sm text-space-gold font-bold">★{data.totalStars.toLocaleString()}</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-3 text-center">
              <p className="text-[8px] font-mono text-gray-600 uppercase tracking-widest mb-1">Repos</p>
              <p className="font-orbitron text-sm text-white font-bold">{data.repos.length}</p>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2 bg-space-cyan/5 border border-space-cyan/15 rounded-lg px-3 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-space-cyan animate-pulse" />
            <span className="text-[10px] font-mono text-space-cyan tracking-wider">{data.distanceLabel}</span>
          </div>

          {/* View Toggle */}
          <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
            {(['repos', 'langs'] as const).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`flex-1 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-widest transition-all ${
                  viewMode === mode
                    ? 'bg-space-cyan text-black font-bold shadow-[0_0_12px_rgba(0,229,255,0.4)]'
                    : 'text-gray-500 hover:text-white'
                }`}
              >{mode === 'repos' ? '⬤ REPOS' : '◎ LANGS'}</button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button onClick={() => router.push('/')}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.06] transition-all font-mono text-[9px] text-gray-400 hover:text-white uppercase tracking-wider">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Exit
            </button>
            <button onClick={() => setShowShareCard(true)}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.03] border border-space-magenta/20 hover:bg-space-magenta/10 transition-all font-mono text-[9px] text-space-magenta/70 hover:text-space-magenta uppercase tracking-wider">
              Share
            </button>
            <button onClick={toggleHallOfGiants}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-white/[0.03] border border-space-gold/20 hover:bg-space-gold/10 transition-all font-mono text-[9px] text-space-gold/70 hover:text-space-gold uppercase tracking-wider">
              ★ Top
            </button>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <AmbientAudio />
          </div>
        </div>
      </motion.div>

      {/* ─── Bottom: Language Legend ─────────────────────────── */}
      <motion.div
        className="fixed bottom-4 left-3 right-3 z-40 mx-auto max-w-lg bg-black/85 backdrop-blur-2xl border border-white/10 rounded-full overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto no-scrollbar whitespace-nowrap px-5 py-2.5">
            {data.languages.slice(0, 5).map((lang) => (
              <div key={lang.name} className="flex items-center gap-1.5 flex-shrink-0">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: lang.color, boxShadow: `0 0 6px ${lang.color}` }}
                />
                <span className="font-mono text-[9px] text-white/50">{lang.name}</span>
                <span className="font-mono text-[9px] font-bold" style={{ color: lang.color }}>
                  {lang.percentage.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
          <div className="absolute top-0 right-0 bottom-0 w-6 bg-gradient-to-l from-black/85 to-transparent pointer-events-none rounded-r-full" />
          <div className="absolute top-0 left-0 bottom-0 w-3 bg-gradient-to-r from-black/85 to-transparent pointer-events-none rounded-l-full" />
        </div>
      </motion.div>
    </>
  )
}
