'use client'

import { useRef, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Html } from '@react-three/drei'
import * as THREE from 'three'
import { useRouter } from 'next/navigation'
import type { StoredUniverse } from '@/types'

interface DistantUniverseOrbProps {
  universe: StoredUniverse
  isTop10: boolean
  cockpitMode?: boolean
  onTargetSelect?: (username: string) => void
}

function DistantUniverseOrb({ universe, isTop10, cockpitMode, onTargetSelect }: DistantUniverseOrbProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const router = useRouter()

  // Determine size from score
  const size = useMemo(() => {
    const base = isTop10 ? 1.2 : 0.3
    const scoreBonus = Math.min(universe.universe_score / 100000, 1.5)
    return base + scoreBonus * 0.5
  }, [isTop10, universe.universe_score])

  // Color based on dominant language (use a hash-based hue)
  const color = useMemo(() => {
    const h = (universe.universe_score * 137.508) % 360
    return `hsl(${h}, 70%, 60%)`
  }, [universe.universe_score])

  // Soft nebula haze — a few particle puffs around each system
  const nebulaPositions = useMemo(() => {
    const arr = new Float32Array(40 * 3)
    for (let i = 0; i < 40; i++) {
      const r = size * (2 + Math.random() * 4)
      const a = Math.random() * Math.PI * 2
      const b = (Math.random() - 0.5) * 0.8
      arr[i * 3]     = Math.cos(a) * Math.cos(b) * r
      arr[i * 3 + 1] = Math.sin(b) * r * 0.4
      arr[i * 3 + 2] = Math.sin(a) * Math.cos(b) * r
    }
    return arr
  }, [size])

  const driftOffset = useMemo(() => (universe.universe_score * 0.1) % (Math.PI * 2), [universe.universe_score])

  useFrame((state) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()
    groupRef.current.position.y =
      universe.position_y + Math.sin(t * 0.2 + driftOffset) * 2
    groupRef.current.rotation.y = t * 0.05
  })

  return (
    <group
      ref={groupRef}
      position={[universe.position_x, universe.position_y, universe.position_z]}
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

      {/* Soft nebula haze cloud around each system */}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nebulaPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={color}
          size={isTop10 ? 0.5 : 0.25}
          sizeAttenuation
          transparent
          opacity={hovered ? 0.35 : 0.12}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

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
          if (cockpitMode && onTargetSelect) {
            onTargetSelect(universe.username)
          } else {
            router.push(`/universe/${universe.username}`)
          }
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

      {/* Double Orbiting rings for top 10 */}
      {isTop10 && (
        <>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[size * 2.2, 0.02, 8, 64]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh rotation={[Math.PI / 2.5, Math.PI / 4, 0]}>
            <torusGeometry args={[size * 1.8, 0.015, 8, 64]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
          </mesh>
        </>
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
              @{universe.username}
            </div>
            <div className="font-mono text-xs text-gray-400">
              Score: {universe.universe_score.toLocaleString()}
            </div>
            <div className="font-mono text-xs text-gray-600">
              ★ {universe.total_stars.toLocaleString()} · {universe.total_repos} repos
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
  top10Usernames: string[]
  cockpitMode?: boolean
  onTargetSelect?: (username: string) => void
}

export function DistantUniverses({ universes, top10Usernames, cockpitMode, onTargetSelect }: DistantUniversesProps) {
  return (
    <>
      {universes.map((u) => (
        <DistantUniverseOrb
          key={u.id || u.username}
          universe={u}
          isTop10={top10Usernames.includes(u.username)}
          cockpitMode={cockpitMode}
          onTargetSelect={onTargetSelect}
        />
      ))}
    </>
  )
}
