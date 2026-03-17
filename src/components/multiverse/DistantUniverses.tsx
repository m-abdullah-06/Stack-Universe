'use client'

import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useRouter } from 'next/navigation'
import type { StoredUniverse, LeaderboardEntry } from '@/types'

interface DistantUniverseOrbProps {
  username: string
  score: number
  stars: number
  repos: number
  x: number
  y: number
  z: number
  isTop10: boolean
  isGrand: boolean
}

function DistantUniverseOrb({ username, score, stars, repos, x, y, z, isTop10, isGrand }: DistantUniverseOrbProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const router = useRouter()

  // Determine size from score
  const size = useMemo(() => {
    const base = isGrand ? 2.5 : (isTop10 ? 1.2 : 0.3)
    const scoreBonus = Math.min(score / 100000, 1.5)
    return base + scoreBonus * 0.5
  }, [isTop10, isGrand, score])

  // Color based on dominant language (use a hash-based hue)
  const color = useMemo(() => {
    if (isGrand) return '#ffd700' // Gold for grand stars
    const h = (score * 137.508) % 360
    return `hsl(${h}, 70%, 60%)`
  }, [score, isGrand])

  // Slow drift
  const driftOffset = useMemo(() => Math.random() * 100, [])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    groupRef.current.position.y =
      y + Math.sin(t * 0.2 + driftOffset) * 2
    groupRef.current.rotation.y = t * 0.05
  })

  return (
    <group
      ref={groupRef}
      position={[x, y, z]}
    >
      {/* Outer glow */}
      <Sphere args={[size * 3, 8, 8]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.08 : 0.03}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Inner glow */}
      <Sphere args={[size * 1.8, 8, 8]}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered ? 0.15 : 0.06}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Main orb */}
      <Sphere
        args={[size, 16, 16]}
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
          router.push(`/${username}`)
        }}
      >
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 1.5 : isTop10 ? 0.8 : 0.4}
          roughness={0.3}
          metalness={0.1}
        />
      </Sphere>

      {/* Orbiting ring for top 10 */}
      {isTop10 && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[size * 2, 0.04, 8, 64]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} />
        </mesh>
      )}

      {/* Point light */}
      <pointLight
        color={color}
        intensity={hovered ? 1 : isTop10 ? 0.4 : 0.15}
        distance={30}
      />

      {/* Tooltip */}
      {hovered && (
        <Html center distanceFactor={20} style={{ pointerEvents: 'none', zIndex: 100 }}>
          <div className="planet-tooltip min-w-max text-center">
            <div className="font-orbitron font-bold text-sm mb-0.5" style={{ color }}>
              @{username}
            </div>
            <div className="font-mono text-xs text-gray-400">
              Score: {score.toLocaleString()}
            </div>
            <div className="font-mono text-xs text-gray-600">
              ★ {stars.toLocaleString()} · {repos} repos
            </div>
            {isTop10 && (
              <div className="text-space-gold text-xs mt-1 font-bold">★ HALL OF GIANTS</div>
            )}
            <div className="text-gray-700 text-xs mt-1">Click to enter universe →</div>
          </div>
        </Html>
      )}
    </group>
  )
}

interface DistantUniversesProps {
  universes: StoredUniverse[]
  leaderboard: LeaderboardEntry[]
}

export function DistantUniverses({ universes, leaderboard }: DistantUniversesProps) {
  const top10Usernames = useMemo(() => leaderboard.map((l) => l.username), [leaderboard])

  const combined = useMemo(() => {
    const map = new Map<string, DistantUniverseOrbProps>()
    
    // 1. Add stored universes
    universes.forEach((u) => {
      map.set(u.username, {
        username: u.username,
        score: u.universe_score,
        stars: u.total_stars,
        repos: u.total_repos,
        x: u.position_x,
        y: u.position_y,
        z: u.position_z,
        isTop10: top10Usernames.includes(u.username),
        isGrand: false,
      })
    })

    // 2. Add leaderboard "giants" as very prominent stars if not already rendered
    // If they exist, upgrade them to "Grand"
    leaderboard.forEach((l, i) => {
      if (map.has(l.username)) {
        const existing = map.get(l.username)!
        existing.isGrand = true
        // Optionally push them further out or bring them closer so they stand out
      } else {
        // Compute a grand position: array of them in a halo
        const angle = (i / leaderboard.length) * Math.PI * 2
        // Make them prominently visible but far out
        const radius = 60 + (i % 3) * 15
        map.set(l.username, {
          username: l.username,
          score: l.universe_score,
          stars: l.total_stars,
          repos: l.total_repos,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle * 3) * 10,
          z: Math.sin(angle) * radius,
          isTop10: true,
          isGrand: true,
        })
      }
    })

    return Array.from(map.values())
  }, [universes, leaderboard, top10Usernames])

  return (
    <>
      {combined.map((orb) => (
        <DistantUniverseOrb key={orb.username} {...orb} />
      ))}
    </>
  )
}
