'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { GitHubRepo } from '@/types'

// ── Pure 3D belt mesh — NO DOM elements, safe inside Canvas ──────────────────
interface TierBeltMeshProps {
  innerRadius: number
  outerRadius: number
  repoCount: number
  onHover: (hovered: boolean, clientX?: number, clientY?: number) => void
  onClick: () => void
}

export function TierBeltMesh({
  innerRadius, outerRadius, repoCount, onHover, onClick,
}: TierBeltMeshProps) {
  const ref   = useRef<THREE.Points>(null)
  const count = Math.min(repoCount * 5 + 120, 500)

  const { meta, angles, positions } = useMemo(() => {
    const meta      = new Float32Array(count * 2)
    const angles    = new Float32Array(count)
    const positions = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r   = innerRadius + Math.random() * (outerRadius - innerRadius)
      const spd = (Math.random() * 0.012 + 0.003) * (Math.random() > 0.5 ? 1 : -1)
      const ang = Math.random() * Math.PI * 2
      meta[i * 2]      = r
      meta[i * 2 + 1]  = spd
      angles[i]         = ang
      positions[i * 3]     = Math.cos(ang) * r
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1.2
      positions[i * 3 + 2] = Math.sin(ang) * r
    }
    return { meta, angles, positions }
  }, [count, innerRadius, outerRadius])

  useFrame((_, delta) => {
    if (!ref.current) return
    const arr = ref.current.geometry.attributes.position.array as Float32Array
    for (let i = 0; i < count; i++) {
      angles[i] += meta[i * 2 + 1] * delta
      const r = meta[i * 2]
      arr[i * 3]     = Math.cos(angles[i]) * r
      arr[i * 3 + 2] = Math.sin(angles[i]) * r
    }
    ref.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <>
      {/* Visible particles */}
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color="#aabbcc"
          size={0.1}
          sizeAttenuation
          transparent
          opacity={0.6}
        />
      </points>

      {/* Invisible torus — pointer target */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
          onHover(true, e.clientX, e.clientY)
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'crosshair'
          onHover(false)
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          onClick()
        }}
      >
        <torusGeometry args={[
          (innerRadius + outerRadius) / 2,
          (outerRadius - innerRadius) / 2,
          4,
          80,
        ]} />
        <meshBasicMaterial transparent opacity={0.001} depthWrite={false} />
      </mesh>
    </>
  )
}

// ── DOM overlays — rendered OUTSIDE Canvas by SolarSystemScene ────────────────
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getLanguageColor } from '@/lib/language-colors'

interface BeltHoverLabelProps {
  count: number
  x: number
  y: number
}

export function BeltHoverLabel({ count, x, y }: BeltHoverLabelProps) {
  return (
    <div style={{
      position: 'fixed',
      left: Math.min(x + 14, window.innerWidth - 260),
      top: Math.max(y - 40, 8),
      zIndex: 500,
      pointerEvents: 'none',
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: '11px',
      background: 'rgba(0,0,15,0.95)',
      border: '1px solid rgba(170,187,204,0.4)',
      color: '#aabbcc',
      padding: '6px 12px',
      borderRadius: '3px',
      whiteSpace: 'nowrap',
    }}>
      {count} more repositories — click to browse
    </div>
  )
}

interface BeltRepoPanelProps {
  repos: GitHubRepo[]
  onClose: () => void
}

export function BeltRepoPanel({ repos, onClose }: BeltRepoPanelProps) {
  return (
    <motion.div
      className="absolute top-1/2 right-4 -translate-y-1/2 hud-panel rounded overflow-hidden w-72"
      style={{ zIndex: 40, maxHeight: '70vh' }}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
    >
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-blue-400 to-transparent" />
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
        <div>
          <p className="font-mono text-xs text-gray-600 tracking-widest">OUTER BELT</p>
          <p className="font-orbitron font-bold text-sm text-white">
            {repos.length} more repositories
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-700 hover:text-white font-mono text-xs transition-colors"
        >
          ✕
        </button>
      </div>

      <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 80px)' }}>
        {repos.map(repo => (
          <a
            key={repo.id}
            href={repo.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-4 py-2 hover:bg-white/5 transition-colors group border-b border-white/3"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{
                  background: getLanguageColor(repo.language ?? ''),
                  boxShadow: `0 0 4px ${getLanguageColor(repo.language ?? '')}`,
                }}
              />
              <span className="font-mono text-xs text-gray-300 truncate group-hover:text-white transition-colors">
                {repo.name}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              {repo.language && (
                <span className="font-mono text-xs text-gray-700">{repo.language}</span>
              )}
              <span className="font-mono text-xs text-yellow-500">★{repo.stargazers_count}</span>
            </div>
          </a>
        ))}
      </div>
    </motion.div>
  )
}
