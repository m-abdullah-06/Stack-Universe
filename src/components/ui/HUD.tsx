'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useState, useRef } from 'react'
import type { UniverseData } from '@/types'
import { useUniverseStore, useIsAnyPanelOpen } from '@/store'
import { LoginButton } from './LoginButton'
import { AmbientAudio } from './AmbientAudio'

interface HUDProps {
  data: UniverseData
  cockpitMode?: boolean
  setCockpitMode?: (val: boolean) => void
}

export function HUD({ data, cockpitMode = false, setCockpitMode }: HUDProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { 
    toggleHallOfGiants, 
    setShowShareCard, 
    viewMode, 
    setViewMode, 
    claimData, 
    setClaimData,
    setShowClaimPulse,
    setShowNarrator,
    setShowRoast,
    setShowHoroscope,
    setQueriedPlanetNames,
    setShowIdentityPanel,
    showCustomisePanel,
    setShowCustomisePanel,
    setShowDNAFingerprint,
  } = useUniverseStore()

  const isAnyPanelOpen = useIsAnyPanelOpen()
  
  const [isQuerying, setIsQuerying] = useState(false)
  const [queryFeedback, setQueryFeedback] = useState<string | null>(null)
  const [isWeeklyDigestChecked, setIsWeeklyDigestChecked] = useState(true)
  const [customEmail, setCustomEmail] = useState(session?.user?.email || '')
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isOwner = session?.user && (session.user as any).login === data.username
  const isClaimed = !!claimData || !!data.claim

  // Auto-sync if prop has it but store doesn't
  if (data.claim && !claimData) {
    setClaimData(data.claim)
  }

  const handleClaim = async (optIn: boolean) => {
    try {
      const emailToUse = optIn ? (customEmail || session?.user?.email) : null
      const res = await fetch(`/api/claim/${data.username}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          github_id: data.user.login,
          email: emailToUse,
          weekly_digest: optIn
        })
      })
      if (!res.ok) {
        const errJson = await res.json()
        if (errJson.error === 'ALREADY_CLAIMED') {
          alert('This universe has already been claimed!')
          window.location.reload() // Force sync
          return
        }
        throw new Error('Claim failed')
      }
      const json = await res.json()
      setClaimData(json.claim)
      setShowClaimPulse(true)
      setTimeout(() => setShowClaimPulse(false), 3000)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <>
      {/* ─── HUD: Mobile = Top Bar, Desktop = Side Card ─────────── */}
      <motion.div
        className={`fixed z-[100] luxe-glass
                    top-16 left-0 right-0 border-b border-white/10
                    md:top-8 md:left-8 md:right-auto md:bottom-auto md:w-80 md:rounded-xl md:border md:border-white/10 hud-corner
                    transition-all duration-500
                    ${isAnyPanelOpen ? 'max-md:-translate-y-full md:opacity-40 md:pointer-events-none' : 'translate-y-0 opacity-100'}`}
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
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
              {setCockpitMode && (
                <button 
                  onClick={() => setCockpitMode(!cockpitMode)}
                  className={`p-1.5 transition-all ${
                    cockpitMode 
                      ? 'text-space-magenta drop-shadow-[0_0_8px_rgba(255,0,110,0.8)]' 
                      : 'text-gray-500 hover:text-white'
                  }`}
                  title="Enter Starship Cockpit"
                >
                  🚀
                </button>
              )}
              <button onClick={toggleHallOfGiants} className="p-1.5 text-space-gold/70 hover:text-space-gold transition-colors" title="Leaderboard">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              </button>
            </div>
          </div>

          {/* Universe Bio (Mobile) */}
          {(claimData?.bio || data.claim?.bio) && (
            <div className="border border-white/5 border-l-[3px] border-l-space-gold/50 bg-white/[0.02] rounded-r-lg rounded-l-[3px] py-2 px-3 mx-2 mb-2 mt-0.5">
              <p className="font-mono text-[9px] text-gray-400 italic leading-tight break-words">
                "{(claimData?.bio || data.claim?.bio)}"
              </p>
            </div>
          )}

          {/* Row 2: Stats + Toggle */}
          <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-orbitron text-space-gold font-bold">★{data.totalStars.toLocaleString()}</span>
              <span className="text-[10px] font-orbitron text-white font-bold">{data.repos.length} <span className="text-[8px] font-mono text-gray-600 font-normal">repos</span></span>
            </div>
            <div className="flex items-center gap-2">
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
              {isOwner && isClaimed && (
                <button 
                  onClick={() => setShowCustomisePanel(true)}
                  className="w-6 h-6 flex items-center justify-center bg-white/5 border border-white/10 rounded-full text-[10px] hover:bg-white/10 transition-colors"
                >
                  ⚙️
                </button>
              )}
            </div>
          </div>
          
          {/* Mobile Secondary Controls */}
          <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
            <AmbientAudio />
            <LoginButton className="!px-3 !py-1.5 !bg-white/5" />
          </div>

          {/* AI Mobile Actions */}
          <div className="flex items-center justify-around px-3 pb-3 border-t border-white/5 pt-2 bg-white/[0.02]">
            <button onClick={() => setShowNarrator(true)} className="flex flex-col items-center gap-1 group">
              <span className="text-[14px] group-hover:scale-110 transition-transform">🎙</span>
              <span className="text-[7px] font-mono text-gray-500 uppercase group-hover:text-white transition-colors">Narrate</span>
            </button>
            <button onClick={() => setShowRoast(true)} className="flex flex-col items-center gap-1 group">
              <span className="text-[14px] group-hover:scale-110 transition-transform">🔥</span>
              <span className="text-[7px] font-mono text-gray-500 uppercase group-hover:text-white transition-colors">Roast</span>
            </button>
            <button onClick={() => setShowHoroscope(true)} className="flex flex-col items-center gap-1 group">
              <span className="text-[14px] group-hover:scale-110 transition-transform">✨</span>
              <span className="text-[7px] font-mono text-gray-500 uppercase group-hover:text-white transition-colors">Horoscope</span>
            </button>
            <button onClick={() => setShowIdentityPanel(true)} className="flex flex-col items-center gap-1 group">
              <span className="text-[14px] group-hover:scale-110 transition-transform">⚙️</span>
              <span className="text-[7px] font-mono text-gray-500 uppercase group-hover:text-white transition-colors">Identity</span>
            </button>
            <button onClick={() => setShowDNAFingerprint(true)} className="flex flex-col items-center gap-1 group">
              <span className="text-[14px] group-hover:scale-110 transition-transform">🧬</span>
              <span className="text-[7px] font-mono text-gray-500 uppercase group-hover:text-white transition-colors">DNA</span>
            </button>
            <button onClick={() => setShowShareCard(true)} className="flex flex-col items-center gap-1 group">
              <span className="text-[14px] group-hover:scale-110 transition-transform text-space-magenta">⧉</span>
              <span className="text-[7px] font-mono text-space-magenta/60 uppercase group-hover:text-space-magenta transition-colors">Share</span>
            </button>
          </div>

          {/* Search Box (Mobile) */}
          <div className="px-3 pb-3">
            <div className="relative group">
              <input 
                type="text" 
                className="w-full bg-white/[0.05] border border-white/10 rounded-full py-2 pl-8 pr-4 font-mono text-[9px] text-white placeholder:text-gray-600 focus:outline-none focus:border-space-cyan/50 transition-all"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const input = e.currentTarget;
                    const queryInput = input.value;
                    if (!queryInput.trim() || isQuerying) return;

                    setIsQuerying(true);
                    setQueryFeedback(null);
                    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);

                    try {
                      const res = await fetch('/api/ai/query', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: queryInput, universeData: data }),
                      });
                      
                      if (!res.ok) throw new Error('Search failed');
                      
                      const json = await res.json();
                      
                      if (json.matches && json.matches.length > 0) {
                        setQueriedPlanetNames(json.matches);
                        setQueryFeedback(`${json.matches.length} matches`);
                        input.value = ''; 
                        setTimeout(() => setQueriedPlanetNames([]), 30000);
                      } else {
                        setQueryFeedback('No matches');
                      }
                    } catch (err) {
                      console.error('Search Error:', err);
                      setQueryFeedback('Error');
                    } finally {
                      setIsQuerying(false);
                      feedbackTimer.current = setTimeout(() => setQueryFeedback(null), 3000);
                    }
                  }
                }}
                placeholder="Search planets..."
              />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2">
                {isQuerying ? (
                  <div className="w-3 h-3 border-2 border-space-cyan border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
              <AnimatePresence>
                {queryFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-6 right-0 text-[7px] font-mono text-space-cyan tracking-widest bg-black/80 px-1.5 py-0.5 rounded border border-white/10"
                  >
                    {queryFeedback.toUpperCase()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── DESKTOP LAYOUT (md+) ── */}
        <div className="hidden md:block p-4 space-y-3 max-h-[calc(100vh-80px)] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
          {/* Identity */}
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0 group">
              {data.user.avatar_url && (
                <img src={data.user.avatar_url} alt={data.username}
                  className="w-12 h-12 rounded-full border-2 border-space-cyan/20 group-hover:border-space-cyan/40 transition-all duration-500 shadow-[0_0_20px_rgba(0,229,255,0.1)]" />
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-space-cyan border-2 border-[#020205] flex items-center justify-center text-[7px] text-black font-bold">✓</div>
              
              {/* Rocket Toggle Overlay (Only in Multiverse) */}
              {setCockpitMode && (
                <button 
                  onClick={() => setCockpitMode(!cockpitMode)}
                  className={`absolute -top-1 -left-1 w-6 h-6 flex items-center justify-center rounded-full text-[10px] transition-all z-20 ${
                    cockpitMode 
                      ? 'bg-space-magenta text-white shadow-[0_0_15px_rgba(255,0,110,0.6)] border border-white/20' 
                      : 'bg-black/80 border border-white/10 text-gray-400 hover:text-white hover:border-space-cyan/50'
                  }`}
                  title="Enter Starship Cockpit"
                >
                  🚀
                </button>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-orbitron font-bold text-white text-sm truncate">@{data.username}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-orbitron text-space-cyan font-bold leading-none">{data.universeScore.toLocaleString()}</span>
                <span className="text-[7px] font-mono text-gray-500 uppercase tracking-tighter">PTS SYNC</span>
              </div>
            </div>
          </div>

          {/* Desktop Controls Row */}
          <div className="flex items-center gap-2">
            <AmbientAudio />
            <div className="h-4 w-px bg-white/10 mx-1" />
            <LoginButton className="!px-3 !py-1.5 !bg-white/5 !text-[9px]" />
          </div>

          {/* Universe Bio (Desktop) */}
          {(claimData?.bio || data.claim?.bio) && (
            <div className="border border-white/5 border-l-[3px] border-l-space-gold/50 hover:border-l-space-gold transition-colors bg-white/[0.02] rounded-r-lg rounded-l-[3px] py-3 px-3 mx-0.5 mt-1">
              <p className="font-mono text-[10px] text-gray-400 italic leading-relaxed break-words">
                "{(claimData?.bio || data.claim?.bio)}"
              </p>
            </div>
          )}

          {/* Claim CTA for owners */}
          {isOwner && !isClaimed && (
            <div className="space-y-3">
              <label 
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all duration-300 group ${
                  isWeeklyDigestChecked ? 'bg-space-cyan/5 border-space-cyan/30 shadow-[0_0_15px_rgba(0,229,255,0.1)]' : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="relative">
                  <input 
                    type="checkbox" 
                    id="weekly-digest-opt-in"
                    className="peer sr-only"
                    checked={isWeeklyDigestChecked}
                    onChange={(e) => setIsWeeklyDigestChecked(e.target.checked)}
                  />
                  <div className={`w-5 h-5 border-2 rounded transition-all ${isWeeklyDigestChecked ? 'border-space-cyan bg-space-cyan/20' : 'border-white/20'}`} />
                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${isWeeklyDigestChecked ? 'opacity-100' : 'opacity-0'}`}>
                    <svg className="w-3 h-3 text-space-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  </div>
                </div>
                <div className="flex-1">
                  <p className={`text-[10px] font-orbitron font-bold transition-colors ${isWeeklyDigestChecked ? 'text-space-cyan' : 'text-white'}`}>Weekly Digest Email</p>
                  <p className="text-[8px] font-mono text-gray-500">Every Monday summary of your universe growth.</p>
                </div>
              </label>

              <AnimatePresence>
                {isWeeklyDigestChecked && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg space-y-2">
                      <p className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Delivery Address</p>
                      <input 
                        type="email"
                        value={customEmail}
                        onChange={(e) => setCustomEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full bg-black/40 border border-white/10 rounded-md py-1.5 px-3 font-mono text-[10px] text-white focus:outline-none focus:border-space-cyan/50 transition-colors"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                onClick={() => handleClaim(isWeeklyDigestChecked)}
                className="w-full bg-space-gold text-black font-orbitron font-black text-[10px] py-2.5 rounded-lg tracking-[0.2em] shadow-[0_0_20px_rgba(255,215,0,0.3)] hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] transition-all uppercase"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                CLAIM YOUR UNIVERSE
              </motion.button>
            </div>
          )}

          {/* Score & Status */}
          <div className="border-t border-white/5 pt-3 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Universe Score</span>
              <span className="text-sm font-orbitron font-bold text-space-cyan">{data.universeScore.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2 bg-space-cyan/5 border border-space-cyan/15 rounded-lg px-2.5 py-1.5">
              <div className="w-1 h-1 rounded-full bg-space-cyan animate-pulse" />
              <span className="text-[9px] font-mono text-space-cyan tracking-wider">{data.distanceLabel}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/[0.03] rounded-lg p-2 text-center">
              <p className="text-[8px] font-mono text-gray-600 uppercase tracking-widest mb-0.5">Stars</p>
              <p className="font-orbitron text-xs text-space-gold font-bold">★{data.totalStars.toLocaleString()}</p>
            </div>
            <div className="bg-white/[0.03] rounded-lg p-2 text-center">
              <p className="text-[8px] font-mono text-gray-600 uppercase tracking-widest mb-0.5">Repos</p>
              <p className="font-orbitron text-xs text-white font-bold">{data.repos.length}</p>
            </div>
          </div>

          {/* View Toggle & Customization */}
          <div className="flex items-stretch gap-2 h-10">
            <div className="flex-1 flex bg-white/5 rounded-lg p-1 border border-white/10">
              {(['repos', 'langs'] as const).map((mode) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`flex-1 py-1 rounded-md font-mono text-[9px] uppercase tracking-[0.2em] transition-all duration-300 ${
                    viewMode === mode
                      ? 'bg-space-cyan text-black font-bold shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >{mode === 'repos' ? 'REPOS' : 'LANGS'}</button>
              ))}
            </div>
            
            {isOwner && isClaimed && (
              <motion.button 
                onClick={() => setShowCustomisePanel(true)}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.1)' }}
                whileTap={{ scale: 0.98 }}
                className="px-3 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:text-space-cyan transition-colors group flex items-center justify-center"
                title="Customize Universe"
              >
                <span className="text-[14px] group-hover:rotate-90 transition-transform duration-500">⚙️</span>
              </motion.button>
            )}
          </div>



          <div className="space-y-3 pt-1">
            <p className="text-[8px] font-mono text-white/20 uppercase tracking-[0.2em] px-1 pt-2">AI Intelligence Layer</p>
            <div className="grid grid-cols-2 gap-2">
              <motion.button 
                onClick={() => setShowNarrator(true)}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 transition-colors font-orbitron text-[9px] text-white uppercase tracking-wider">
                <span className="text-xs">🎙</span> NARRATE
              </motion.button>
              <motion.button 
                onClick={() => setShowRoast(true)}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(249,115,22,0.1)' }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.03] border border-orange-500/20 transition-colors font-orbitron text-[9px] text-orange-400 uppercase tracking-wider">
                <span className="text-xs">🔥</span> ROAST ME
              </motion.button>
            </div>
            <motion.button 
              onClick={() => setShowHoroscope(true)}
              whileHover={{ scale: 1.01, backgroundColor: 'rgba(168,85,247,0.1)' }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.03] border border-purple-500/20 transition-colors font-orbitron text-[9px] text-purple-400 uppercase tracking-wider">
              <span className="text-xs">✨</span> GENERATE HOROSCOPE
            </motion.button>
            <motion.button 
              onClick={() => setShowIdentityPanel(true)}
              whileHover={{ scale: 1.01, backgroundColor: 'rgba(0,229,255,0.1)' }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.03] border border-space-cyan/20 transition-colors font-orbitron text-[9px] text-space-cyan uppercase tracking-wider">
              <span className="text-xs">⚙️</span> DIAGNOSE IDENTITY
            </motion.button>
            <motion.button 
              onClick={() => setShowDNAFingerprint(true)}
              whileHover={{ scale: 1.01, backgroundColor: 'rgba(124,58,237,0.1)' }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white/[0.03] border border-purple-500/30 transition-colors font-orbitron text-[9px] text-purple-400 uppercase tracking-wider">
              <span className="text-xs">🧬</span> MY TECH DNA
            </motion.button>

            {/* Action Buttons (Relocated) */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <motion.button 
                onClick={() => router.push('/')}
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.06)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 transition-all font-mono text-[7px] text-gray-500 hover:text-white uppercase tracking-wider">
                Exit
              </motion.button>
              <motion.button 
                onClick={() => setShowShareCard(true)}
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,0,255,0.08)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/[0.03] border border-space-magenta/30 transition-all font-mono text-[7px] text-space-magenta/70 hover:text-space-magenta uppercase tracking-wider">
                Share
              </motion.button>
              <motion.button 
                onClick={toggleHallOfGiants}
                whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,215,0,0.08)' }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/[0.03] border border-space-gold/20 transition-all font-mono text-[7px] text-space-gold/70 hover:text-space-gold uppercase tracking-wider">
                Leaderboard
              </motion.button>
            </div>
          </div>

          {/* NLQ Input */}
          <div className="pt-2">
            <div className="relative group">
              <input 
                type="text" 
                className="w-full bg-white/[0.02] border border-white/10 rounded-lg py-3 pl-10 pr-4 font-mono text-[10px] text-white placeholder:text-white/20 focus:outline-none focus:border-space-cyan/30 focus:bg-white/[0.05] transition-all"
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    const input = e.currentTarget;
                    const queryInput = input.value;
                    if (!queryInput.trim() || isQuerying) return;

                    setIsQuerying(true);
                    setQueryFeedback(null);
                    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);

                    try {
                      const res = await fetch('/api/ai/query', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ query: queryInput, universeData: data }),
                      });
                      
                      if (!res.ok) throw new Error('Search failed');
                      
                      const json = await res.json();
                      
                      if (json.matches && json.matches.length > 0) {
                        setQueriedPlanetNames(json.matches);
                        setQueryFeedback(`${json.matches.length} matches identified`);
                        input.value = ''; // Clear on success
                        
                        // Reset pulse after 30s
                        setTimeout(() => setQueriedPlanetNames([]), 30000);
                      } else {
                        setQueryFeedback('No matches found');
                      }
                    } catch (err) {
                      console.error('Search Error:', err);
                      setQueryFeedback('Signal lost');
                    } finally {
                      setIsQuerying(false);
                      feedbackTimer.current = setTimeout(() => setQueryFeedback(null), 4000);
                    }
                  }
                }}
                placeholder="Search repository..."
              />
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-2">
                {isQuerying ? (
                  <div className="w-3.5 h-3.5 border-2 border-space-cyan border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-3.5 h-3.5 text-white/20 group-focus-within:text-space-cyan transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                )}
              </div>
              <AnimatePresence>
                {queryFeedback && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute -top-8 right-0 text-[8px] font-mono text-space-cyan tracking-widest bg-[#020205]/90 px-2 py-1 rounded border border-space-cyan/20"
                  >
                    {queryFeedback.toUpperCase()}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Combined HUD Actions & Auth (Desktop) */}
          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-3 bg-white/[0.01] -mx-4 px-4 pb-1 rounded-b-xl">
            <AmbientAudio />
            <LoginButton className="!px-4 !py-2 !bg-transparent hover:!bg-white/5" />
          </div>
        </div>
      </motion.div>


      {/* ─── Bottom: Language Legend ─────────────────────────── */}
      <AnimatePresence>
        {(!isAnyPanelOpen || typeof window !== 'undefined' && window.innerWidth >= 768) && (
          <motion.div
            className="fixed bottom-3 md:bottom-4 left-3 right-3 z-40 mx-auto max-w-lg luxe-glass rounded-full overflow-hidden border border-white/10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1, duration: 0.4 }}
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
              <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-[#05050f] to-transparent pointer-events-none" />
              <div className="absolute top-0 left-0 bottom-0 w-8 bg-gradient-to-r from-[#05050f] to-transparent pointer-events-none" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
