'use client'

import { useState, useEffect } from 'react'
import { useUniverseStore } from '@/store'
import type { UniverseData } from '@/types'

interface AnalyticsDashboardProps {
  data: UniverseData
  standalone?: boolean
  visible?: boolean // ADDED PROP
}

export function AnalyticsDashboard({ data, standalone = false, visible = true }: AnalyticsDashboardProps) {
  // RENDER-TIME LOG - THIS WILL SHOW EVEN IF COMPONENT CRASHES LATER
  console.log(`[DASHBOARD] Rendering. Visible: ${visible}`);

  const setActivePanel = useUniverseStore(s => s.setActivePanel)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (visible) {
      console.log('%c [ANALYTICS] MOUNTED AND VISIBLE ', 'background: #00e5ff; color: black; font-weight: bold;');
    }
  }, [visible])

  const handleClose = () => {
    if (!standalone) setActivePanel(null)
  }

  // Force always rendering in DOM, but hide/show with CSS
  return (
    <div 
      id="ANALYTICS_ROOT"
      style={{
        display: visible ? 'flex' : 'none', // CSS TOGGLE
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        background: 'rgba(255, 0, 255, 0.4)', // HIGH VISIBILITY
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: visible ? 'auto' : 'none',
        backdropFilter: 'blur(20px)'
      }}
      onClick={handleClose}
    >
      <div 
        style={{
          background: '#020205',
          padding: '40px',
          borderRadius: '30px',
          border: '4px solid #ff00ff',
          maxWidth: '800px',
          width: '90%',
          textAlign: 'center',
          color: 'white'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>DIAGNOSTIC DASHBOARD</h1>
        <p style={{ color: '#00e5ff', marginBottom: '20px' }}>STATUS: {visible ? 'VISIBLE' : 'HIDDEN'}</p>
        
        <div style={{ background: 'white/5', padding: '20px', borderRadius: '15px', marginBottom: '20px' }}>
          <p>Current Store State: <span style={{ color: '#ffd700' }}>{visible ? 'ANALYTICS' : 'NULL'}</span></p>
        </div>

        <button 
          onClick={handleClose}
          style={{ padding: '10px 30px', background: '#ff00ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          CLOSE
        </button>
      </div>
    </div>
  )
}
