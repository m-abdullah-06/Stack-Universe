'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { MultiverseMap } from '@/components/multiverse/MultiverseMap'
import { DiscoveryTicker } from '@/components/ui/DiscoveryTicker'
import { AuthGate } from '@/components/ui/AuthGate'
import { useUniverseStore } from '@/store'
import { useSession } from 'next-auth/react'
import { AnimatePresence } from 'framer-motion'
import type { StoredUniverse } from '@/types'

export default function MultiversePage() {
  const [universes, setUniverses] = useState<StoredUniverse[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { status } = useSession()
  const showAuthGate = useUniverseStore(s => s.showAuthGate)
  const setShowAuthGate = useUniverseStore(s => s.setShowAuthGate)

  useEffect(() => {
    setShowAuthGate(false) // Reset on load
    fetch('/api/universes')
      .then((r) => r.json())
      .then((data) => {
        setUniverses(data.universes || [])
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#050510]">
      {/* 2D Canvas Map */}
      <MultiverseMap universes={universes} />

      {/* UI Overlay */}
      <div className="absolute inset-x-0 top-0 z-10 p-8 flex justify-between items-start pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="pointer-events-auto"
        >
          <button 
            onClick={() => router.push('/')}
            className="group flex flex-col gap-1 items-start"
          >
            <span className="font-orbitron font-black text-xl text-white tracking-widest group-hover:text-space-cyan transition-colors">
              STACK<span className="text-space-cyan">UNIVERSE</span>
            </span>
            <span className="font-mono text-[8px] text-gray-500 tracking-[0.3em] uppercase">
              ← RETURN TO SECTOR 0
            </span>
          </button>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-right pointer-events-auto"
        >
          <h2 className="font-orbitron font-bold text-sm text-space-gold tracking-widest uppercase">
            Multiverse Map
          </h2>
          <p className="font-mono text-[9px] text-gray-600 mt-1">
            {universes.length} ARCHITECTS DETECTED
          </p>
        </motion.div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border border-space-cyan/30 border-t-space-cyan animate-spin" />
            <p className="font-mono text-[10px] text-space-cyan tracking-[0.2em] animate-pulse">SYNCHRONIZING MAP DATA...</p>
          </div>
        </div>
      )}

      {/* Legend / Hover Details UI will be inside MultiverseMap or as an overlay */}
      
      <DiscoveryTicker />

      {/* Auth Gate (Uncloseable Login) */}
      <AnimatePresence>
        {showAuthGate && status === 'unauthenticated' && (
          <AuthGate />
        )}
      </AnimatePresence>
    </main>
  )
}
