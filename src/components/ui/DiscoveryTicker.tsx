'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface Activity {
  id: string
  username: string
  action: string
  target: string
  created_at: string
}

export function DiscoveryTicker() {
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    if (!supabase) {
      console.error('[Ticker] Supabase client is NULL — ticker disabled. Check NEXT_PUBLIC_SUPABASE_URL env var.')
      return
    }
    console.log('[Ticker] Supabase connected, fetching initial activity...')

    // 1. Initial fetch of recent activity
    const fetchInitial = async () => {
      if (!supabase) return
      const { data, error } = await supabase
        .from('activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (error) {
        console.error('[Ticker] Fetch error:', error)
        return
      }
      if (data) setActivities(data)
    }

    fetchInitial()

    // 2. Realtime subscription
    const client = supabase as any
    const channel = client
      .channel('public:activity_log')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity_log' },
        (payload: any) => {
          const newActivity = payload.new as Activity
          setActivities((prev) => {
            // Deduplicate: Don't add if the ID already exists
            if (prev.some(a => a.id === newActivity.id)) return prev
            return [newActivity, ...prev.slice(0, 4)]
          })
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log('[Ticker] Live discovery feed connected (SUBSCRIBED)')
        }
      })

    return () => {
      client.removeChannel(channel)
    }
  }, [])

  // If no activities yet, show a scanning heartbeat
  if (activities.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-[100] h-8 bg-black/60 backdrop-blur-md border-t border-white/10 flex items-center overflow-hidden pointer-events-none">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black/80 to-transparent z-10 flex items-center pl-4">
          <span className="text-[8px] font-orbitron font-bold text-space-cyan tracking-widest animate-pulse">LIVE FEED</span>
        </div>
        <div className="flex gap-8 whitespace-nowrap px-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            className="flex items-center gap-2"
          >
            <span className="text-[10px] font-mono text-space-cyan animate-pulse">📡 SCANNING DEEP SPACE FOR DISCOVERIES...</span>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] h-8 bg-black/60 backdrop-blur-md border-t border-white/10 flex items-center overflow-hidden pointer-events-none">
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black/80 to-transparent z-10 flex items-center pl-4">
        <span className="text-[8px] font-orbitron font-bold text-space-cyan tracking-widest animate-pulse">LIVE FEED</span>
      </div>
      
      <div className="flex gap-8 whitespace-nowrap px-24">
        <AnimatePresence mode="popLayout">
          {activities.map((activity, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex items-center gap-2"
            >
              <span className="text-[9px] font-mono text-white/40">{new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span className="text-[10px] font-orbitron font-bold text-white">@{activity.username}</span>
              <span className="text-[10px] font-mono text-space-gold/70">{activity.action}</span>
              <span className="text-[10px] font-orbitron font-bold text-space-cyan">@{activity.target}</span>
              {i < activities.length - 1 && <span className="text-white/10 mx-2">|</span>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black/80 to-transparent z-10" />
    </div>
  )
}
