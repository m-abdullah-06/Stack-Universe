'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { useUniverseStore } from '@/store'
import type { UniverseData } from '@/types'

interface AnalyticsDashboardProps {
  data: UniverseData
  standalone?: boolean
}

export function AnalyticsDashboard({ data, standalone = false }: AnalyticsDashboardProps) {
  const setActivePanel = useUniverseStore(s => s.setActivePanel)

  return (
    <motion.div
      className="fixed inset-0 z-[400] flex items-center justify-center p-2 md:p-6 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => { if (!standalone) setActivePanel(null) }}
    >
      <motion.div
        className="w-full max-w-lg h-64 bg-red-900 border border-red-500 rounded-2xl flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <h1 className="text-white text-2xl font-bold">ANALYTICS DASHBOARD LOADED</h1>
        <button 
          onClick={() => { if (!standalone) setActivePanel(null) }}
          className="absolute top-4 right-4 bg-white/20 px-4 py-2"
        >
          CLOSE
        </button>
      </motion.div>
    </motion.div>
  )
}
