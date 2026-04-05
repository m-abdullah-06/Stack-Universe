'use client'

import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'

export function AuthGate() {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-[100px] pointer-events-auto selection:bg-space-cyan/30">
      {/* Dynamic Background Scanning Line */}
      <motion.div
        className="absolute w-full h-1 bg-space-cyan/20 blur-[2px] z-0"
        animate={{ top: ['0%', '100%', '0%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />

      <motion.div
        className="relative w-full max-w-md p-8 md:p-12 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Hexagonal Pattern - Simple CSS-based */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #00e5ff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative space-y-8">
          <div className="flex justify-center">
             <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center rotate-45 group">
                <span className="text-3xl -rotate-45 group-hover:scale-110 transition-transform">🛰️</span>
             </div>
          </div>

          <div className="space-y-3">
            <h2 className="font-orbitron font-black text-2xl md:text-3xl text-white tracking-[0.2em] uppercase">
              SECURE SECTOR
            </h2>
            <div className="h-px w-32 bg-gradient-to-r from-transparent via-space-cyan to-transparent mx-auto" />
            <p className="font-mono text-[10px] md:text-xs text-gray-500 tracking-widest leading-relaxed uppercase">
              [ AUTHENTICATION REQUIRED ]<br />
              ESTABLISH INTERSTELLAR IDENTITY TO ACCESS THIS DIMENSION
            </p>
          </div>

          <button
            onClick={() => signIn('github')}
            className="w-full bg-white text-black font-orbitron font-black text-xs py-4 rounded-xl tracking-[0.3em] shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:shadow-[0_0_60px_rgba(0,229,255,0.4)] hover:bg-space-cyan hover:scale-[1.02] transition-all duration-500 uppercase"
          >
            CONNECT GITHUB ID
          </button>

          <div className="flex justify-center gap-6 pt-4">
             <div className="flex flex-col items-center">
                 <span className="font-mono text-[8px] text-gray-700 uppercase">PROTOCOL</span>
                 <span className="font-mono text-[9px] text-space-cyan">OAUTH_2.0</span>
             </div>
             <div className="w-px h-6 bg-white/5" />
             <div className="flex flex-col items-center">
                 <span className="font-mono text-[8px] text-gray-700 uppercase">ENCRYPTION</span>
                 <span className="font-mono text-[9px] text-space-gold">AES_256</span>
             </div>
          </div>
        </div>
      </motion.div>
      
      {/* Status Footer */}
      <div className="absolute bottom-10 left-0 right-0 text-center font-mono text-[8px] text-gray-800 tracking-[0.5em] uppercase pointer-events-none">
        Waiting for terminal signal...
      </div>
    </div>
  )
}
