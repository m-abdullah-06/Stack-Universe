'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Ring, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import type { GitHubRepo, RepoTier } from '@/types'
import { getLanguageColor } from '@/lib/language-colors'
import { getDaysSinceActivity, getOrbitSpeed } from '@/lib/universe-score'

interface LangMoonProps {
  color: string
  moonSize: number
  orbitRadius: number
  offset: number
  speed: number
}

function LangMoon({ color, moonSize, orbitRadius, offset, speed }: LangMoonProps) {
  const ref   = useRef<THREE.Group>(null)
  const angle = useRef(offset)
  useFrame((_, dt) => {
    angle.current += speed * dt
    if (ref.current) {
      ref.current.position.set(
        Math.cos(angle.current) * orbitRadius,
        Math.sin(angle.current * 0.4) * orbitRadius * 0.12,
        Math.sin(angle.current) * orbitRadius,
      )
    }
  })
  return (
    <group ref={ref}>
      <Sphere args={[moonSize, 8, 8]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} roughness={0.7} />
      </Sphere>
    </group>
  )
}

interface RepoPlanetProps {
  repo: GitHubRepo
  tier: RepoTier
  orbitRadius: number
  offset: number
  index: number
  repoLanguages?: Record<string, number>
  onSelect?: (repo: GitHubRepo | null) => void
  isSelected?: boolean
}

export function RepoPlanet({
  repo, tier, orbitRadius, offset, index,
  repoLanguages, onSelect, isSelected,
}: RepoPlanetProps) {
  const groupRef  = useRef<THREE.Group>(null)
  const planetRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const angleRef  = useRef(offset)

  const color      = getLanguageColor(repo.language ?? '')
  const daysSince  = getDaysSinceActivity(repo.pushed_at)
  const speed      = getOrbitSpeed(daysSince) * (tier === 1 ? 0.22 : tier === 2 ? 0.18 : 0.14)
  const hasRings   = repo.stargazers_count >= 50 && tier === 1

  const size = useMemo(() => {
    const log = Math.log10(repo.stargazers_count + 1) * 0.55
    if (tier === 1) return Math.max(0.55, Math.min(1.8, 0.55 + log))
    if (tier === 2) return Math.max(0.30, Math.min(0.95, 0.30 + log * 0.65))
    return Math.max(0.14, Math.min(0.36, 0.14 + log * 0.28))
  }, [repo.stargazers_count, tier])

  const langMoons = useMemo(() => {
    if (tier !== 1 || !repoLanguages) return []
    const total = Object.values(repoLanguages).reduce((s, v) => s + v, 0)
    return Object.entries(repoLanguages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([lang, bytes], mi) => ({
        lang,
        color: getLanguageColor(lang),
        moonSize: Math.max(0.05, Math.min(0.18, (bytes / total) * 0.6)),
        orbitRadius: size * 2.3 + mi * size * 0.85,
        offset: mi * (Math.PI / 2),
        speed: 0.9 - mi * 0.15,
      }))
  }, [tier, repoLanguages, size])

  useFrame((_, delta) => {
    if (isSelected) return
    angleRef.current += speed * delta
    if (groupRef.current) {
      const tilt = (index % 5) * 0.08
      groupRef.current.position.set(
        Math.cos(angleRef.current) * orbitRadius,
        Math.sin(angleRef.current + tilt) * orbitRadius * 0.06,
        Math.sin(angleRef.current) * orbitRadius,
      )
    }
    if (planetRef.current) planetRef.current.rotation.y += delta * 0.45
  })

  return (
    <group ref={groupRef}>
      {/* Orbit ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[orbitRadius - 0.02, orbitRadius + 0.02, 96]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={hovered || isSelected ? 0.2 : 0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      <group>
        {/* Atmosphere */}
        {tier <= 2 && (
          <Sphere args={[size * 1.45, 16, 16]}>
            <meshBasicMaterial
              color={color}
              transparent
              opacity={hovered || isSelected ? 0.13 : 0.05}
              side={THREE.BackSide}
            />
          </Sphere>
        )}

        {/* Planet body */}
        <Sphere
          ref={planetRef}
          args={[size, tier === 1 ? 32 : tier === 2 ? 20 : 10, tier === 1 ? 32 : tier === 2 ? 20 : 10]}
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
            if (onSelect) {
              onSelect(isSelected ? null : repo)
            } else {
              window.open(repo.html_url, '_blank', 'noopener')
            }
          }}
        >
          {tier === 1 ? (
            <MeshDistortMaterial
              color={color}
              emissive={color}
              emissiveIntensity={hovered || isSelected ? 0.55 : 0.2}
              distort={0.08}
              speed={1.5}
              roughness={0.6}
            />
          ) : (
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={hovered ? 0.4 : 0.15}
              roughness={0.7}
            />
          )}
        </Sphere>

        {/* Rings for 50+ stars */}
        {hasRings && (
          <>
            <Ring args={[size * 1.65, size * 2.1, 64]} rotation={[Math.PI * 0.28, 0.3, 0]}>
              <meshBasicMaterial color={color} transparent opacity={0.35} side={THREE.DoubleSide} />
            </Ring>
            <Ring args={[size * 2.2, size * 2.5, 64]} rotation={[Math.PI * 0.28, 0.3, 0]}>
              <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
            </Ring>
          </>
        )}

        {/* Selected pulse ring */}
        {isSelected && (
          <Ring args={[size * 1.8, size * 2.0, 64]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial color={color} transparent opacity={0.45} side={THREE.DoubleSide} />
          </Ring>
        )}

        {/* Language moons — tier 1 selected only */}
        {tier === 1 && isSelected && langMoons.map((m, mi) => (
          <LangMoon key={m.lang + mi} {...m} />
        ))}
      </group>
    </group>
  )
}
