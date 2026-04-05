'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import type { UniverseData } from '@/types'
import { supabase } from '@/lib/supabase'

interface CockpitOverlayProps {
  data?: UniverseData
  onExit?: () => void
  proximityTarget?: string | null
  isWarping?: boolean
}

interface Activity {
  id: string
  username: string
  action: string
  target: string
  created_at: string
}

export function CockpitOverlay({ data, onExit, proximityTarget, isWarping }: CockpitOverlayProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  
  // ── Live Comms Subscription ──
  useEffect(() => {
    if (!supabase) return
    const client = supabase

    const fetchInitial = async () => {
      const { data: initialData } = await client
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3)
      if (initialData) setActivities(initialData)
    }
    fetchInitial()

    const channel = client
      .channel('cockpit_activity')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, (payload: any) => {
        setActivities(prev => [payload.new, ...prev.slice(0, 2)])
      })
      .subscribe()

    return () => {
      client.removeChannel(channel)
    }
  }, [])

  // Fallback for landing page / multiverse mode
  const isMapMode = !data;

  // Helper for mobile touch controls
  const simulateKey = (code: string, pressed: boolean) => {
    window.dispatchEvent(new KeyboardEvent(pressed ? 'keydown' : 'keyup', { code }));
  };
  
  const velocity = data?.universeScore ?? 102400;
  const heading = "347.1°";
  const power = data ? `${data.languages.length}00%` : "N/A";
  const targetLabel = data ? `@${data.username}` : "MULTIVERSE_ROOT";

  return (
    <div className="fixed inset-0 z-[80] pointer-events-none selection:bg-space-cyan/30 text-white">
      {/* ── Cockpit Frame (SVG Overlays) ── */}
      <svg className="absolute inset-0 w-full h-full text-black/40 fill-current opacity-80 backdrop-blur-[2px]">
        <path d="M 0 0 L 120 0 L 0 120 Z" />
        <path d="M 100 0 L 100 120 L 0 0 Z" className="translate-x-[calc(100vw-100px)]" />
      </svg>

      {/* ── Top HUD: Navigation & Exit ── */}
      <div className="absolute top-8 left-0 right-0 px-6 flex justify-between items-center z-[100]">
         <div className="w-16 hidden md:block" />

         <div className="flex items-center gap-6 md:gap-16 text-space-cyan">
            <div className="flex flex-col items-center">
                <span className="font-mono text-[7px] md:text-[8px] tracking-[0.4em] opacity-50 uppercase">Velocity</span>
                <span className="font-orbitron font-black text-sm md:text-xl tracking-widest">{velocity.toLocaleString()}</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="font-mono text-[7px] md:text-[8px] tracking-[0.4em] opacity-50 uppercase">Heading</span>
                <span className="font-orbitron font-black text-sm md:text-xl tracking-widest">{heading}</span>
            </div>
            <div className="flex flex-col items-center">
                <span className="font-mono text-[7px] md:text-[8px] tracking-[0.4em] opacity-50 uppercase">Power</span>
                <span className="font-orbitron font-black text-sm md:text-xl tracking-widest">{power}</span>
            </div>
         </div>

         <div className="pointer-events-auto">
            {onExit && (
               <button 
                  onClick={onExit}
                  className="px-4 py-1.5 md:px-6 md:py-2 bg-space-magenta/10 border border-space-magenta/40 text-space-magenta font-orbitron font-bold text-[9px] md:text-[10px] rounded-lg tracking-widest hover:bg-space-magenta/30 transition-all uppercase shadow-[0_0_15px_rgba(255,0,110,0.2)]"
               >
                  DISENGAGE
               </button>
            )}
         </div>
      </div>

      {/* ── Left HUD Panels: Integrities & Comms ── */}
      <div className="absolute top-1/2 left-4 -translate-y-1/2 flex flex-col gap-8">
         {!isMapMode && data && (
            <div className="hud-panel p-3 rounded-xl border-l-[3px] border-l-space-cyan hidden md:block">
               <p className="font-mono text-[7px] text-gray-500 uppercase tracking-widest mb-2">Systems Online</p>
               <div className="space-y-1.5">
                  {data.languages.slice(0, 3).map(l => (
                  <div key={l.name} className="flex items-center gap-2">
                     <div className="w-1 h-2" style={{ background: l.color }} />
                     <span className="font-mono text-[8px] text-white/70 uppercase">{l.name}</span>
                  </div>
                  ))}
               </div>
            </div>
         )}

         {/* Interstellar Comms (Connected to Live Feed) */}
         <div className="w-48 md:w-64 space-y-2 pointer-events-auto">
            <div className="flex items-center gap-2">
                <div className="w-1 h-3 bg-space-magenta animate-pulse" />
                <p className="font-mono text-[8px] text-space-magenta/80 uppercase tracking-widest">Incoming Feed</p>
            </div>
            <div className="h-24 bg-black/60 backdrop-blur-xl rounded-lg p-2 border border-space-magenta/20 flex flex-col gap-1 overflow-hidden">
               <AnimatePresence mode="popLayout">
                 {activities.length > 0 ? (
                   activities.map((activity) => (
                     <motion.div 
                        key={activity.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="text-[8px] md:text-[9px] font-mono border-b border-white/5 pb-1 last:border-0"
                     >
                        <span className="text-space-magenta font-bold">@{activity.username}</span>
                        <span className="text-white/40 mx-1">{activity.action}</span>
                        <span className="text-space-cyan font-bold">@{activity.target}</span>
                     </motion.div>
                   ))
                 ) : (
                    <p className="font-mono text-[8px] text-space-magenta/60 animate-pulse text-center mt-4">📡 Searching for cosmic signal...</p>
                 )}
               </AnimatePresence>
            </div>
         </div>
      </div>

      {/* ── Center HUD: Target Data & Reticle ── */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <div className="absolute bottom-24 flex flex-col items-center gap-1 group">
             <div className="h-px w-24 bg-gradient-to-r from-transparent via-space-gold/50 to-transparent" />
             <p className="font-mono text-[7px] text-space-gold/60 uppercase tracking-[0.5em]">Target Vector</p>
             <p className="font-orbitron text-space-gold font-black text-xs md:text-sm tracking-[0.2em] uppercase group-hover:scale-110 transition-transform duration-700">{targetLabel}</p>
          </div>

          <div className="relative w-32 h-32 md:w-48 md:h-48 border-[1px] border-space-cyan/10 rounded-full flex items-center justify-center">
              <div className="absolute inset-0 border border-white/5 rounded-full animate-pulse" />
              <div className="w-px h-24 bg-space-cyan/20" />
              <div className="w-24 h-px bg-space-cyan/20" />
              <div className="absolute w-3 h-3 border border-space-magenta rotate-45 opacity-40" />
          </div>
      </div>

      {/* ── Mobile Flight Clusters (Extreme Corners) ── */}
      <div className="absolute inset-x-0 bottom-4 px-4 flex justify-between items-end md:hidden">
         <div className="relative w-32 h-32 pointer-events-auto">
            <button 
              className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center active:bg-space-cyan/40 transition-all shadow-lg"
              onTouchStart={() => simulateKey('KeyW', true)}
              onTouchEnd={() => simulateKey('KeyW', false)}
            >
              <span className="text-white/40 font-bold text-[9px]">W</span>
            </button>
            <button 
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center active:bg-space-magenta/40 transition-all shadow-lg"
              onTouchStart={() => simulateKey('KeyS', true)}
              onTouchEnd={() => simulateKey('KeyS', false)}
            >
              <span className="text-white/40 font-bold text-[9px]">S</span>
            </button>
            <button 
              className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center active:bg-space-gold/40 transition-all shadow-lg"
              onTouchStart={() => simulateKey('KeyA', true)}
              onTouchEnd={() => simulateKey('KeyA', false)}
            >
              <span className="text-white/40 font-bold text-[9px]">A</span>
            </button>
            <button 
              className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-lg flex items-center justify-center active:bg-space-gold/40 transition-all shadow-lg"
              onTouchStart={() => simulateKey('KeyD', true)}
              onTouchEnd={() => simulateKey('KeyD', false)}
            >
              <span className="text-white/40 font-bold text-[9px]">D</span>
            </button>
         </div>

         <div className="flex flex-col gap-3 pointer-events-auto">
            <button 
              className="w-12 h-12 bg-space-cyan/20 backdrop-blur-md border border-space-cyan/40 rounded-full flex flex-col items-center justify-center active:bg-space-cyan/60 transition-all shadow-[0_0_15px_rgba(0,229,255,0.2)]"
              onTouchStart={() => simulateKey('Space', true)}
              onTouchEnd={() => simulateKey('Space', false)}
            >
              <span className="text-space-cyan font-bold text-[8px] uppercase">UP</span>
            </button>
            <button 
              className="w-12 h-12 bg-space-magenta/20 backdrop-blur-md border border-space-magenta/40 rounded-full flex flex-col items-center justify-center active:bg-space-magenta/60 transition-all shadow-[0_0_15px_rgba(255,0,110,0.2)]"
              onTouchStart={() => simulateKey('ControlLeft', true)}
              onTouchEnd={() => simulateKey('ControlLeft', false)}
            >
              <span className="text-space-magenta font-bold text-[8px] uppercase">DN</span>
            </button>
         </div>
      </div>

      {/* ── Motion Streaks (Speed Lines) ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white/20 blur-[1px]"
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%", 
              width: 2, 
              height: 0,
              opacity: 0 
            }}
            animate={{ 
              height: [0, 100, 0],
              y: ["0%", "100%"],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 0.5 + Math.random() * 1, 
              repeat: Infinity, 
              delay: Math.random() * 2,
              ease: "linear"
            }}
            style={{ left: Math.random() * 100 + "%" }}
          />
        ))}
      </div>

      {/* ── Proximity Alert Overlay ── */}
      <AnimatePresence>
        {proximityTarget && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-24 md:top-32 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-[90] pointer-events-none"
          >
            <div className="bg-red-600/20 border border-red-500 px-4 py-2 md:px-6 rounded-lg backdrop-blur-md flex items-center gap-4 animate-pulse">
               <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444]" />
               <p className="font-orbitron font-black text-red-500 text-[9px] md:text-xs tracking-[0.3em] uppercase">
                 COLLISION HAZARD: @{proximityTarget}
               </p>
               <div className="w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_#ef4444]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Warp Drive Engagement ── */}
      <AnimatePresence>
        {isWarping && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-white pointer-events-auto flex items-center justify-center p-8"
          >
             <motion.div 
                animate={{ opacity: [0.1, 0.5, 0.1] }} 
                transition={{ duration: 0.2, repeat: Infinity }}
                className="absolute inset-0 bg-space-cyan"
             />
             <div className="relative text-black text-center">
                <h1 className="font-orbitron font-black text-3xl md:text-6xl tracking-[0.4em] uppercase mb-4">
                   WARP DRIVE ENGAGED
                </h1>
                <p className="font-mono text-[9px] md:text-xs tracking-widest uppercase opacity-60">
                   Transitioning to Local Coordinates...
                </p>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scanlines Overlay ── */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
    </div>
  )
}
