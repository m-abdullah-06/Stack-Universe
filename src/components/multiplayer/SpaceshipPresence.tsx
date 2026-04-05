'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface PresenceState {
  user: string
  x: number
  y: number
  lastSeen: number
}

interface SpaceshipPresenceProps {
  room: string
  currentUser: string | null
}

export function SpaceshipPresence({ room, currentUser }: SpaceshipPresenceProps) {
  const [others, setOthers] = useState<Record<string, PresenceState>>({})
  const mousePos = useRef({ x: 0, y: 0 })
  // Generate a unique Session ID for THIS specific browser tab
  const tabId = useRef(Math.random().toString(36).slice(2, 9)).current

  useEffect(() => {
    if (!supabase) {
      console.warn('[Presence] Supabase client is NULL — env vars missing? Multiplayer disabled.')
      return
    }

    // Ensure the room name is always lowercased to prevent "Room Mismatch" (Gaeron vs gaeron)
    const normalizedRoom = (room || 'unknown').toLowerCase()
    
    // Add the tabId to the payload so Supabase doesn't deduplicate if the same user opens 2 tabs
    const presenceKey = currentUser ? `${currentUser}-${tabId}` : `anon-${tabId}`

    console.log(`[Presence] Connecting to room: ${normalizedRoom} as ${presenceKey}`)

    const channel = supabase.channel(`presence:${normalizedRoom}`, {
      config: {
        presence: {
          key: presenceKey,
        },
      },
    })

    // Define the broadcast handler HERE so we can clean it up
    const handleLocalBroadcast = (e: any) => {
      channel.send({
        type: 'broadcast',
        event: 'message',
        payload: e.detail
      });
      // Also show locally
      window.dispatchEvent(new CustomEvent('universe:shooting_star', { 
        detail: e.detail 
      }));
    };

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as any
        const newOthers: Record<string, PresenceState> = {}
        
        for (const key in state) {
          // Don't show our own tab's ship!
          if (key === presenceKey) continue
          const p = state[key][0]
          if (p) newOthers[key] = p
        }
        setOthers(newOthers)
      })
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        // Trigger a visuals-only event for the 3D scene
        window.dispatchEvent(new CustomEvent('universe:shooting_star', { 
           detail: { text: payload.text, user: payload.user } 
        }));
      })
      .subscribe(async (status) => {
        console.log(`[Presence] Channel status: ${status}`)
        if (status === 'SUBSCRIBED') {
          console.log(`[Presence] Connected! Tracking position...`)
          
          await channel.track({
            user: currentUser || 'Traveler',
            x: 0,
            y: 0,
            lastSeen: Date.now()
          })
        }
      })

    // Listen for local broadcast requests from HUD (defined outside subscribe so cleanup works)
    window.addEventListener('universe:broadcast', handleLocalBroadcast);

    // Track mouse and broadcast frequently
    const handleMouseMove = (e: MouseEvent) => {
      mousePos.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight }
    }

    const interval = setInterval(() => {
      channel.track({
        user: currentUser || 'Traveler',
        x: mousePos.current.x,
        y: mousePos.current.y,
        lastSeen: Date.now()
      })
    }, 100) // 10Hz updates for smoothness

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      console.log('[Presence] Cleaning up channel...')
      window.removeEventListener('universe:broadcast', handleLocalBroadcast)
      window.removeEventListener('mousemove', handleMouseMove)
      clearInterval(interval)
      channel.unsubscribe()
    }
  }, [room, currentUser, tabId])

  const pilotCount = Object.keys(others).length + 1 // including self

  return (
    <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
      {/* Radar HUD Indicator */}
      <div className="absolute top-24 right-6 bg-black/60 backdrop-blur-md rounded border border-white/10 px-3 py-1 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-space-cyan animate-pulse shadow-[0_0_8px_rgba(0,229,255,0.8)]" />
        <span className="font-mono text-[9px] text-space-cyan tracking-widest uppercase">
          PILOTS_ONLINE: {pilotCount}
        </span>
      </div>

      <AnimatePresence>
        {Object.entries(others).map(([key, p]) => (
          <motion.div
            key={key}
            className="absolute flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ 
              opacity: 1,
              left: `${p.x * 100}%`,
              top: `${p.y * 100}%`,
            }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 120, mass: 0.5 }}
          >
            {/* Tiny Geometric Spaceship (Triangle) */}
            <svg width="12" height="12" viewBox="0 0 24 24" className="fill-space-cyan drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">
              <path d="M12 2L2 22L12 18L22 22L12 2Z" />
            </svg>
            
            {/* Username Tag */}
            <div className="mt-1 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-md border border-white/10">
              <span className="font-mono text-[7px] text-white/70 uppercase tracking-tighter">
                @{p.user}
              </span>
            </div>
            
            {/* Engine Trail (CSS Pulse) */}
            <div className="w-1 h-4 bg-gradient-to-t from-transparent to-space-cyan/30 mt-[-2px] blur-[1px] animate-pulse" />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
