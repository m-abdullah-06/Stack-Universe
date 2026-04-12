'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { SolarSystemScene } from '@/components/solar-system/SolarSystemScene'
import { EntryCinematic } from '@/components/cinematic/EntryCinematic'
import { HUD } from '@/components/ui/HUD'
import { CustomisePanel } from '@/components/ui/CustomisePanel'
import { HallOfGiants } from '@/components/ui/HallOfGiants'
import { ShareCard } from '@/components/ui/ShareCard'
import { UniverseIntelligencePanel } from '@/components/ui/UniverseIntelligencePanel'
import { RepoSummaryHUD } from '@/components/ui/RepoSummaryHUD'
import { NarratorPanel } from '@/components/ui/NarratorPanel'
import { RoastPanel } from '@/components/ui/RoastPanel'
import { HoroscopePanel } from '@/components/ui/HoroscopePanel'
import { IdentityPanel } from '@/components/ui/IdentityPanel'
import { DNAFingerprint } from '@/components/ui/DNAFingerprint'
import { AnalyticsDashboard } from '@/components/ui/AnalyticsDashboard'
import { AuthGate } from '@/components/ui/AuthGate'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useUniverseStore } from '@/store'
import { useSession } from 'next-auth/react'
import { SpaceshipPresence } from '@/components/multiplayer/SpaceshipPresence'
import type { UniverseData } from '@/types'

type LoadState = 'cinematic' | 'loading' | 'ready' | 'error'

export default function UniversePage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const router = useRouter()
  const rawUsername = params?.username as string
  const username = rawUsername?.replace(/^@/, '')?.toLowerCase()

  const setCurrentUniverse = useUniverseStore(s => s.setCurrentUniverse)
  const setClaimData = useUniverseStore(s => s.setClaimData)
  const closeAllPanels = useUniverseStore(s => s.closeAllPanels)
  const claimData = useUniverseStore(s => s.claimData)
  const activePanel = useUniverseStore(s => s.activePanel)
  const showAuthGate = useUniverseStore(s => s.showAuthGate)
  const setShowAuthGate = useUniverseStore(s => s.setShowAuthGate)
  
  const [data, setData] = useState<UniverseData | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('cinematic')
  const [errorMsg, setErrorMsg] = useState('')

  const loggedInLogin = (session?.user as any)?.login || session?.user?.name

  // RENDER PROBE
  console.log('[PAGE] RENDER CHECK:', { activePanel, loadReady: !!data, status });

  // Dedicated immediate reset effect
  useEffect(() => {
    closeAllPanels()
    setClaimData(null)
    setShowAuthGate(false) // Reset gate on new page load
  }, [username, closeAllPanels, setClaimData, setShowAuthGate])

  // Data fetching effect
  useEffect(() => {
    if (!username) return

    const fetchData = async () => {
      try {
        const [res, claimRes] = await Promise.all([
          fetch(`/api/github/${username}`),
          fetch(`/api/claim/${username}`, { cache: 'no-store' })
        ])

        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error || 'Failed to fetch')
        }

        const json: UniverseData = await res.json()
        const claimJson = await claimRes.json()
        
        const finalData = { ...json, claim: claimJson.claim }
        
        setData(finalData)
        setCurrentUniverse(finalData)
        setClaimData(claimJson.claim || null)

        // Store in Supabase (background)
        fetch('/api/universes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: json.username,
            universe_score: json.universeScore,
            total_stars: json.totalStars,
            total_repos: json.repos.length,
            language_count: json.languages.length,
            account_age_years: json.accountAgeYears,
            visitor_username: loggedInLogin || undefined, 
            top_languages: json.languages.slice(0, 5).map((l: any) => l.name),
          }),
        }).catch(console.warn)
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
        setLoadState('error')
      }
    }

    fetchData()
  }, [username, setCurrentUniverse, loggedInLogin])

  const handleCinematicComplete = useCallback(() => {
    if (data) {
      setLoadState('ready')
    } else if (errorMsg) {
      setLoadState('error')
    } else {
      setLoadState('loading')
    }
  }, [data, errorMsg])

  useEffect(() => {
    if (loadState === 'loading' && data) {
      setLoadState('ready')
    }
  }, [loadState, data])

  if (!username) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="font-mono text-space-magenta">Invalid username</p>
      </div>
    )
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-space-black">
      {/* STATE PROBE */}
      <div 
        id="STATE_PROBE"
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 255, 0, 0.8)',
          color: 'black',
          padding: '4px 20px',
          zIndex: 99999999,
          fontSize: '10px',
          fontFamily: 'monospace',
          fontWeight: 'bold',
          pointerEvents: 'none',
          borderRadius: '0 0 10px 10px',
          display: 'flex',
          gap: '15px'
        }}
      >
        <span>ACTIVE_PANEL: {activePanel || 'null'}</span>
        <span>STATUS: {status}</span>
        <span>DATA: {data ? 'LOADED' : 'MISSING'}</span>
        <span>LOAD_STATE: {loadState}</span>
      </div>

      <AnimatePresence>
        {loadState === 'cinematic' && (
          <EntryCinematic
            username={username}
            lightYears={data?.lightYears ?? 25_000_000_000}
            distanceLabel={data?.distanceLabel ?? 'Deep space'}
            claimData={claimData || data?.claim}
            onComplete={handleCinematicComplete}
          />
        )}
      </AnimatePresence>

      {loadState === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-20">
          <motion.div
            className="w-16 h-16 rounded-full border border-space-cyan/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            style={{ borderTopColor: '#00e5ff' }}
          />
          <p className="font-mono text-xs text-space-cyan/60 tracking-widest">
            ASSEMBLING UNIVERSE DATA...
          </p>
        </div>
      )}

      {loadState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 z-20">
          <div className="hud-panel relative rounded p-8 max-w-md text-center">
            <p className="font-orbitron text-space-magenta text-glow-magenta text-xl mb-2">
              UNIVERSE NOT FOUND
            </p>
            <p className="font-mono text-xs text-gray-500 mb-4">
              @{username} does not appear to exist in this dimension.
            </p>
            <p className="font-mono text-xs text-gray-700 mb-6">{errorMsg}</p>
            <button
              onClick={() => router.push('/')}
              className="font-mono text-xs text-space-cyan hover:text-white transition-colors tracking-widest"
            >
              ← RETURN TO MULTIVERSE
            </button>
          </div>
        </div>
      )}

      {loadState === 'ready' && data && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <SolarSystemScene data={data} />
          <HUD data={data} />
          <SpaceshipPresence room={username.toLowerCase()} currentUser={session?.user?.name || null} />
          <UniverseIntelligencePanel data={data} visible={loadState === 'ready'} />
          <RepoSummaryHUD />
          
          {/* Always mounted diagnostic dashboard */}
          <AnalyticsDashboard data={data} visible={activePanel === 'analytics'} />

          <AnimatePresence>
            {activePanel === 'narrator' && <NarratorPanel data={data} />}
            {activePanel === 'roast' && <RoastPanel data={data} />}
            {activePanel === 'horoscope' && <HoroscopePanel data={data} />}
            {activePanel === 'customise' && <CustomisePanel data={data} />}
            {activePanel === 'giants' && <HallOfGiants />}
            {activePanel === 'share' && <ShareCard data={data} />}
            {activePanel === 'identity' && <IdentityPanel data={data} />}
            {activePanel === 'dna' && <DNAFingerprint data={data} />}
          </AnimatePresence>
        </motion.div>
      )}

      <div className="absolute inset-0 grid-overlay pointer-events-none opacity-30" />

      <AnimatePresence>
        {showAuthGate && status === 'unauthenticated' && (
          <AuthGate />
        )}
      </AnimatePresence>
    </div>
  )
}
