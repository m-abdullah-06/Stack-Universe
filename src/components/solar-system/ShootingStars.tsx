'use client'

import { useRef, useState, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { CommitData } from '@/types'

// Generic messages used when no real commits available
const GENERIC_MESSAGES = [
  'feat: add new feature',
  'fix: resolve edge case bug',
  'refactor: improve code structure',
  'docs: update README',
  'chore: dependency updates',
  'perf: optimize rendering',
  'style: code formatting',
  'test: add unit tests',
]

interface SingleStarProps {
  commit: CommitData
  index: number
  isReal: boolean
  onHover: (commit: CommitData | null, screenX: number, screenY: number) => void
}

function DataPacket({ commit, index, isReal, onHover }: SingleStarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const pausedRef = useRef(false)
  const tRef = useRef(Math.random())

  const traj = useMemo(() => {
    const seed = index * 137.5 + 42
    const a0 = seed % (Math.PI * 2)
    const a1 = a0 + Math.PI * (0.6 + (index % 3) * 0.3)
    const r0 = 25 + (index % 6) * 12
    return {
      x0: Math.cos(a0) * r0,
      y0: (Math.random() - 0.5) * 40,
      z0: Math.sin(a0) * r0,
      x1: Math.cos(a1) * r0 * 0.2,
      y1: (Math.random() - 0.5) * 10,
      z1: Math.sin(a1) * r0 * 0.2,
      speed: 0.02 + (index % 4) * 0.015,
    }
  }, [index])

  useFrame((_, delta) => {
    if (pausedRef.current) return
    tRef.current = (tRef.current + delta * traj.speed) % 1
    const t = tRef.current
    if (!groupRef.current) return

    const x = traj.x0 + (traj.x1 - traj.x0) * t
    const y = traj.y0 + (traj.y1 - traj.y0) * t
    const z = traj.z0 + (traj.z1 - traj.z0) * t
    groupRef.current.position.set(x, y, z)

    // Snap rotation to movement direction
    const nt = Math.min(t + 0.01, 1)
    const dir = new THREE.Vector3(
      traj.x0 + (traj.x1 - traj.x0) * nt - x,
      traj.y0 + (traj.y1 - traj.y0) * nt - y,
      traj.z0 + (traj.z1 - traj.z0) * nt - z,
    ).normalize()
    groupRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
  })

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setHovered(true)
    pausedRef.current = true
    document.body.style.cursor = 'pointer'
    onHover(commit, e.clientX, e.clientY)
  }, [commit, onHover])

  const handlePointerOut = useCallback(() => {
    setHovered(false)
    pausedRef.current = false
    document.body.style.cursor = 'crosshair'
    onHover(null, 0, 0)
  }, [onHover])

  const color = isReal ? '#00e5ff' : '#ff00e5'

  return (
    <group ref={groupRef}>
      {/* Packet Head — sharp technical cube */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={(e) => { e.stopPropagation(); if (commit.repoUrl) window.open(commit.repoUrl, '_blank') }}
      >
        <boxGeometry args={[0.15, 0.15, 0.25]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* Glitch Trail — Series of segments */}
      {Array.from({ length: 4 }).map((_, i) => (
        <mesh key={i} position={[0, 0, -(i + 1) * 0.4]}>
          <boxGeometry args={[0.04, 0.04, 0.3]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            opacity={0.4 / (i + 1)} 
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Glow */}
      <pointLight color={color} intensity={hovered ? 2 : 0.5} distance={5} decay={2} />
    </group>
  )
}

export interface CommitTooltipState {
  commit: CommitData
  x: number
  y: number
  isReal: boolean
}

interface ShootingStarsProps {
  commits: CommitData[]
  repos?: Array<{ name: string; html_url: string }>
  onTooltip: (state: CommitTooltipState | null) => void
}

export function ShootingStars({ commits, repos = [], onTooltip }: ShootingStarsProps) {
  // Build display commits — real ones first, pad with generic if needed
  const stars = useMemo(() => {
    if (commits.length >= 8) return { data: commits.slice(0, 15), realCount: commits.length }

    // Pad with generic commits using real repo names if available
    const generic: CommitData[] = Array.from({ length: Math.max(0, 10 - commits.length) }, (_, i) => {
      const repo = repos[i % Math.max(repos.length, 1)]
      return {
        sha: `generic-${i}`,
        message: GENERIC_MESSAGES[i % GENERIC_MESSAGES.length],
        date: new Date(Date.now() - i * 86400000 * 3).toISOString(),
        repoName: repo?.name ?? 'repository',
        repoUrl: repo?.html_url ?? '',
      }
    })

    return {
      data: [...commits, ...generic].slice(0, 15),
      realCount: commits.length,
    }
  }, [commits, repos])

  const handleHover = useCallback((commit: CommitData | null, x: number, y: number) => {
    if (!commit) {
      onTooltip(null)
    } else {
      const isReal = !commit.sha.startsWith('generic-')
      onTooltip({ commit, x, y, isReal })
    }
  }, [onTooltip])

  return (
    <>
      {stars.data.map((commit, i) => (
        <DataPacket
          key={commit.sha + i}
          commit={commit}
          index={i}
          isReal={!commit.sha.startsWith('generic-')}
          onHover={handleHover}
        />
      ))}
    </>
  )
}

