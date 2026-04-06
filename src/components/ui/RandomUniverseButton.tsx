'use client'

import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useUniverseStore } from '@/store'

interface RandomUniverseButtonProps {
  className?: string
  label?: string
}

export function RandomUniverseButton({
  className = '',
  label = '⟳ DRIFT TO RANDOM UNIVERSE',
}: RandomUniverseButtonProps) {
  const router = useRouter()
  const { status } = useSession()
  const setShowAuthGate = useUniverseStore(s => s.setShowAuthGate)
  const [loading, setLoading] = useState(false)

  const driftToRandom = async () => {
    if (status === 'unauthenticated') {
      setShowAuthGate(true)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/universes')
      const data = await res.json()
      const universes: { username: string }[] = data.universes || []

      if (universes.length === 0) {
        // Fallback to known interesting users
        const fallbacks = ['torvalds', 'gaearon', 'sindresorhus', 'yyx990803', 'antirez']
        const pick = fallbacks[Math.floor(Math.random() * fallbacks.length)]
        router.push(`/universe/${pick}`)
        return
      }

      const pick = universes[Math.floor(Math.random() * universes.length)]
      router.push(`/universe/${pick.username}`)
    } catch {
      setLoading(false)
    }
  }

  return (
    <motion.button
      onClick={driftToRandom}
      disabled={loading}
      className={`hud-panel rounded px-4 py-2 font-mono text-xs tracking-wider transition-all disabled:opacity-50 ${className}`}
      style={{ color: '#7b2fff' }}
      whileHover={{ scale: 1.03, backgroundColor: 'rgba(123,47,255,0.08)' }}
      whileTap={{ scale: 0.97 }}
    >
      {loading ? (
        <motion.span
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        >
          CALCULATING TRAJECTORY...
        </motion.span>
      ) : (
        label
      )}
    </motion.button>
  )
}
