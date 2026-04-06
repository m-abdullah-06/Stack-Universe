'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { signIn, useSession } from 'next-auth/react'

export function WelcomeAuthPopup() {
  const { data: session, status } = useSession()
  const [isVisible, setIsVisible] = useState(false)
  const [hasDismissed, setHasDismissed] = useState(false)

  useEffect(() => {
    // Show after 3 seconds if not logged in and not dismissed
    if (status === 'unauthenticated' && !hasDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 3000)
      return () => clearTimeout(timer)
    }
  }, [status, hasDismissed])

  if (status !== 'unauthenticated' || !isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
        className="fixed bottom-8 left-8 z-[150] w-[320px] bg-black/80 backdrop-blur-2xl border border-white/10 p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        {/* Animated Background Pulse */}
        <motion.div 
          className="absolute -top-10 -right-10 w-32 h-32 bg-space-cyan/10 blur-[40px] rounded-full"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛰️</span>
              <span className="font-orbitron text-[10px] text-space-cyan tracking-[0.2em] font-black uppercase">
                Incoming Signal
              </span>
            </div>
            <button 
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-white transition-colors text-xs"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2">
            <h3 className="font-orbitron text-sm text-white font-bold tracking-wider leading-tight">
              CONNECT YOUR GITHUB ID
            </h3>
            <p className="font-mono text-[10px] text-gray-400 leading-relaxed">
              Authorize connection to claim your personal universe and unlock AI intelligence layers.
            </p>
          </div>

          <button
            onClick={() => signIn('github')}
            className="w-full py-3 bg-white text-black font-orbitron font-black text-[9px] rounded-xl tracking-[0.2em] hover:bg-space-cyan transition-all uppercase shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            ESTABLISH CONNECTION
          </button>
          
          <p className="font-mono text-[8px] text-center text-gray-600 tracking-tighter uppercase">
            [ SECURE OAUTH 2.0 PROTOCOL ]
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
