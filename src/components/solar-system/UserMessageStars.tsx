'use client'

import { useState, useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface MessageStar {
  id: string
  text: string
  user: string
  t: number
  traj: {
    x0: number; y0: number; z0: number;
    x1: number; y1: number; z1: number;
  }
}

export function UserMessageStars() {
  const [messages, setMessages] = useState<MessageStar[]>([])

  useEffect(() => {
    const handleStar = (e: any) => {
      const { text, user } = e.detail
      const angle = Math.random() * Math.PI * 2
      const radius = 30
      
      const newStar: MessageStar = {
        id: Math.random().toString(36),
        text,
        user,
        t: 0,
        traj: {
          x0: Math.cos(angle) * radius,
          y0: (Math.random() - 0.5) * 20,
          z0: Math.sin(angle) * radius,
          x1: Math.cos(angle + Math.PI) * radius * 0.1,
          y1: (Math.random() - 0.5) * 5,
          z1: Math.sin(angle + Math.PI) * radius * 0.1,
        }
      }
      setMessages(prev => [...prev, newStar].slice(-5)) // Keep last 5
    }

    window.addEventListener('universe:shooting_star', handleStar)
    return () => window.removeEventListener('universe:shooting_star', handleStar)
  }, [])

  useFrame((_, delta) => {
    setMessages(prev => {
      const next = prev.map(m => ({ ...m, t: m.t + delta * 0.4 }))
      return next.filter(m => m.t < 1)
    })
  })

  return (
    <>
      {messages.map(m => (
        <group 
          key={m.id}
          position={[
            m.traj.x0 + (m.traj.x1 - m.traj.x0) * m.t,
            m.traj.y0 + (m.traj.y1 - m.traj.y0) * m.t,
            m.traj.z0 + (m.traj.z1 - m.traj.z0) * m.t,
          ]}
        >
          {/* Glowing Golden Packet */}
          <mesh>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color="#ffcc00" />
          </mesh>
          <pointLight color="#ffaa00" intensity={2} distance={10} />
          
          {/* Message Label */}
          <Html center distanceFactor={10} position={[0, 0.5, 0]}>
            <div className="flex flex-col items-center pointer-events-none select-none">
              <div className="bg-space-gold/20 backdrop-blur-md border border-space-gold/50 px-2.5 py-1 rounded-full whitespace-nowrap">
                <span className="font-orbitron text-[9px] font-black text-space-gold uppercase tracking-widest drop-shadow-[0_0_5px_rgba(255,215,0,0.8)]">
                  {m.text}
                </span>
              </div>
              <span className="font-mono text-[7px] text-white/50 uppercase">@{m.user}</span>
            </div>
          </Html>
        </group>
      ))}
    </>
  )
}
