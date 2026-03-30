'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUniverseStore } from '@/store'
import type { UniverseData } from '@/types'

interface NarratorPanelProps {
  data: UniverseData
}

export function NarratorPanel({ data }: NarratorPanelProps) {
  const { showNarrator, setShowNarrator } = useUniverseStore()
  const [displayWords, setDisplayWords] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [complete, setComplete] = useState(false)
  const [error, setError] = useState('')

  const fetchNarrative = useCallback(async () => {
    setLoading(true)
    setError('')
    setDisplayWords([])
    setComplete(false)
    try {
      const res = await fetch('/api/ai/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      const json = await res.json()
      if (json.monologue && json.monologue.trim().length > 0) {
        streamText(json.monologue)
      } else {
        setError('AI returned an empty response. Please try again.')
      }
    } catch (err) {
      console.error('Narrator Error:', err)
      setError('Failed to connect to AI. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [data])

  const streamText = (text: string) => {
    const words = text.split(' ')
    let current = 0
    const interval = setInterval(() => {
      setDisplayWords(prev => [...prev, words[current]])
      current++
      if (current >= words.length) {
        clearInterval(interval)
        setComplete(true)
      }
    }, 150)
  }

  useEffect(() => {
    if (showNarrator) {
      fetchNarrative()
    } else {
      setDisplayWords([])
      setComplete(false)
      setError('')
    }
  }, [showNarrator, fetchNarrative])

  const handleShare = () => {
    const text = displayWords.join(' ')
    const shareText = `${text}\n\nExplore this universe at: ${window.location.href}`
    navigator.clipboard.writeText(shareText)
    alert('Narration copied to clipboard!')
  }

  return (
    <AnimatePresence>
      {showNarrator && (
        <motion.div
          className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-6 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowNarrator(false) }}
        >
          <motion.div
            className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-black/80 backdrop-blur-2xl border border-white/10 rounded-t-3xl md:rounded-3xl p-5 md:p-8 shadow-[0_0_100px_rgba(0,0,0,0.8)] relative overflow-x-hidden"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Decorative background grid */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="mb-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="w-12 h-px bg-gradient-to-r from-transparent to-space-cyan" />
                  <span className="font-orbitron font-black text-xs tracking-[0.4em] text-space-cyan uppercase">
                    UNIVERSE NARRATION
                  </span>
                  <div className="w-12 h-px bg-gradient-to-l from-transparent to-space-cyan" />
                </div>
                <div className="font-mono text-[10px] text-gray-600 tracking-widest uppercase">
                  Interstellar Log // {data.username}
                </div>
              </div>

              <div className="min-h-[160px] flex items-center justify-center px-4">
                {loading ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 rounded-full border-t-2 border-space-cyan animate-spin" />
                    <span className="font-mono text-[10px] text-gray-500 tracking-widest uppercase animate-pulse">
                      Synthesizing reality...
                    </span>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center gap-4">
                    <span className="font-mono text-[10px] text-red-400 tracking-widest">{error}</span>
                    <button onClick={fetchNarrative} className="font-mono text-[10px] text-space-cyan hover:text-white transition-colors tracking-widest uppercase">
                      ↻ Retry
                    </button>
                  </div>
                ) : (
                  <p className="font-orbitron text-base md:text-xl lg:text-2xl text-white leading-relaxed tracking-wide italic">
                    {displayWords.map((word, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 1.1, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                        transition={{ duration: 0.5 }}
                        className="inline-block mr-[0.25em]"
                      >
                        {word}
                      </motion.span>
                    ))}
                  </p>
                )}
              </div>

              <div className="mt-12 flex gap-4">
                {complete && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={handleShare}
                    className="px-8 py-3 rounded-full bg-space-cyan text-black font-orbitron font-bold text-[10px] tracking-widest hover:shadow-[0_0_30px_rgba(0,229,255,0.4)] transition-all uppercase"
                  >
                    Share My Story
                  </motion.button>
                )}
                <button
                  onClick={() => setShowNarrator(false)}
                  className="px-8 py-3 rounded-full border border-white/10 text-gray-400 font-orbitron font-bold text-[10px] tracking-widest hover:text-white hover:border-white/30 transition-all uppercase"
                >
                  Close
                </button>
              </div>
            </div>
            
            {/* Animated accent corner */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-space-cyan/5 blur-3xl rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-space-magenta/5 blur-3xl rounded-full -ml-16 -mb-16" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
