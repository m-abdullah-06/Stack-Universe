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

interface ChatMessage {
  id: string
  user: string
  text: string
  timestamp: number
}

interface SpaceshipPresenceProps {
  room: string
  currentUser: string | null
}

export function SpaceshipPresence({ room, currentUser }: SpaceshipPresenceProps) {
  const [others, setOthers] = useState<Record<string, PresenceState>>({})
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [showChat, setShowChat] = useState(false)
  const mousePos = useRef({ x: 0, y: 0 })
  const tabId = useRef(Math.random().toString(36).slice(2, 9)).current
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (!supabase) {
      console.warn('[Presence] Supabase client is NULL — env vars missing? Multiplayer disabled.')
      return
    }

    const normalizedRoom = (room || 'unknown').toLowerCase()
    const presenceKey = currentUser ? `${currentUser}-${tabId}` : `anon-${tabId}`

    console.log(`[Presence] Connecting to room: ${normalizedRoom} as ${presenceKey}`)

    const channel = supabase.channel(`presence:${normalizedRoom}`, {
      config: {
        broadcast: { ack: false },
        presence: {
          key: presenceKey,
        },
      },
    })

    // Broadcast handler — adds to chat panel
    const handleLocalBroadcast = async (e: any) => {
      const msg: ChatMessage = {
        id: Math.random().toString(36).slice(2),
        user: e.detail.user,
        text: e.detail.text,
        timestamp: Date.now(),
      }
      setMessages(prev => [...prev.slice(-19), msg])
      setShowChat(true)

      channel.send({
        type: 'broadcast',
        event: 'message',
        payload: e.detail
      })
    }

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
      .on('broadcast', { event: 'message' }, ({ payload }) => {
        // Received message from another pilot — add to chat
        const msg: ChatMessage = {
          id: Math.random().toString(36).slice(2),
          user: payload.user,
          text: payload.text,
          timestamp: Date.now(),
        }
        setMessages(prev => [...prev.slice(-19), msg])
        setShowChat(true)
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

    window.addEventListener('universe:broadcast', handleLocalBroadcast)

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
    }, 200) // 5Hz — reduced from 10Hz for stability

    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      console.log('[Presence] Cleaning up channel...')
      window.removeEventListener('universe:broadcast', handleLocalBroadcast)
      window.removeEventListener('mousemove', handleMouseMove)
      clearInterval(interval)
      channel.unsubscribe()
    }
  }, [room, currentUser, tabId])

  const pilotCount = Object.keys(others).length + 1
  const otherCount = Object.keys(others).length

  return (
    <>
      {/* ── Pilot Radar (Safe Zone) ── */}
      <div className="fixed bottom-14 right-3 md:top-4 md:bottom-auto md:left-4 md:right-auto z-[80] pointer-events-auto">
        <div className="bg-black/70 backdrop-blur-xl rounded-lg border border-white/10 px-3 py-2 flex items-center gap-3">
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
                <div key={key} className="w-5 h-5 rounded-full bg-space-cyan/20 border border-space-cyan/50 flex items-center justify-center">
                  <span className="text-[6px] font-bold text-space-cyan">
                    {p.user.charAt(0).toUpperCase()}
                  </span>
                </div>
              ))}
              {otherCount > 4 && (
                <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
                  <span className="text-[6px] font-mono text-white/60">+{otherCount - 4}</span>
                </div>
              )}
            </div>
          )}

          {/* Chat toggle */}
          <button 
            onClick={() => setShowChat(!showChat)}
            className={`ml-1 w-6 h-6 rounded flex items-center justify-center transition-all ${
              showChat ? 'bg-space-cyan/20 text-space-cyan' : 'bg-white/5 text-white/40 hover:text-white'
            }`}
          >
            <span className="text-[10px]">💬</span>
          </button>

          {messages.length > 0 && !showChat && (
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-space-magenta flex items-center justify-center animate-pulse">
              <span className="text-[6px] text-white font-bold">{Math.min(messages.length, 9)}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Chat Panel ── */}
      <AnimatePresence>
        {showChat && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed bottom-28 right-3 md:top-16 md:bottom-auto md:left-4 md:right-auto z-[80] w-[280px] md:w-[320px] pointer-events-auto"
          >
            <div className="bg-black/80 backdrop-blur-xl rounded-xl border border-white/10 overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              {/* Header */}
              <div className="px-3 py-2 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-orbitron text-space-cyan tracking-[0.2em] uppercase">
                    COMMS CHANNEL
                  </span>
                  <span className="text-[7px] font-mono text-white/30 truncate max-w-[100px]">#{room.toLowerCase()}</span>
                </div>
                <button 
                  onClick={() => setShowChat(false)}
                  className="text-white/30 hover:text-white text-[10px] transition-colors p-1"
                >
                  ✕
                </button>
              </div>

              {/* Messages */}
              <div className="h-[200px] md:h-[260px] overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
                {messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="font-mono text-[9px] text-white/20 text-center leading-relaxed">
                      No transmissions yet.<br/>
                      Use the broadcast input.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.user === (currentUser || 'Traveler')
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, x: isMe ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className={`max-w-[85%] rounded-lg px-2.5 py-1.5 ${
                          isMe 
                            ? 'bg-space-cyan/15 border border-space-cyan/30' 
                            : 'bg-white/5 border border-white/10'
                        }`}>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`font-orbitron text-[7px] font-bold tracking-wider ${
                              isMe ? 'text-space-cyan' : 'text-space-gold'
                            }`}>
                              @{msg.user}
                            </span>
                            <span className="font-mono text-[6px] text-white/20 relative top-[1px]">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="font-mono text-[10px] text-white/80 leading-relaxed break-words">
                            {msg.text}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Cursor-following ships (other players) ── */}
      <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
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
              {/* Ship icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" className="fill-space-cyan drop-shadow-[0_0_12px_rgba(0,229,255,0.9)]">
                <path d="M12 2L2 22L12 18L22 22L12 2Z" />
              </svg>
              
              {/* Username Tag */}
              <div className="mt-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-space-cyan/30">
                <span className="font-mono text-[8px] text-space-cyan uppercase tracking-wider">
                  @{p.user}
                </span>
              </div>
              
              {/* Engine Trail */}
              <div className="w-1 h-5 bg-gradient-to-t from-transparent via-space-cyan/20 to-space-cyan/50 mt-[-2px] blur-[1px] animate-pulse" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}
