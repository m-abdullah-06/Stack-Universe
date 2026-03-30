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
import { useUniverseStore } from '@/store'
import type { UniverseData } from '@/types'

type LoadState = 'cinematic' | 'loading' | 'ready' | 'error'

export default function UniversePage() {
  const params = useParams()
  const router = useRouter()
  const rawUsername = params?.username as string
  const username = rawUsername?.replace(/^@/, '')?.toLowerCase()

  const { setCurrentUniverse, setClaimData, claimData } = useUniverseStore()
  const [data, setData] = useState<UniverseData | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('cinematic')
  const [errorMsg, setErrorMsg] = useState('')

  // Fetch universe data in background while cinematic plays
  useEffect(() => {
    if (!username) return

    // Immediately clear previous user's claim data from global store
    setClaimData(null)

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
        console.log('Fetching claim for:', username)
        const claimJson = await claimRes.json()
        console.log('Claim data received:', claimJson)
        
        const finalData = { ...json, claim: claimJson.claim }
        console.log('Final data with claim:', !!finalData.claim)
        
        setData(finalData)
        setCurrentUniverse(finalData)
        setClaimData(claimJson.claim || null)
        console.log('Claim data set:', claimJson.claim)

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
          }),
        }).catch(console.warn)
      } catch (err: unknown) {
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error')
        setLoadState('error')
      }
    }

    fetchData()
  }, [username, setCurrentUniverse])

  const handleCinematicComplete = useCallback(() => {
    if (data) {
      setLoadState('ready')
    } else if (errorMsg) {
      setLoadState('error')
    } else {
      setLoadState('loading')
    }
  }, [data, errorMsg])

  // Once loading state is active and data arrives, switch to ready
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
      {/* Cinematic entry */}
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

      {/* Loading state (data not ready yet after cinematic) */}
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

      {/* Error state */}
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

      {/* Solar system scene */}
      {loadState === 'ready' && data && (
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <SolarSystemScene data={data} />
          <HUD data={data} />
          <UniverseIntelligencePanel data={data} visible={loadState === 'ready'} />
          <RepoSummaryHUD />
          <NarratorPanel data={data} />
          <RoastPanel data={data} />
          <HoroscopePanel data={data} />
          <CustomisePanel data={data} />
          <HallOfGiants />
          <ShareCard data={data} />
        </motion.div>
      )}

      {/* Scanline grid overlay */}
      <div className="absolute inset-0 grid-overlay pointer-events-none opacity-30" />
    </div>
  )
}
