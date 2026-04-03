'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { GitHubRepo } from '@/types'
import { AsteroidMaterial } from './AsteroidMaterial'

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

  // Build per-asteroid data for GPU
  const { radii, speeds, offsets, ys, colors } = useMemo(() => {
    const radii   = new Float32Array(baseCount)
    const speeds  = new Float32Array(baseCount)
    const offsets = new Float32Array(baseCount)
    const ys      = new Float32Array(baseCount)
    const colors  = new Float32Array(baseCount * 3)

    for (let i = 0; i < baseCount; i++) {
      const r   = innerRadius + Math.random() * (outerRadius - innerRadius)
      const spd = (Math.random() * 0.014 + 0.003) * (Math.random() > 0.5 ? 1 : -1)
      const yOff = (Math.random() - 0.5) * 1.5
      const ang  = Math.random() * Math.PI * 2

      radii[i]   = r
      speeds[i]  = spd
      offsets[i] = ang
      ys[i]      = yOff

      // Assign a category
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
    return { radii, speeds, offsets, ys, colors }
  }, [baseCount, innerRadius, outerRadius, repos])

  useFrame((state) => {
    if (meshRef.current?.material) {
      (meshRef.current.material as any).uTime = state.clock.elapsedTime
    }
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        {/* We still need an initial position array for three.js points, but shader will override it */}
        <bufferAttribute attach="attributes-position" args={[new Float32Array(baseCount * 3), 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
        <bufferAttribute attach="attributes-aRadius"   args={[radii, 1]} />
        <bufferAttribute attach="attributes-aSpeed"    args={[speeds, 1]} />
        <bufferAttribute attach="attributes-aOffset"   args={[offsets, 1]} />
        <bufferAttribute attach="attributes-aY"        args={[ys, 1]} />
      </bufferGeometry>
      <asteroidMaterial 
        key={radii.length}
        uOpacity={0.6}
        uSize={0.15}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
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
