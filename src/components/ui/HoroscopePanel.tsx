'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUniverseStore } from '@/store'
import type { UniverseData } from '@/types'

interface HoroscopePanelProps {
  data: UniverseData
}

export function HoroscopePanel({ data }: HoroscopePanelProps) {
  const { showHoroscope, setShowHoroscope } = useUniverseStore()
  const [horoscope, setHoroscope] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchHoroscope = useCallback(async () => {
    setLoading(true)
    setHoroscope('')
    setError('')
    try {
      const res = await fetch('/api/ai/horoscope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      const json = await res.json()
      if (json.horoscope && json.horoscope.trim().length > 0) {
        setHoroscope(json.horoscope)
      } else {
        setError('AI returned an empty response. Please try again.')
      }
    } catch (err) {
      console.error('Horoscope Error:', err)
      setError('Failed to connect to AI. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [data])

  useEffect(() => {
    fetchHoroscope()
    return () => {
      setHoroscope('')
      setError('')
    }
  }, [fetchHoroscope])

  const handleShare = () => {
    const shareText = `✨ My Weekly Tech Horoscope: "${horoscope}"\n\nSee your future: ${window.location.href}`
    navigator.clipboard.writeText(shareText)
    alert('Horoscope copied to clipboard!')
  }

  return (
    <motion.div
      className="fixed inset-0 z-[400] flex items-end md:items-center justify-center p-0 md:p-6 bg-purple-950/10 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) setShowHoroscope(false) }}
    >
      <motion.div
        className="w-full max-w-xl max-h-[85vh] overflow-y-auto bg-black/90 backdrop-blur-2xl border border-purple-500/30 rounded-t-3xl md:rounded-3xl p-6 md:p-10 shadow-[0_0_100px_rgba(168,85,247,0.2)] relative overflow-x-hidden text-center"
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
      >
        {/* Cosmic background particles */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
          {Array.from({ length: 40 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full border border-purple-500/50 flex items-center justify-center text-purple-400">✨</div>
              <span className="font-orbitron font-black text-xs tracking-[0.4em] text-purple-400 uppercase">
                STACK HOROSCOPE
              </span>
              <div className="w-8 h-8 rounded-full border border-purple-500/50 flex items-center justify-center text-purple-400 text-xs rotate-180">✨</div>
            </div>
            <div className="font-mono text-[9px] text-gray-500 tracking-[0.2em] uppercase">
              Weekly Cosmic Forecast // {data.username}
            </div>
          </div>

          <div className="min-h-[160px] flex items-center justify-center px-6">
            {loading ? (
              <div className="flex flex-col items-center gap-5">
                <div className="w-10 h-10 border-2 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                <span className="font-mono text-[10px] text-purple-400/60 tracking-widest uppercase italic">
                  Consulting the celestial servers...
                </span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-4">
                <span className="font-mono text-[10px] text-red-400 tracking-widest">{error}</span>
                <button onClick={fetchHoroscope} className="font-mono text-[10px] text-purple-400 hover:text-white transition-colors tracking-widest uppercase">
                  ↻ Retry
                </button>
              </div>
            ) : horoscope ? (
              <motion.p
                className="font-orbitron text-lg md:text-xl text-white leading-relaxed tracking-wide italic"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
              >
                &ldquo;{horoscope}&rdquo;
              </motion.p>
            ) : null}
          </div>

          <div className="mt-12 flex gap-4 w-full justify-center">
            {horoscope && (
              <button
                onClick={handleShare}
                disabled={loading}
                className="px-10 py-3 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-orbitron font-bold text-[10px] tracking-widest hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] transition-all uppercase"
              >
                Share My Future
              </button>
            )}
            <button
              onClick={() => setShowHoroscope(false)}
              className="px-8 py-3 rounded-full border border-purple-500/20 text-gray-500 font-orbitron font-bold text-[10px] tracking-widest hover:text-white hover:border-purple-500/50 transition-all uppercase"
            >
              Close
            </button>
          </div>
        </div>
        
        {/* Mystical glow */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-purple-600/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" />
      </motion.div>
    </motion.div>
  )
}
