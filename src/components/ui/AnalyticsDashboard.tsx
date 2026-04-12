'use client'

import { useState, useEffect } from 'react'
import { useUniverseStore } from '@/store'
import type { UniverseData } from '@/types'

interface AnalyticsDashboardProps {
  data: UniverseData
  standalone?: boolean
}

export function AnalyticsDashboard({ data, standalone = false }: AnalyticsDashboardProps) {
  const setActivePanel = useUniverseStore(s => s.setActivePanel)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // THIS LOG MUST APPEAR IN THE CONSOLE
    console.log('%c [ANALYTICS] !!! CRITICAL DIAGNOSTIC MOUNT !!! ', 'background: #ff00ff; color: white; border: 5px solid white; font-size: 20px;')
    console.log('Data Check:', !!data)
  }, [data])

  const handleClose = () => {
    if (!standalone) setActivePanel(null)
  }

  return (
    <div 
      id="DEBUG_ANALYTICS_WRAPPER"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999999,
        background: 'rgba(255, 0, 255, 0.9)', // VIBRANT MAGENTA
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        color: 'white',
        fontFamily: 'sans-serif'
      }}
      onClick={handleClose}
    >
      <div 
        style={{
          background: 'black',
          padding: '40px',
          borderRadius: '30px',
          border: '10px solid white',
          maxWidth: '600px',
          textAlign: 'center',
          boxShadow: '0 0 100px rgba(0,0,0,1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h1 style={{ fontSize: '40px', marginBottom: '20px' }}>ANALYTICS IS ALIVE</h1>
        <p style={{ fontSize: '18px', marginBottom: '30px' }}>
          If you see this Purple background, we have successfully bypassed the 
          <strong> SyntaxError</strong> and the <strong>Framer Motion</strong> bug.
        </p>
        
        <div style={{ padding: '20px', background: '#222', borderRadius: '15px', marginBottom: '30px' }}>
            <p>Active Panel in Store: <span style={{ color: '#00e5ff' }}>ANALYTICS</span></p>
            <p>User: @{data.username}</p>
        </div>

        <button 
          onClick={handleClose}
          style={{
            padding: '15px 40px',
            background: 'white',
            color: 'black',
            fontWeight: 'bold',
            borderRadius: '10px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '20px'
          }}
        >
          CLOSE THIS BOX
        </button>
      </div>
    </div>
  )
}
