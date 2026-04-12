'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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
import { useUniverseStore, getStoreId } from '@/store'
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

  // HARD VERSIONING TO BYPASS STALE CHUNKS
  const VERSION = "V_PROBE_CENTER_3";

  // RENDER ALERT - ONLY IN CLIENT
  useEffect(() => {
    if (activePanel === 'analytics') {
      console.log('[PAGE] ANALYTICS ACTIVE SIGNAL RECEIVED');
      window.alert(`[PAGE ALERT] Signal Received! activePanel is: ${activePanel}`);
    }
  }, [activePanel]);

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
    if (data) setLoadState('ready')
    else if (errorMsg) setLoadState('error')
    else setLoadState('loading')
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
      
      {/* 
        NEW CENTERED STATE PROBE - IMPOSSIBLE TO MISS
      */}
      <div 
        id="CENTER_PROBE"
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: activePanel === 'analytics' ? '#ff00ff' : '#00ff00',
          color: 'black',
          padding: '10px',
          zIndex: 1000000,
          fontSize: '12px',
          fontWeight: 'bold',
          border: '4px solid white',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)'
        }}
      >
        <div>VER: {VERSION}</div>
        <div>PANEL: {activePanel || 'NONE'}</div>
        <div>STORE: {getStoreId()}</div>
      </div>

      <button
        onClick={() => {
            window.alert("FORCE CLICK");
            useUniverseStore.getState().setActivePanel('analytics');
        }}
        style={{
            position: 'fixed',
            top: '100px',
            right: '20px',
            zIndex: 1000001,
            padding: '10px',
            background: 'red',
            color: 'white',
            border: '2px solid white',
            cursor: 'pointer'
        }}
      >
        FORCE (ID: {getStoreId()})
      </button>

      {/* DASHBOARD AT THE ABSOLUTE DOM TOP */}
      {data && (
        <AnalyticsDashboard data={data} visible={activePanel === 'analytics'} />
      )}

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
            LOADING...
          </p>
        </div>
      )}

      {loadState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
          <p className="text-red-500">{errorMsg}</p>
        </div>
      )}

      {loadState === 'ready' && data && (
        <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <SolarSystemScene data={data} />
          <HUD data={data} />
          <SpaceshipPresence room={username.toLowerCase()} currentUser={session?.user?.name || null} />
          <UniverseIntelligencePanel data={data} visible={loadState === 'ready'} />
          <RepoSummaryHUD />
          
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
      <AnimatePresence>{showAuthGate && status === 'unauthenticated' && <AuthGate />}</AnimatePresence>
    </div>
  )
}
