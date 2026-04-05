'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUniverseStore, useIsAnyPanelOpen } from '@/store'
import type { UniverseData } from '@/types'

const STAR_COLORS = [
  { name: 'White', value: '#ffffff' },
  { name: 'Gold', value: '#ffd700' },
  { name: 'Cyan', value: '#00e5ff' },
  { name: 'Red', value: '#ff4444' },
  { name: 'Green', value: '#00e5a0' },
  { name: 'Purple', value: '#ff00e5' },
]

interface CustomisePanelProps {
  data: UniverseData
}

export function CustomisePanel({ data }: CustomisePanelProps) {
  const { claimData, setClaimData, showCustomisePanel, setShowCustomisePanel } = useUniverseStore()
  const [isSaving, setIsSaving] = useState(false)
  const isAnyPanelOpen = useIsAnyPanelOpen()

  if (!claimData) return null

  const handleUpdate = async (updates: any) => {
    setIsSaving(true)
    try {
      const res = await fetch(`/api/claim/${data.username}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...claimData, ...updates })
      })
      if (!res.ok) throw new Error('Update failed')
      const json = await res.json()
      setClaimData(json.claim)
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 h-full w-80 bg-black/90 backdrop-blur-3xl border-l border-white/10 z-[400] p-6 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] overflow-y-auto"
    >
      <div className="flex items-center justify-between mb-8">
        <h3 className="font-orbitron font-bold text-lg text-white tracking-widest">CUSTOMISE</h3>
        <button onClick={() => setShowCustomisePanel(false)} className="text-gray-500 hover:text-white">✕</button>
      </div>

      <div className="space-y-8">
        {/* Star Color */}
        <section>
          <label className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-3">Star Surface Color</label>
          <div className="grid grid-cols-6 gap-2">
            {STAR_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => handleUpdate({ star_color: c.value })}
                className={`w-8 h-8 rounded-full border-2 transition-all ${
                  claimData.star_color === c.value ? 'border-white scale-110' : 'border-transparent hover:scale-105'
                }`}
                style={{ backgroundColor: c.value, boxShadow: claimData.star_color === c.value ? `0 0 15px ${c.value}` : 'none' }}
                title={c.name}
              />
            ))}
          </div>
        </section>

        {/* Entry Message */}
        <section>
          <label className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-3">Entry Greeting</label>
          <textarea
            defaultValue={claimData.entry_msg}
            onBlur={(e) => handleUpdate({ entry_msg: e.target.value })}
            placeholder="Add a message that appears when people enter..."
            maxLength={60}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 font-mono text-xs text-white focus:outline-none focus:border-space-cyan/50 h-20 resize-none"
          />
          <div className="mt-1 flex justify-end">
              <span className="font-mono text-[8px] text-gray-600">Max 60 chars</span>
          </div>
        </section>

        {/* Bio */}
        <section>
          <label className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-3">Universe Bio</label>
          <textarea
            defaultValue={claimData.bio}
            onBlur={(e) => handleUpdate({ bio: e.target.value })}
            placeholder="Describe your domain..."
            maxLength={120}
            className="w-full bg-white/5 border border-white/10 rounded-lg p-3 font-mono text-xs text-white focus:outline-none focus:border-space-cyan/50 h-24 resize-none"
          />
          <div className="mt-1 flex justify-end">
              <span className="font-mono text-[8px] text-gray-600">Max 120 chars</span>
          </div>
        </section>

        {/* Pin Repos */}
        <section>
          <label className="font-mono text-[9px] text-gray-500 uppercase tracking-widest block mb-3">Pinned Repository</label>
          <div className="w-full bg-white/5 border border-white/10 rounded-lg p-2 font-mono text-xs text-white h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1">
            {data.repos.map(repo => {
              const isPinned = claimData.pinned_repos?.includes(repo.name)
              return (
                <button
                  key={repo.id}
                  onClick={() => {
                    const currentlyPinned = claimData.pinned_repos || []
                    if (isPinned) {
                      handleUpdate({ pinned_repos: currentlyPinned.filter((name: string) => name !== repo.name) })
                    } else if (currentlyPinned.length < 3) {
                      handleUpdate({ pinned_repos: [...currentlyPinned, repo.name] })
                    }
                  }}
                  className={`text-left px-3 py-2 rounded-md transition-colors ${
                    isPinned 
                      ? 'bg-space-gold/20 text-space-gold border border-space-gold/30' 
                      : 'hover:bg-white/10 text-gray-300 border border-transparent'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="truncate pr-2">{repo.name}</span>
                    {isPinned && <span className="text-[10px]">★</span>}
                  </div>
                </button>
              )
            })}
          </div>
          <p className="font-mono text-[8px] text-gray-600 mt-2 italic">Pinned repos get a golden ring and stay in Tier 1. Select up to 3.</p>
        </section>
      </div>

      {isSaving && (
        <div className="absolute bottom-6 left-6 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-space-cyan animate-pulse" />
          <span className="font-mono text-[8px] text-space-cyan uppercase tracking-widest">Saving changes...</span>
        </div>
      )}
    </motion.div>
  )
}
