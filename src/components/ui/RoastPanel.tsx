'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUniverseStore } from '@/store'
import type { UniverseData } from '@/types'

interface RoastPanelProps {
  data: UniverseData
}

export function RoastPanel({ data }: RoastPanelProps) {
  const setActivePanel = useUniverseStore(s => s.setActivePanel)
  const [roast, setRoast] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchRoast = useCallback(async () => {
    setLoading(true)
    setRoast('')
    setError('')
    try {
      const res = await fetch('/api/ai/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      const json = await res.json()
      if (json.roast && json.roast.trim().length > 0) {
        setRoast(json.roast)
      } else {
        setError('AI returned an empty response. Please try again.')
      }
    } catch (err) {
      console.error('Roast Error:', err)
      setError('Failed to connect to AI. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [data])

  useEffect(() => {
    fetchRoast()
    return () => {
      setRoast('')
      setError('')
    }
  }, [fetchRoast])

  const handleShare = () => {
    const shareText = `🔥 My Universe Just Got Roasted: "${roast}"\n\nExperience the burn: ${window.location.href}`
    navigator.clipboard.writeText(shareText)
    alert('Roast copied to clipboard!')
  }

  return (
    <motion.div
      className="fixed inset-0 z-[400] flex items-end md:items-center justify-center p-0 md:p-6 bg-red-950/20 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: 'none' }}
      onClick={(e) => { if (e.target === e.currentTarget) setActivePanel(null) }}
    >
      <motion.div
        className="w-full max-w-xl max-h-[85vh] overflow-y-auto bg-black/90 backdrop-blur-2xl border-2 border-orange-500/50 rounded-t-3xl md:rounded-3xl p-5 md:p-8 shadow-[0_0_80px_rgba(249,115,22,0.3)] relative overflow-x-hidden"
        initial={{ scale: 0.9, rotateX: 20 }}
        animate={{ scale: 1, rotateX: 0 }}
        exit={{ scale: 0.9, rotateX: 20, opacity: 0, pointerEvents: 'none' }}
      >
        {/* Warning stripes */}
        <div className="absolute top-0 left-0 w-full h-1.5 flex">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className={`flex-1 h-full ${i % 2 === 0 ? 'bg-orange-500' : 'bg-black'}`} />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="mb-8 mt-2">
            <div className="flex items-center justify-center gap-3 mb-1">
              <span className="text-xl">🔥</span>
              <span className="font-orbitron font-black text-sm tracking-[0.3em] text-orange-500 uppercase">
                SYSTEM ROAST ACTIVE
              </span>
              <span className="text-xl">🔥</span>
            </div>
            <div className="font-mono text-[9px] text-orange-500/50 tracking-widest uppercase">
              Nuclear Meltdown // {data.username}
            </div>
          </div>

          <div className="min-h-[140px] flex items-center justify-center px-4">
            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-4 border-orange-500/20" />
                  <div className="absolute inset-0 rounded-full border-t-4 border-orange-500 animate-spin" />
                </div>
                <span className="font-mono text-[10px] text-orange-400 tracking-widest uppercase animate-pulse">
                  Analyzing failures...
                </span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-4">
                <span className="font-mono text-[10px] text-red-400 tracking-widest">{error}</span>
                <button onClick={fetchRoast} className="font-mono text-[10px] text-orange-400 hover:text-white transition-colors tracking-widest uppercase">
                  ↻ Retry
                </button>
              </div>
            ) : roast ? (
              <motion.p
                className="font-orbitron text-xl text-white leading-relaxed tracking-wide italic"
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
              >
                &ldquo;{roast}&rdquo;
              </motion.p>
            ) : null}
          </div>

          <div className="mt-10 flex gap-4 w-full justify-center">
            {roast && (
              <button
                onClick={handleShare}
                className="px-8 py-3 rounded-full bg-orange-600 text-white font-orbitron font-bold text-[10px] tracking-widest hover:bg-orange-500 transition-all uppercase shadow-[0_0_30px_rgba(249,115,22,0.4)]"
              >
                Share the Burn
              </button>
            )}
            <button
              onClick={() => setActivePanel(null)}
              className="px-8 py-3 rounded-full border border-orange-500/20 text-orange-500/70 font-orbitron font-bold text-[10px] tracking-widest hover:text-white hover:border-orange-500/50 transition-all uppercase"
            >
              Exit
            </button>
          </div>
        </div>
        
        {/* Animated heat distortions */}
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-orange-600/10 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-red-600/10 blur-[100px] rounded-full animate-pulse" />
      </motion.div>
    </motion.div>
  )
}
