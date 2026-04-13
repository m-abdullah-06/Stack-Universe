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

  const handleExportPDF = useCallback(async () => {
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const element = contentRef.current
      if (!element) return

      const canvas = await html2canvas(element, {
        backgroundColor: '#020205',
        scale: 2,
        useCORS: true,
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width / 2, canvas.height / 2],
      })

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`${data.username}-analytics.pdf`)
    } catch (err) {
      console.error('PDF export failed:', err)
    }
  }, [data.username])

  const handleShareLink = useCallback(() => {
    const url = `${window.location.origin}/analytics/${data.username}`
    navigator.clipboard.writeText(url).then(() => {
      alert(`Analytics link copied!\n${url}`)
    }).catch(() => {
      window.prompt('Copy this link:', url)
    })
  }, [data.username])

  const renderTab = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab data={data} />
      case 'repos': return <ReposTab data={data} />
      case 'activity': return <ActivityTab data={data} />
      case 'languages': return <LanguagesTab data={data} />
      case 'cicd': return <CICDTab data={data} />
      case 'growth': return <GrowthTab data={data} />
    }
  }

  // Standalone mode — direct render without overlay
  if (standalone) {
    return (
      <div className="min-h-screen bg-[#020205] flex flex-col">
        {renderHeader()}
        {renderTabs()}
        <div ref={contentRef} className="flex-1 px-4 md:px-6 py-4 md:py-6 overflow-y-auto" style={{ backgroundColor: '#020205' }}>
          {renderTab()}
        </div>
      </div>
    )
  }

  // Helper: Header bar
  function renderHeader() {
    return (
      <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-white/5 flex-shrink-0">
        <div className="flex items-center gap-3">
          {data.user.avatar_url && (
            <img
              src={data.user.avatar_url}
              alt={data.username}
              className="w-7 h-7 rounded-full border border-white/10"
            />
          )}
          <div>
            <h1 className="font-orbitron font-bold text-sm text-white">
              @{data.username}{' '}
              <span className="text-[9px] text-gray-500 font-mono font-normal uppercase tracking-widest">Analytics</span>
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPDF}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[9px] font-mono text-gray-400 hover:text-white hover:bg-white/[0.08] transition-all uppercase tracking-wider"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF
          </button>
          <button
            onClick={handleShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-space-cyan/10 border border-space-cyan/20 text-[9px] font-mono text-space-cyan hover:bg-space-cyan/20 transition-all uppercase tracking-wider"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Share
          </button>
          {!standalone && (
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.05] border border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.1] transition-all"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    )
  }

  // Helper: Tab navigation
  function renderTabs() {
    return (
      <div className="px-4 md:px-6 border-b border-white/5 overflow-x-auto no-scrollbar flex-shrink-0">
        <div className="flex gap-1 min-w-max">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative flex items-center gap-1.5 px-4 py-2.5 text-[10px] font-mono uppercase tracking-widest transition-all rounded-t-lg whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-white bg-white/[0.05]'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]'
              }`}
            >
              <span className="text-xs">{tab.icon}</span>
              <span>{tab.label}</span>
              {activeTab === tab.key && (
                <motion.div
                  className="absolute bottom-0 left-2 right-2 h-[2px] bg-space-cyan rounded-full"
                  layoutId="analytics-tab-indicator"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Overlay mode — same pattern as NarratorPanel/RoastPanel
  return (
    <motion.div
      className="fixed inset-0 z-[400] flex items-center justify-center p-2 md:p-6 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, pointerEvents: 'none' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <motion.div
        className="w-full max-w-6xl h-[92vh] md:h-[88vh] bg-[#020205]/95 backdrop-blur-2xl border border-white/10 rounded-2xl md:rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.8)] relative flex flex-col overflow-hidden"
        initial={{ scale: 0.92, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 30, opacity: 0, pointerEvents: 'none' }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative accents */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-space-cyan/5 blur-[80px] rounded-full -mr-24 -mt-24 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-space-magenta/5 blur-[80px] rounded-full -ml-24 -mb-24 pointer-events-none" />

        {/* Header */}
        {renderHeader()}

        {/* Tabs */}
        {renderTabs()}

        {/* Scrollable Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-6 scrollbar-thin scrollbar-thumb-white/10"
          style={{ backgroundColor: '#020205' }}
        >
          {renderTab()}
        </div>
      </motion.div>
    </motion.div>
  )
}
