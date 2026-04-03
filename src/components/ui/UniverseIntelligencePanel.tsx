'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { UniverseData } from '@/types'

interface UniverseIntelligencePanelProps {
  data: UniverseData
  visible: boolean
}

export function UniverseIntelligencePanel({ data, visible }: UniverseIntelligencePanelProps) {
  const [observations, setObservations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [manualKeep, setManualKeep] = useState(false)

  useEffect(() => {
    if (visible && !dismissed) {
      // Trigger scan after a short delay once visible (cinematic done)
      const timer = setTimeout(() => {
        fetchObservations()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [visible, dismissed])

  const fetchObservations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data }),
      })
      const json = await res.json()
      if (json.observations) {
        setObservations(json.observations)
        setShow(true)
        
        // Auto-dismiss after 10s if not manually kept
        setTimeout(() => {
          if (!manualKeep) {
            setShow(false)
          }
        }, 10000)
      }
    } catch (err) {
      console.error('Failed to fetch AI observations:', err)
    } finally {
      setLoading(false)
    }
  }

  if (dismissed) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed top-60 md:top-24 right-4 md:right-6 z-[100] w-[min(280px,85vw)] md:w-80 cursor-pointer group"
          initial={{ opacity: 0, x: 20, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          exit={{ opacity: 0, x: 20, scale: 0.95 }}
          onClick={() => setManualKeep(true)}
        >
          <div className="relative bg-black/60 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-space-cyan animate-pulse" />
                <span className="font-orbitron font-bold text-[10px] tracking-widest text-space-cyan uppercase">
                  UNIVERSE INTELLIGENCE
                </span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setShow(false)
                  setDismissed(true)
                }}
                className="text-gray-500 hover:text-white transition-colors"
                title="Close"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l18 18" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              {observations.map((obs, i) => (
                <div key={i} className="flex gap-3 group/item">
                  <div className="mt-1.5 w-1 h-1 rounded-full bg-space-cyan opacity-40 group-hover/item:opacity-100 transition-opacity flex-shrink-0" />
                  <p className="font-mono text-[10px] text-gray-400 group-hover/item:text-white transition-colors leading-relaxed">
                    {obs.replace(/^[•\-\d.]\s*/, '')}
                  </p>
                </div>
              ))}
            </div>

            {/* Footer progress bar (auto-dismiss indicator) */}
            {!manualKeep && (
              <motion.div 
                className="h-0.5 bg-space-cyan/30"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 10, ease: "linear" }}
              />
            )}
            
            {/* Manual keep indicator */}
            {manualKeep && (
              <div className="px-4 py-1 text-[8px] font-mono text-gray-600 bg-white/[0.01] border-t border-white/5">
                PERSISTENT MODE ACTIVE
              </div>
            )}
          </div>
          
          {/* Subtle glow */}
          <div className="absolute inset-0 -z-10 bg-space-cyan/5 blur-2xl rounded-xl" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
