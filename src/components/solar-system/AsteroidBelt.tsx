'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { GitHubRepo } from '@/types'

// Category colours
const CAT_COLORS = {
  fork:      new THREE.Color('#4499ff'),   // blue   — forks
  starred:   new THREE.Color('#ffd700'),   // gold   — high-starred repos
  abandoned: new THREE.Color('#ff6644'),   // orange — abandoned repos
  default:   new THREE.Color('#667788'),   // grey   — everything else
}

interface AsteroidBeltProps {
  repos: GitHubRepo[]
  innerRadius: number
  outerRadius: number
}

function categorise(repo: GitHubRepo): keyof typeof CAT_COLORS {
  if (repo.fork) return 'fork'
  const daysSince = Math.floor((Date.now() - new Date(repo.pushed_at).getTime()) / 86400000)
  if (repo.stargazers_count >= 10) return 'starred'
  if (daysSince > 365) return 'abandoned'
  return 'default'
}

export function AsteroidBelt({ repos, innerRadius, outerRadius }: AsteroidBeltProps) {
  const meshRef = useRef<THREE.Points>(null)

  // Min 120 asteroids even for users with few repos
  const baseCount = Math.max(120, Math.min(repos.length * 4, 400))

  // Build per-asteroid data: [radius, angSpeed, yOff, r, g, b]
  const { meta, angles, positions, colors } = useMemo(() => {
    const meta    = new Float32Array(baseCount * 3)  // radius, angSpeed, yOff
    const angles  = new Float32Array(baseCount)
    const positions = new Float32Array(baseCount * 3)
    const colors  = new Float32Array(baseCount * 3)

    for (let i = 0; i < baseCount; i++) {
      const r   = innerRadius + Math.random() * (outerRadius - innerRadius)
      const spd = (Math.random() * 0.014 + 0.003) * (Math.random() > 0.5 ? 1 : -1)
      const yOff = (Math.random() - 0.5) * 1.1
      const ang  = Math.random() * Math.PI * 2

      meta[i * 3]     = r
      meta[i * 3 + 1] = spd
      meta[i * 3 + 2] = yOff
      angles[i]        = ang

      positions[i * 3]     = Math.cos(ang) * r
      positions[i * 3 + 1] = yOff
      positions[i * 3 + 2] = Math.sin(ang) * r

      // Assign a category based on a repo if available, else cycle defaults
      let col: THREE.Color
      if (repos.length > 0) {
        const repo = repos[i % repos.length]
        col = CAT_COLORS[categorise(repo)]
      } else {
        col = CAT_COLORS.default
      }

      colors[i * 3]     = col.r
      colors[i * 3 + 1] = col.g
      colors[i * 3 + 2] = col.b
    }
    return { meta, angles, positions, colors }
  }, [baseCount, innerRadius, outerRadius, repos])

  useFrame((_, delta) => {
    if (!meshRef.current) return
    const posAttr = meshRef.current.geometry.attributes.position
    const arr = posAttr.array as Float32Array
    for (let i = 0; i < baseCount; i++) {
      angles[i] += meta[i * 3 + 1] * delta
      const r = meta[i * 3]
      arr[i * 3]     = Math.cos(angles[i]) * r
      arr[i * 3 + 1] = meta[i * 3 + 2]
      arr[i * 3 + 2] = Math.sin(angles[i]) * r
    }
    posAttr.needsUpdate = true
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.75}
      />
    </points>
  )
}

// Stats overlay panel — pure React, rendered outside Canvas
interface BeltStatsProps {
  repos: GitHubRepo[]
}

export function BeltStats({ repos }: BeltStatsProps) {
  const forks     = repos.filter(r => r.fork).length
  const starred   = repos.filter(r => !r.fork && r.stargazers_count >= 10).length
  const abandoned = repos.filter(r => {
    const days = Math.floor((Date.now() - new Date(r.pushed_at).getTime()) / 86400000)
    return days > 365 && !r.fork
  }).length
  const totalIssues = repos.reduce((s, r) => s + r.open_issues_count, 0)
  const totalStars  = repos.reduce((s, r) => s + r.stargazers_count, 0)

  return (
    <div
      className="absolute bottom-20 right-4 hud-panel rounded p-3 w-52 text-xs font-mono"
      style={{ zIndex: 10 }}
    >
      <p className="text-gray-600 tracking-widest mb-2 text-xs">◈ ASTEROID BELT</p>
      <div className="space-y-1.5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#4499ff', boxShadow: '0 0 4px #4499ff' }} />
            <span className="text-gray-400">Forks</span>
          </div>
          <span style={{ color: '#4499ff' }}>{forks}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#ffd700', boxShadow: '0 0 4px #ffd70080' }} />
            <span className="text-gray-400">Starred ≥10</span>
          </div>
          <span style={{ color: '#ffd700' }}>{starred}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: '#ff6644', boxShadow: '0 0 4px #ff664480' }} />
            <span className="text-gray-400">Abandoned</span>
          </div>
          <span style={{ color: '#ff6644' }}>{abandoned}</span>
        </div>
        <div className="border-t border-white/5 pt-1.5 mt-1.5 space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Total ★</span>
            <span className="text-yellow-500">{totalStars.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Open issues</span>
            <span className="text-orange-400">{totalIssues.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
