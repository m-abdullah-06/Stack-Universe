'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function UniverseError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[UniverseError]', error)
  }, [error])

  return (
    <main className="w-screen h-screen bg-[#000008] flex flex-col items-center justify-center gap-6 relative overflow-hidden">

      {/* Scanline overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px)',
        }}
      />

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-red-900/40" />
      <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-red-900/40" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-red-900/40" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-red-900/40" />

      <motion.div
        className="text-center z-10 max-w-md px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p
          className="font-mono text-xs tracking-widest mb-3"
          style={{ color: 'rgba(255,50,50,0.6)' }}
        >
          CRITICAL SYSTEM FAILURE // UNIVERSE COLLAPSED
        </p>

        <h1
          className="font-['Orbitron',monospace] font-black text-3xl mb-3"
          style={{
            color: '#ff3232',
            textShadow: '0 0 10px #ff323280',
          }}
        >
          SUPERNOVA EVENT
        </h1>

        <p className="font-mono text-sm text-gray-600 mb-2 leading-relaxed">
          An unexpected gravitational collapse occurred while rendering this universe.
        </p>

        {error.message && (
          <p
            className="font-mono text-xs mb-6 px-3 py-2 rounded"
            style={{
              color: 'rgba(255,80,80,0.7)',
              background: 'rgba(255,0,0,0.05)',
              border: '1px solid rgba(255,0,0,0.1)',
            }}
          >
            {error.message}
          </p>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 font-mono text-xs tracking-wider rounded transition-all"
            style={{
              color: '#ff3232',
              border: '1px solid rgba(255,50,50,0.3)',
              background: 'rgba(255,50,50,0.05)',
            }}
          >
            ↺ RETRY
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 font-mono text-xs tracking-wider rounded transition-all"
            style={{
              color: 'rgba(0,229,255,0.7)',
              border: '1px solid rgba(0,229,255,0.2)',
              background: 'rgba(0,229,255,0.05)',
            }}
          >
            ← MULTIVERSE
          </Link>
        </div>
      </motion.div>
    </main>
  )
}
