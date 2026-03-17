'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

export default function NotFound() {
  const [glitch, setGlitch] = useState(false)

  useEffect(() => {
    const id = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 150)
    }, 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <main className="w-screen h-screen bg-space-black grid-overlay flex flex-col items-center justify-center gap-8 relative overflow-hidden">

      {/* Background star field */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 120 }, (_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 2 + 0.5}px`,
              height: `${Math.random() * 2 + 0.5}px`,
              opacity: Math.random() * 0.6 + 0.1,
            }}
          />
        ))}
      </div>

      {/* Corner decorations */}
      <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-space-cyan/20" />
      <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-space-cyan/20" />
      <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-space-cyan/20" />
      <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-space-cyan/20" />

      {/* 404 display */}
      <motion.div
        className="text-center relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <p className="font-mono text-xs text-space-cyan/40 tracking-widest mb-2">
          ERROR CODE: 404 // UNIVERSE NOT FOUND
        </p>

        <div className="relative">
          <h1
            className="font-orbitron font-black text-8xl text-space-cyan text-glow-cyan select-none"
            style={{
              transform: glitch
                ? `translate(${Math.random() * 6 - 3}px, ${Math.random() * 4 - 2}px)`
                : 'none',
              transition: glitch ? 'none' : 'transform 0.1s',
            }}
          >
            404
          </h1>

          {/* Glitch layers */}
          {glitch && (
            <>
              <h1
                className="font-orbitron font-black text-8xl absolute inset-0 select-none"
                style={{
                  color: '#ff006e',
                  opacity: 0.6,
                  transform: 'translate(3px, -2px)',
                  clipPath: 'inset(30% 0 40% 0)',
                }}
              >
                404
              </h1>
              <h1
                className="font-orbitron font-black text-8xl absolute inset-0 select-none"
                style={{
                  color: '#00e5ff',
                  opacity: 0.4,
                  transform: 'translate(-3px, 2px)',
                  clipPath: 'inset(60% 0 10% 0)',
                }}
              >
                404
              </h1>
            </>
          )}
        </div>

        <p className="font-orbitron text-xl text-white mt-4 mb-2">
          UNIVERSE DOES NOT EXIST
        </p>
        <p className="font-mono text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
          The coordinates you entered lead to empty space.
          <br />
          This username may not exist in our multiverse.
        </p>
      </motion.div>

      {/* Animated scan line */}
      <motion.div
        className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-space-magenta/60 to-transparent pointer-events-none"
        animate={{ top: ['0%', '100%'] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
      />

      {/* Actions */}
      <motion.div
        className="flex gap-4 z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Link
          href="/"
          className="hud-panel rounded px-6 py-3 font-mono text-xs text-space-cyan hover:bg-space-cyan/10 transition-all tracking-widest"
        >
          ← RETURN TO MULTIVERSE
        </Link>
      </motion.div>

      {/* Status bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
        <div className="w-16 h-px bg-space-cyan/10" />
        <span className="font-mono text-xs text-gray-800 tracking-widest">
          STACK UNIVERSE // NAVIGATION ERROR
        </span>
        <div className="w-16 h-px bg-space-cyan/10" />
      </div>
    </main>
  )
}
