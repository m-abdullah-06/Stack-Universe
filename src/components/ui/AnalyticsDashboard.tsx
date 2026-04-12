'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useUniverseStore } from '@/store'
import type { UniverseData } from '@/types'

import { OverviewTab } from './analytics/OverviewTab'
import { ReposTab } from './analytics/ReposTab'
import { ActivityTab } from './analytics/ActivityTab'
import { LanguagesTab } from './analytics/LanguagesTab'
import { CICDTab } from './analytics/CICDTab'
import { GrowthTab } from './analytics/GrowthTab'

interface AnalyticsDashboardProps {
  data: UniverseData
  standalone?: boolean
}

const TABS = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'repos', label: 'Repos', icon: '🪐' },
  { key: 'activity', label: 'Activity', icon: '⚡' },
  { key: 'languages', label: 'Languages', icon: '🎨' },
  { key: 'cicd', label: 'CI/CD', icon: '🛰️' },
  { key: 'growth', label: 'Growth', icon: '📈' },
] as const

type TabKey = typeof TABS[number]['key']

export function AnalyticsDashboard({ data, standalone = false }: AnalyticsDashboardProps) {
  const setActivePanel = useUniverseStore(s => s.setActivePanel)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    console.log('📊 AnalyticsDashboard mounted with data:', !!data)
  }, [data])

  const handleClose = () => {
    if (!standalone) setActivePanel(null)
  }

  // const handleExportPDF = ... (commented out in actual edit)

  const renderTab = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <h2 className="text-3xl font-orbitron font-bold text-white">TAB: {activeTab.toUpperCase()}</h2>
        <p className="text-space-cyan animate-pulse">FIXING SYNTAX ERRORS... CHARTS TEMPORARILY DISABLED</p>
        <div className="w-64 h-64 bg-space-gold/20 border-2 border-dashed border-space-gold rounded-3xl flex items-center justify-center">
            <span className="text-4xl">📊</span>
        </div>
      </div>
    )
  }

  // Overlay mode — same pattern as NarratorPanel/RoastPanel
  return (
    <motion.div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-2 md:p-6 bg-black/80 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <motion.div
        className="w-full max-w-4xl h-[80vh] bg-[#020205] border-4 border-[#ff00ff] rounded-3xl shadow-[0_0_100px_rgba(255,0,255,0.3)] relative flex flex-col overflow-hidden"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
            <h1 className="text-white font-orbitron font-bold">DIAGNOSTIC DASHBOARD</h1>
            <button onClick={handleClose} className="text-white text-2xl">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/5 border-b border-white/10">
            {TABS.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)} className={`px-6 py-3 font-mono text-[10px] ${activeTab === t.key ? 'text-space-gold bg-white/5' : 'text-gray-500'}`}>
                    {t.label}
                </button>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          {renderTab()}
        </div>
      </motion.div>
    </motion.div>
  )
}
