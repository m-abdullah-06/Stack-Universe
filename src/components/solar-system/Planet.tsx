'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Ring, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { Moon } from './Moon'
import type { LanguageData } from '@/types'
import { getOrbitSpeed } from '@/lib/universe-score'
import { useUniverseStore } from '@/store'
import { QueryPulseRing, QueryMatchBeacon } from './RepoPlanet'

interface PlanetProps {
  language: LanguageData
  orbitRadius: number
  size: number
  offset: number
  index: number
  onSelect: (lang: LanguageData | null) => void
  onHover: (lang: LanguageData | null) => void
  isSelected: boolean
}

const ORBIT_TILTS = [0, 5, -8, 12, -6, 15, -10, 8, -14, 11, -5, 7]

export function Planet({
  language,
  orbitRadius,
  size,
  offset,
  index,
  onSelect,
  onHover,
  isSelected,
}: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null)
  const planetRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const angleRef = useRef(offset)

  const { queriedPlanetNames } = useUniverseStore()

  const orbitSpeed = useMemo(
    () => getOrbitSpeed(language.daysSinceActivity) * 0.3,
    [language.daysSinceActivity]
  )

  // Pulse if ANY repo in this language matches the query
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
  const isQueryMatch = useMemo(() => {
    if (queriedPlanetNames.length === 0) return false
    const matchSet = new Set(queriedPlanetNames.map(normalize))
    return language.repos.some(r => matchSet.has(normalize(r.name)))
  }, [queriedPlanetNames, language.repos])

  const tiltDeg = ORBIT_TILTS[index % ORBIT_TILTS.length]
  const tilt = (tiltDeg * Math.PI) / 180

  useFrame((_, delta) => {
    if (isSelected) return
    angleRef.current += orbitSpeed * delta
    const x = Math.cos(angleRef.current) * orbitRadius
    const z = Math.sin(angleRef.current) * orbitRadius
    const y = Math.sin(angleRef.current + tilt) * orbitRadius * 0.08
    if (groupRef.current) groupRef.current.position.set(x, y, z)
    if (planetRef.current) planetRef.current.rotation.y += delta * 0.5
  })

  // Moon sizing: much smaller, tighter orbits
  const moonCount = Math.min(language.repos.length, 4)
  const moonOrbitBase = size * 2.2   // was 3.5 — tighter
  const moonStep = size * 0.9        // was size * 1.5 — closer together

  return (
    <>
      {/* Orbit ring */}
      <Ring
        args={[orbitRadius - 0.03, orbitRadius + 0.03, 128]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshBasicMaterial
          color={language.color}
          transparent
          opacity={hovered || isSelected ? 0.25 : 0.07}
          side={THREE.DoubleSide}
        />
      </Ring>

      <group ref={groupRef}>
        {/* Glow halo */}
        <Sphere args={[size * 1.5, 16, 16]}>
          <meshBasicMaterial
            color={language.color}
            transparent
            opacity={hovered || isSelected ? 0.14 : 0.05}
            side={THREE.BackSide}
          />
        </Sphere>

        {/* Planet body */}
        <Sphere
          ref={planetRef}
          args={[size, 32, 32]}
          onPointerOver={(e) => {
            e.stopPropagation()
            setHovered(true)
            onHover(language)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            setHovered(false)
            onHover(null)
            document.body.style.cursor = 'crosshair'
          }}
          onClick={(e) => {
            e.stopPropagation()
            onSelect(isSelected ? null : language)
          }}
        >
          <MeshDistortMaterial
            color={language.color}
            emissive={language.color}
            emissiveIntensity={hovered || isSelected ? 0.55 : 0.2}
            distort={0.1}
            speed={1.5}
            roughness={0.6}
            metalness={0.1}
          />
        </Sphere>

        {/* Selected ring pulse */}
        {isSelected && (
          <Ring args={[size * 1.7, size * 1.9, 64]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial
              color={language.color}
              transparent
              opacity={0.4}
              side={THREE.DoubleSide}
            />
          </Ring>
        )}

        {/* AI Query Match Pulse & Beacon */}
        {isQueryMatch && (
          <group>
            <QueryPulseRing size={size} />
            <QueryMatchBeacon size={size} name={language.name} color={language.color} />
          </group>
        )}

        {/* Moons — fixed size, tighter orbit */}
        {isSelected &&
          language.repos.slice(0, moonCount).map((repo, i) => (
            <Moon
              key={repo.id}
              repo={repo}
              orbitRadius={moonOrbitBase + i * moonStep}
              orbitSpeed={1.0 - i * 0.18}
              size={Math.max(0.07, size * 0.12)}  // was 0.22 — much smaller
              offset={(i / moonCount) * Math.PI * 2}
              color={language.color}
            />
          ))}
      </group>
    </>
  )
}
