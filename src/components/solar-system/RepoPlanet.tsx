'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Ring, MeshDistortMaterial, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { GitHubRepo, RepoTier, PullRequest } from '@/types'
import { getLanguageColor } from '@/lib/language-colors'
import { getDaysSinceActivity, getOrbitSpeed } from '@/lib/universe-score'
import { calcRepoHealth } from '@/lib/repo-health'

// ── Language moon ─────────────────────────────────────────────────────────────
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
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.3}
          roughness={0.7}
        />
      </Sphere>
    </group>
  )
}

// ── Storm cloud layer (Simplified for tech-only look) ──────────────────────────
function StormLayer({ size, color }: { size: number; color: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.getElapsedTime() * 0.15
    }
  })
  return (
    <Sphere ref={ref} args={[size * 1.05, 12, 12]}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.1}
        wireframe
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Sphere>
  )
}

// ── Dormant/Technical Overlay ────────────────────────────────────────────────
function TechnicalOverlay({ size, color }: { size: number; color: string }) {
  return (
    <Sphere args={[size * 1.02, 12, 12]}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.15}
        wireframe
        depthWrite={false}
      />
    </Sphere>
  )
}

// ── Commit velocity ring — 3D segments floating above planet ─────────────────
interface VelocityRing3DProps {
  months: number[]   // 12 values, oldest first
  size: number
  color: string
}

function VelocityRing3D({ months, size, color }: VelocityRing3DProps) {
  const max = Math.max(...months, 1)
  const segCount = 12
  const ringR = size * 1.55 // Move closer for "fixed" look

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      {months.map((val, i) => {
        const angle = (i / segCount) * Math.PI * 2
        const fill = val / max
        const active = val > 0

        return (
          <mesh
            key={i}
            rotation={[0, 0, angle]}
          >
            {/* Segment is a thin arc segment */}
            <Ring args={[ringR, ringR + (active ? 0.08 * fill : 0.02), 32, 1, angle, (Math.PI * 2 / segCount) * 0.8]}>
              <meshBasicMaterial
                color={active ? color : '#223344'}
                transparent
                opacity={active ? 0.2 + fill * 0.5 : 0.1}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </Ring>
          </mesh>
        )
      })}
    </group>
  )
}

function SimpleVelocityRing({ size, color }: { size: number; color: string }) {
  return (
    <Ring args={[size * 1.4, size * 1.41, 32]} rotation={[-Math.PI / 2, 0, 0]}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </Ring>
  )
}

// ── Fixed PR Indicator (replaces orbiting moons) ───────────────────────────
function StaticPRIndicator({ pr, orbitRadius, index, total }: {
  pr: PullRequest; orbitRadius: number; index: number; total: number
}) {
  const angle = (index / total) * Math.PI * 2
  const [hovered, setHovered] = useState(false)
  
  const stale = (Date.now() - new Date(pr.created_at).getTime()) > 30 * 86400000
  const color = pr.draft ? '#888844' : (stale ? '#aa7700' : '#ffd700')

  return (
    <group
      position={[
        Math.cos(angle) * orbitRadius,
        0,
        Math.sin(angle) * orbitRadius
      ]}
    >
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'crosshair' }}
        onClick={(e) => { e.stopPropagation(); window.open(pr.html_url, '_blank', 'noopener') }}
      >
        <boxGeometry args={[0.08, 0.08, 0.08]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>

      {hovered && (
        <Html center distanceFactor={6} style={{ pointerEvents: 'none', zIndex: 300 }}>
          <div className="bg-[#05050f]/95 border border-white/10 p-2 rounded shadow-2xl min-w-[150px]">
            <div className="font-mono text-[9px] font-bold" style={{ color }}>#{pr.number}</div>
            <div className="text-[8px] text-gray-400 mt-1">{pr.title}</div>
          </div>
        </Html>
      )}
    </group>
  )
}

// ── Main planet ───────────────────────────────────────────────────────────────
interface RepoPlanetProps {
  repo: GitHubRepo
  tier: RepoTier
  orbitRadius: number
  offset: number
  index: number
  repoLanguages?: Record<string, number>
  commitMonths?: number[]          // 12-bucket activity (tier 1 only)
  openPRs?: PullRequest[]          // open PRs (tier 1 only)
  isGraveyard?: boolean
  onSelect?: (repo: GitHubRepo | null) => void
  isSelected?: boolean
}

export function RepoPlanet({
  repo, tier, orbitRadius, offset, index,
  repoLanguages, commitMonths, openPRs,
  isGraveyard = false, onSelect, isSelected,
}: RepoPlanetProps) {
  const groupRef  = useRef<THREE.Group>(null)
  const planetRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const angleRef  = useRef(offset)

  const baseColor  = getLanguageColor(repo.language ?? '')
  const daysSince  = getDaysSinceActivity(repo.pushed_at)

  // Graveyard repos drift much slower than normal
  const orbitSpeed = isGraveyard
    ? 0.012 + (index % 4) * 0.003
    : getOrbitSpeed(daysSince) * (tier === 1 ? 0.22 : tier === 2 ? 0.18 : 0.14)

  const hasRings = repo.stargazers_count >= 50 && tier === 1 && !isGraveyard

  // Graveyard forces dormant health regardless of actual score
  const health = useMemo(
    () => isGraveyard
      ? { score: 0, tier: 'dormant' as const, label: 'Dead', color: '#3a3a4a',
          breakdown: [] }
      : calcRepoHealth(repo),
    [repo, isGraveyard]
  )

  const size = useMemo(() => {
    const log = Math.log10(repo.stargazers_count + 1) * 0.55
    if (tier === 1) return Math.max(0.55, Math.min(1.8, 0.55 + log))
    if (tier === 2) return Math.max(0.30, Math.min(0.95, 0.30 + log * 0.65))
    return Math.max(0.14, Math.min(0.36, 0.14 + log * 0.28))
  }, [repo.stargazers_count, tier])

  // Visual properties derived from health tier
  const { planetColor, atmosColor, atmosOpacity, emissiveIntensity, distort, distortSpeed } =
    useMemo(() => {
      switch (health.tier) {
        case 'thriving':
          return {
            planetColor:      baseColor,
            atmosColor:       '#aaffdd',
            atmosOpacity:     hovered || isSelected ? 0.22 : 0.12,
            emissiveIntensity: hovered || isSelected ? 0.85 : 0.40,
            distort:           0.04,
            distortSpeed:      1.0,
          }
        case 'struggling':
          return {
            planetColor:      baseColor,
            atmosColor:       '#ff3311',
            atmosOpacity:     hovered || isSelected ? 0.25 : 0.14,
            emissiveIntensity: hovered || isSelected ? 0.50 : 0.18,
            distort:           0.18,
            distortSpeed:      2.5,
          }
        case 'dormant':
        default:
          // Desaturate by mixing toward dark grey
          return {
            planetColor:      '#2a2a35',
            atmosColor:       '#1a1a25',
            atmosOpacity:     hovered || isSelected ? 0.12 : 0.05,
            emissiveIntensity: hovered || isSelected ? 0.15 : 0.04,
            distort:           0.02,
            distortSpeed:      0.4,
          }
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [health.tier, baseColor, hovered, isSelected])

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

  useFrame((state, delta) => {
    if (isSelected) return
    angleRef.current += orbitSpeed * delta
    if (groupRef.current) {
      const tilt = (index % 5) * 0.08
      groupRef.current.position.set(
        Math.cos(angleRef.current) * orbitRadius,
        Math.sin(angleRef.current + tilt) * orbitRadius * 0.06,
        Math.sin(angleRef.current) * orbitRadius,
      )
    }
    if (planetRef.current) {
      // Graveyard and dormant planets wobble slowly
      if (isGraveyard || health.tier === 'dormant') {
        planetRef.current.rotation.y += delta * 0.05
        planetRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.3 + index) * 0.09
      } else {
        planetRef.current.rotation.y += delta * 0.45
      }
    }
  })

  return (
    <>
      {/* Orbit ring — fixed at system center, stays visible while planet revolves */}
      <Ring 
        args={[orbitRadius - 0.02, orbitRadius + 0.02, isGraveyard ? 24 : 128]} 
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshBasicMaterial
          color={isGraveyard ? '#1a1a2a' : planetColor}
          transparent
          opacity={isGraveyard
            ? (hovered || isSelected ? 0.08 : 0.02)
            : (hovered || isSelected ? 0.25 : 0.06)}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </Ring>

      <group ref={groupRef}>
        <group>
        {/* Atmosphere — health-tinted, none for graveyard */}
        {tier <= 2 && !isGraveyard && (
          <Sphere args={[size * 1.45, 16, 16]}>
            <meshBasicMaterial
              color={atmosColor}
              transparent
              opacity={atmosOpacity}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </Sphere>
        )}

        {/* Storm clouds — struggling tier 1 only */}
        {health.tier === 'struggling' && tier === 1 && !isGraveyard && (
          <StormLayer size={size} color={planetColor} />
        )}

        {/* Planet body — Optimized Technical Glow */}
        <Sphere
          ref={planetRef}
          args={[size, 
            isGraveyard ? 12 : (tier === 1 ? 24 : tier === 2 ? 16 : 8),
            isGraveyard ? 12 : (tier === 1 ? 24 : tier === 2 ? 16 : 8)]}
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
            if (onSelect) onSelect(isSelected ? null : repo)
          }}
        >
          <meshStandardMaterial
            color={isGraveyard ? '#0a0a10' : planetColor}
            emissive={isGraveyard ? '#000000' : planetColor}
            emissiveIntensity={hovered ? 1.5 : (isGraveyard ? 0.05 : 0.4)}
            roughness={0.2}
            metalness={0.8}
            transparent={tier === 1}
            opacity={tier === 1 ? 0.85 : 1}
          />
        </Sphere>

        {/* Technical Wireframe Overlay — struggling/dormant tier 1 OR all graveyard */}
        {((health.tier !== 'thriving' && tier === 1) || isGraveyard) && (
          <TechnicalOverlay size={size} color={isGraveyard ? '#444455' : planetColor} />
        )}

        {/* Thriving clean inner glow */}
        {health.tier === 'thriving' && tier === 1 && !isGraveyard && (
          <Sphere args={[size * 1.08, 16, 16]}>
            <meshBasicMaterial
              color="#aaffdd"
              transparent
              opacity={hovered ? 0.10 : 0.04}
              side={THREE.BackSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </Sphere>
        )}

        {/* Saturn rings — 50+ stars, alive only */}
        {hasRings && (
          <>
            <Ring args={[size * 1.65, size * 2.1, 64]} rotation={[Math.PI * 0.28, 0.3, 0]}>
              <meshBasicMaterial color={planetColor} transparent opacity={0.35} side={THREE.DoubleSide} />
            </Ring>
            <Ring args={[size * 2.2, size * 2.5, 64]} rotation={[Math.PI * 0.28, 0.3, 0]}>
              <meshBasicMaterial color={planetColor} transparent opacity={0.15} side={THREE.DoubleSide} />
            </Ring>
          </>
        )}

        {/* Selected pulse ring — sharp & minimal */}
        {isSelected && (
          <Ring args={[size * 1.8, size * 1.85, 64]} rotation={[-Math.PI / 2, 0, 0]}>
            <meshBasicMaterial
              color={isGraveyard ? '#445566' : health.color}
              transparent opacity={0.6} side={THREE.DoubleSide}
            />
          </Ring>
        )}

        {/* Language moons — tier 1 selected, alive only */}
        {tier === 1 && isSelected && !isGraveyard && langMoons.map((m, mi) => (
          <LangMoon key={m.lang + mi} {...m} />
        ))}

        {/* Commit velocity ring — always visible, tier 1 real data, tier 2/3 simplified */}
        {!isGraveyard && tier === 1 && commitMonths && (
          <VelocityRing3D months={commitMonths} size={size} color={baseColor} />
        )}
        {!isGraveyard && tier >= 2 && (
          <SimpleVelocityRing size={size} color={baseColor} />
        )}

        {/* PR Indicators — Fixed Static Markers */}
        {!isGraveyard && tier === 1 && openPRs && openPRs.length > 0 && (
          <group>
            {/* Fine orbital line for PRs */}
            <Ring args={[size * 2.5, size * 2.51, 64]} rotation={[-Math.PI / 2, 0, 0]}>
              <meshBasicMaterial color="#ffffff" transparent opacity={0.05} />
            </Ring>
            {openPRs.slice(0, 8).map((pr, pi) => (
              <StaticPRIndicator
                key={pr.id}
                pr={pr}
                orbitRadius={size * 2.5}
                index={pi}
                total={Math.min(openPRs.length, 8)}
              />
            ))}
          </group>
        )}

        {/* Graveyard hover tooltip — Minimal Archived Record */}
        {isGraveyard && hovered && (
          <Html center distanceFactor={10} style={{ pointerEvents: 'none', zIndex: 200 }}>
            <div className="bg-[#05050f]/95 backdrop-blur-3xl border border-white/5 p-4 rounded-xl shadow-2xl min-w-[200px]">
              <div className="flex items-center gap-3 mb-3 pb-2 border-b border-white/5">
                <div className="w-2 h-2 rounded-full bg-gray-600 animate-pulse" />
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-gray-500">Archived Record</span>
              </div>
              <h4 className="font-orbitron font-bold text-sm text-white mb-1">{repo.name}</h4>
              <div className="space-y-1.5 mt-3">
                <div className="flex justify-between font-mono text-[9px]">
                  <span className="text-gray-600">INACTIVITY</span>
                  <span className="text-gray-400">
                    {Math.floor((Date.now() - new Date(repo.pushed_at).getTime()) / (1000 * 60 * 60 * 24 * 365.25))} Years
                  </span>
                </div>
                <div className="flex justify-between font-mono text-[9px]">
                  <span className="text-gray-600">LAST PUSH</span>
                  <span className="text-gray-400">{new Date(repo.pushed_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="mt-4 pt-2 border-t border-white/5 text-center">
                <span className="font-mono text-[8px] text-gray-700 tracking-widest uppercase italic">Deep Space Signal Lost</span>
              </div>
            </div>
          </Html>
        )}
      </group>
    </group>
  </>
)
}

// Export health calc so SolarSystemScene can use it in the panel
export { calcRepoHealth }
