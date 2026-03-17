'use client'

import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { GitHubRepo } from '@/types'

interface MoonProps {
  repo: GitHubRepo
  orbitRadius: number
  orbitSpeed: number
  size: number
  offset: number
  color: string
}

export function Moon({ repo, orbitRadius, orbitSpeed, size, offset, color }: MoonProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const angleRef = useRef(offset)

  useFrame((_, delta) => {
    angleRef.current += orbitSpeed * delta
    if (groupRef.current) {
      // Slightly inclined orbit per moon for visual variety
      groupRef.current.position.x = Math.cos(angleRef.current) * orbitRadius
      groupRef.current.position.y = Math.sin(angleRef.current * 0.5) * orbitRadius * 0.12
      groupRef.current.position.z = Math.sin(angleRef.current) * orbitRadius
    }
  })

  return (
    <group ref={groupRef}>
      {/* Faint orbit ring around planet at this moon's radius */}
      <Sphere
        args={[size, 12, 12]}
        onPointerOver={(e) => {
          e.stopPropagation()
          setHovered(true)
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          setHovered(false)
          document.body.style.cursor = 'crosshair'
        }}
        onClick={(e) => {
          e.stopPropagation()
          window.open(repo.html_url, '_blank')
        }}
      >
        <meshStandardMaterial
          color={hovered ? '#ffffff' : color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.25}
          roughness={0.6}
          metalness={0.1}
        />
      </Sphere>

      {hovered && (
        <Html center distanceFactor={6} style={{ pointerEvents: 'none', zIndex: 100 }}>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '10px',
              background: 'rgba(0,0,15,0.95)',
              border: `1px solid ${color}66`,
              color: '#e0f4ff',
              padding: '6px 10px',
              borderRadius: '3px',
              whiteSpace: 'nowrap',
              boxShadow: `0 0 12px ${color}33`,
            }}
          >
            <div style={{ color, fontWeight: 'bold', marginBottom: 2 }}>{repo.name}</div>
            <div style={{ color: '#ffd700' }}>★ {repo.stargazers_count}</div>
            <div style={{ color: '#666', fontSize: 9, marginTop: 2 }}>click to open →</div>
          </div>
        </Html>
      )}
    </group>
  )
}
