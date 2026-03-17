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

function SingleStar({ commit, index, isReal, onHover }: SingleStarProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const pausedRef = useRef(false)

  const traj = useMemo(() => {
    const seed = index * 137.5 + 42
    const a0 = seed % (Math.PI * 2)
    const a1 = a0 + Math.PI * (0.5 + (index % 4) * 0.2)
    const r0 = 18 + (index % 5) * 8
    return {
      x0: Math.cos(a0) * r0,
      y0: Math.sin(seed * 0.7) * 18,
      z0: Math.sin(a0) * r0,
      x1: Math.cos(a1) * r0 * 0.35,
      y1: Math.sin(seed * 0.7) * 7,
      z1: Math.sin(a1) * r0 * 0.35,
      speed: 0.035 + (index % 5) * 0.008,
    }
  }, [index])

  const tRef = useRef(Math.random())

  useFrame((_, delta) => {
    if (pausedRef.current) return
    tRef.current = (tRef.current + delta * traj.speed) % 1
    const t = tRef.current
    if (!groupRef.current) return

    const x = traj.x0 + (traj.x1 - traj.x0) * t
    const y = traj.y0 + (traj.y1 - traj.y0) * t
    const z = traj.z0 + (traj.z1 - traj.z0) * t
    groupRef.current.position.set(x, y, z)

    if (t < 0.98) {
      const nt = Math.min(t + 0.015, 1)
      const dir = new THREE.Vector3(
        traj.x0 + (traj.x1 - traj.x0) * nt - x,
        traj.y0 + (traj.y1 - traj.y0) * nt - y,
        traj.z0 + (traj.z1 - traj.z0) * nt - z,
      )
      if (dir.lengthSq() > 0.0001) {
        dir.normalize()
        groupRef.current.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
      }
    }
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

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    if (commit.repoUrl) {
      window.open(commit.repoUrl, '_blank', 'noopener,noreferrer')
    }
  }, [commit])

  return (
    <group ref={groupRef}>
      {/* Visible head */}
      <mesh>
        <sphereGeometry args={[0.22, 8, 8]} />
        <meshBasicMaterial color={hovered ? '#ffffff' : (isReal ? '#ff006e' : '#ff006e99')} />
      </mesh>

      {/* Large invisible hover target — stays opaque to raycaster */}
      <mesh
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
        renderOrder={999}
      >
        <sphereGeometry args={[1.4, 8, 8]} />
        <meshBasicMaterial
          transparent
          opacity={0.001}   // near-zero but NOT zero — avoids Three.js transparency culling
          depthWrite={false}
          side={THREE.FrontSide}
        />
      </mesh>

      {/* Trail */}
      <mesh position={[0, 0, -2.0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.012, 0.08, 4.0, 4]} />
        <meshBasicMaterial color="#ff006e" transparent opacity={hovered ? 0.8 : 0.35} />
      </mesh>

      <pointLight color="#ff006e" intensity={hovered ? 1.5 : 0.3} distance={6} decay={2} />
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
        <SingleStar
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

