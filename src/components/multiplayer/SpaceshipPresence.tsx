'use client'

import { useEffect, useState, useRef } from 'react'

import { supabase } from '@/lib/supabase'

interface PresenceState {
  user: string
  color: string
}

interface SpaceshipPresenceProps {
  room: string
  currentUser?: string | null
}

export function SpaceshipPresence({ room, currentUser }: SpaceshipPresenceProps) {

  // Track OTHER users
  const [others, setOthers] = useState<Record<string, PresenceState>>({})
  
  const tabId = useRef(Math.random().toString(36).slice(2, 9)).current

  useEffect(() => {
    if (!supabase) return

    const normalizedRoom = (room || 'unknown').toLowerCase()
    const presenceKey = currentUser ? `${currentUser}-${tabId}` : `anon-${tabId}`

    const channel = supabase.channel(`presence:${normalizedRoom}`, {
      config: {
        presence: {
          key: presenceKey,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as any
        const newOthers: Record<string, PresenceState> = {}
        
        for (const key in state) {
          if (key === presenceKey) continue
          const p = state[key][0]
          if (p) newOthers[key] = p
        }
        setOthers(newOthers)
      })
      .subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user: currentUser || 'Traveler',
            color: '#00e5ff'
          })
        }
      })

    return () => {
      channel.unsubscribe()
    }
  }, [supabase, room, currentUser, tabId])

  const pilotCount = Object.keys(others).length + 1 // +1 for self
  const otherCount = Object.keys(others).length

  return (
    <>
      {/* ── Pilot Radar (Safe Zone) ── */}
      <div className="fixed bottom-14 right-3 md:top-8 md:bottom-auto md:right-8 md:left-auto z-[120] pointer-events-auto">
        <div className="bg-black/70 backdrop-blur-xl rounded-lg border border-white/10 px-3 py-2 flex items-center gap-3 shadow-[0_0_20px_rgba(0,0,0,0.8)]">
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-40" />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-[8px] text-emerald-400 tracking-[0.2em] uppercase leading-none">
              SECTOR LINK
            </span>
            <span className="font-orbitron text-[10px] text-white font-bold">
              {pilotCount} {pilotCount === 1 ? 'PILOT' : 'PILOTS'}
            </span>
          </div>
          
          {/* Pilot avatars */}
          {otherCount > 0 && (
            <div className="flex -space-x-1 ml-1">
              {Object.entries(others).slice(0, 4).map(([key, p]) => (
                <div key={key} className="w-5 h-5 rounded-full bg-space-cyan/20 border border-space-cyan/50 flex items-center justify-center shadow-lg">
                  <span className="text-[6px] font-bold text-space-cyan">
                    {p.user.charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
              {otherCount > 4 && (
                <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shadow-lg">
                  <span className="text-[6px] font-mono text-white/60">+{otherCount - 4}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
