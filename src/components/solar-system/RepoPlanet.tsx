'use client'

import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Ring, MeshDistortMaterial, Html } from '@react-three/drei'
import * as THREE from 'three'
import type { GitHubRepo, RepoTier, PullRequest, ActionRun } from '@/types'
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

// ── Build History Meteors ──────────────────────────────────────────────────
function BuildMeteorParticle({ run, orbitRadius, index, total }: { run: ActionRun, orbitRadius: number, index: number, total: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  const isSuccess = run.conclusion === 'success'
  const isFailure = run.conclusion === 'failure'
  const isInProgress = run.status === 'in_progress' || run.status === 'queued'
  
  const color = isInProgress ? '#ffd700' : (isSuccess ? '#00ff66' : '#ff2244')
  const angle = (index / total) * Math.PI * 2

  useFrame((state) => {
    if (meshRef.current && isInProgress) {
      // Gentle throb for in-progress dots
      const s = 1 + Math.sin(state.clock.elapsedTime * 6 + index) * 0.4
      meshRef.current.scale.setScalar(s)
    }
  })

  return (
    <group
      position={[
        Math.cos(angle) * orbitRadius,
        0,
        Math.sin(angle) * orbitRadius
      ]}
    >
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>
      {/* Point light so the dot actually glows through bloom */}
      <pointLight color={color} intensity={0.3} distance={1.5} decay={2} />
    </group>
  )
}

function BuildMeteors({ runs, orbitRadius }: { runs: ActionRun[], orbitRadius: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const recentRuns = useMemo(() => runs.slice(0, 10), [runs])

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y -= delta * 0.15 // Slow orbital drifting opposite to planet rotation
    }
  })

  if (recentRuns.length === 0) return null

  return (
    <group ref={groupRef}>
      {/* Faint ring for the meteors to orbit along */}
      <Ring args={[orbitRadius - 0.005, orbitRadius + 0.005, 32]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.04} side={THREE.DoubleSide} />
      </Ring>
      
      {recentRuns.map((run, i) => (
        <BuildMeteorParticle 
          key={run.id} 
          run={run} 
          orbitRadius={orbitRadius} 
          index={i} 
          total={recentRuns.length} 
        />
      ))}
    </group>
  )
}

// ── CI/CD Surface Overlays ───────────────────────────────────────────────────
function CISuccessOverlay({ size }: { size: number }) {
  return (
    <Sphere args={[size * 1.03, 16, 16]}>
      <meshBasicMaterial
        color="#00ff66"
        transparent
        opacity={0.06}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Sphere>
  )
}

function CIFailureOverlay({ size }: { size: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (ref.current) {
      // Flicker between 0.04 and 0.12 opacity
      const mat = ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.04 + Math.abs(Math.sin(state.clock.elapsedTime * 3.5)) * 0.08
    }
  })
  return (
    <Sphere ref={ref} args={[size * 1.03, 16, 16]}>
      <meshBasicMaterial
        color="#ff2244"
        transparent
        opacity={0.08}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Sphere>
  )
}

function CIInProgressRing({ size }: { size: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 2) * 0.12
    }
  })
  return (
    <Ring ref={ref} args={[size * 1.25, size * 1.30, 64]} rotation={[-Math.PI / 2, 0, 0]}>
      <meshBasicMaterial
        color="#ffd700"
        transparent
        opacity={0.2}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </Ring>
  )
}

// ── Live Build Comet ─────────────────────────────────────────────────────────
function LiveBuildComet({ size, index }: { size: number; index: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const flashRef = useRef<THREE.Mesh>(null)
  const tRef = useRef(Math.random())          // 0→1 progress
  const flashT = useRef(-1)                   // <0 = no flash active

  // Each comet gets a unique approach angle
  const traj = useMemo(() => {
    const angle = (index * 2.39996) + 0.7     // golden angle spread
    const dist = size * 12                    // start distance from planet
    return {
      startX: Math.cos(angle) * dist,
      startY: (Math.sin(angle * 1.7)) * dist * 0.3,
      startZ: Math.sin(angle) * dist,
      speed: 0.12 + (index % 3) * 0.04,      // loop cycle speed
    }
  }, [size, index])

  const TRAIL_COUNT = 16
  const TRAIL_SPACING = 0.06

  useFrame((_, delta) => {
    tRef.current += delta * traj.speed
    if (tRef.current >= 1) {
      // Reset and trigger flash
      tRef.current = 0
      flashT.current = 0
    }

    const t = tRef.current
    // Ease-in so it accelerates toward the planet
    const eased = t * t

    if (groupRef.current) {
      const x = traj.startX * (1 - eased)
      const y = traj.startY * (1 - eased)
      const z = traj.startZ * (1 - eased)
      groupRef.current.position.set(x, y, z)

      // Orient toward origin (planet center)
      groupRef.current.lookAt(0, 0, 0)
    }

    // Flash animation
    if (flashRef.current && flashT.current >= 0) {
      flashT.current += delta * 4
      const ft = flashT.current
      if (ft > 1) {
        flashT.current = -1
        flashRef.current.scale.setScalar(0.01)
        ;(flashRef.current.material as THREE.MeshBasicMaterial).opacity = 0
      } else {
        const scale = size * (1.2 + ft * 1.5)
        flashRef.current.scale.setScalar(scale)
        ;(flashRef.current.material as THREE.MeshBasicMaterial).opacity = 0.35 * (1 - ft)
      }
    }
  })

  return (
    <>
      {/* Comet body + trail */}
      <group ref={groupRef}>
        {/* Comet head */}
        <mesh>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color="#ffd700"
            emissive="#ffd700"
            emissiveIntensity={3}
            toneMapped={false}
          />
        </mesh>
        <pointLight color="#ffd700" intensity={0.6} distance={3} decay={2} />

        {/* 16-point fading trail */}
        {Array.from({ length: TRAIL_COUNT }).map((_, i) => (
          <mesh key={i} position={[0, 0, -(i + 1) * TRAIL_SPACING]}>
            <boxGeometry args={[0.04, 0.04, TRAIL_SPACING * 0.9]} />
            <meshBasicMaterial
              color="#ffd700"
              transparent
              opacity={0.6 / (i + 1)}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Impact flash at planet center */}
      <mesh ref={flashRef} scale={0.01}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={0}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </>
  )
}

// ── Deploy Streak Aura ───────────────────────────────────────────────────────
function DeployStreakAura({ size, streak }: { size: number; streak: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const auraRef = useRef<THREE.Mesh>(null)

  // Determine tier visuals
  const tier = streak >= 10 ? 4 : streak >= 7 ? 3 : streak >= 4 ? 2 : 1
  const ringCount = tier >= 4 ? 3 : tier
  const baseColor = tier >= 3 ? '#ffd700' : '#00ff66'
  const baseOpacity = 0.08 + tier * 0.04
  const ringStart = size * 1.95 // just outside meteor ring at 1.80

  useFrame((state, delta) => {
    // Full aura (10+) slowly rotates and pulses
    if (groupRef.current && tier >= 4) {
      groupRef.current.rotation.y += delta * 0.3
      groupRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.8) * 0.08
    }
    // Pulse the aura sphere opacity for 10+
    if (auraRef.current && tier >= 4) {
      const mat = auraRef.current.material as THREE.MeshBasicMaterial
      mat.opacity = 0.06 + Math.sin(state.clock.elapsedTime * 1.5) * 0.04
    }
  })

  return (
    <group ref={groupRef}>
      {/* Tiered rings */}
      {Array.from({ length: ringCount }).map((_, i) => {
        const r = ringStart + i * size * 0.15
        const opacity = baseOpacity + i * 0.02
        return (
          <Ring
            key={i}
            args={[r, r + size * 0.03, 64]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <meshBasicMaterial
              color={baseColor}
              transparent
              opacity={opacity}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </Ring>
        )
      })}

      {/* Full golden aura sphere for 10+ streak */}
      {tier >= 4 && (
        <Sphere ref={auraRef} args={[ringStart + size * 0.5, 24, 24]}>
          <meshBasicMaterial
            color="#ffd700"
            transparent
            opacity={0.08}
            side={THREE.BackSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </Sphere>
      )}
    </group>
  )
}

// Shatter burst when streak is broken (latest run is failure)
function StreakShatterBurst({ size }: { size: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const tRef = useRef(0)
  const PARTICLE_COUNT = 24
  const DURATION = 1.5 // seconds for the burst

  // Random initial directions for each particle
  const directions = useMemo(() => {
    const dirs = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      dirs.push(new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta),
        Math.sin(phi) * Math.sin(theta) * 0.3,
        Math.cos(phi)
      ))
    }
    return dirs
  }, [])

  const positions = useMemo(() => new Float32Array(PARTICLE_COUNT * 3), [])
  const colors = useMemo(() => {
    const c = new Float32Array(PARTICLE_COUNT * 3)
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Red-orange shatter particles
      c[i * 3] = 1.0
      c[i * 3 + 1] = 0.2 + Math.random() * 0.3
      c[i * 3 + 2] = 0.05
    }
    return c
  }, [])

  useFrame((_, delta) => {
    tRef.current += delta
    if (tRef.current > DURATION || !pointsRef.current) return

    const progress = tRef.current / DURATION
    const speed = size * 4

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const d = directions[i]
      positions[i * 3] = d.x * progress * speed
      positions[i * 3 + 1] = d.y * progress * speed
      positions[i * 3 + 2] = d.z * progress * speed
    }

    const geom = pointsRef.current.geometry
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.attributes.position.needsUpdate = true

    // Fade out
    const mat = pointsRef.current.material as THREE.PointsMaterial
    mat.opacity = 0.8 * (1 - progress)
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={PARTICLE_COUNT}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={PARTICLE_COUNT}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        transparent
        opacity={0.8}
        vertexColors
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
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
  actionRuns?: ActionRun[]         // GitHub Actions history
  isGraveyard?: boolean
  onSelect?: (repo: GitHubRepo | null) => void
  isSelected?: boolean
}

export function RepoPlanet({
  repo, tier, orbitRadius, offset, index,
  repoLanguages, commitMonths, openPRs, actionRuns,
  isGraveyard = false, onSelect, isSelected,
}: RepoPlanetProps) {
  const groupRef  = useRef<THREE.Group>(null)
  const planetRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const angleRef  = useRef(offset)

  const baseColor  = getLanguageColor(repo.language ?? '')
  const daysSince  = getDaysSinceActivity(repo.pushed_at)

  // Determine CI/CD surface state from the most recent action run
  const latestCI = useMemo(() => {
    if (!actionRuns || actionRuns.length === 0) return null
    const latest = actionRuns[0]
    if (latest.status === 'in_progress' || latest.status === 'queued') return 'in_progress'
    if (latest.conclusion === 'success') return 'success'
    if (latest.conclusion === 'failure') return 'failure'
    return null
  }, [actionRuns])

  // Filter in-progress runs for live comets
  const inProgressRuns = useMemo(() => {
    if (!actionRuns) return []
    return actionRuns.filter(r => r.status === 'in_progress' || r.status === 'queued')
  }, [actionRuns])

  // Count consecutive successful runs from most recent backward
  const deployStreak = useMemo(() => {
    if (!actionRuns || actionRuns.length === 0) return 0
    let count = 0
    for (const run of actionRuns) {
      // Skip in-progress/queued — they haven't concluded yet
      if (run.status === 'in_progress' || run.status === 'queued') continue
      if (run.conclusion === 'success') count++
      else break // first non-success stops the streak
    }
    return count
  }, [actionRuns])

  // Did the streak just break? (latest concluded run is a failure)
  const streakBroken = useMemo(() => {
    if (!actionRuns || actionRuns.length === 0) return false
    const latestConcluded = actionRuns.find(r => r.status !== 'in_progress' && r.status !== 'queued')
    return latestConcluded?.conclusion === 'failure'
  }, [actionRuns])

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

        {/* CI/CD Surface Outcome Overlay */}
        {!isGraveyard && latestCI === 'success' && (
          <CISuccessOverlay size={size} />
        )}
        {!isGraveyard && latestCI === 'failure' && (
          <CIFailureOverlay size={size} />
        )}
        {!isGraveyard && latestCI === 'in_progress' && (
          <CIInProgressRing size={size} />
        )}

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

        {/* Actions History Meteors — tier 1, 2, and 3 */}
        {!isGraveyard && tier <= 3 && actionRuns && actionRuns.length > 0 && (
          <BuildMeteors runs={actionRuns} orbitRadius={size * 1.80} />
        )}

        {/* Live Build Comets — one per in-progress run */}
        {!isGraveyard && inProgressRuns.length > 0 && inProgressRuns.map((run, ci) => (
          <LiveBuildComet key={run.id} size={size} index={ci} />
        ))}

        {/* Deploy Streak Aura — consecutive success rings */}
        {!isGraveyard && deployStreak > 0 && (
          <DeployStreakAura size={size} streak={deployStreak} />
        )}

        {/* Streak Shatter Burst — latest concluded run is a failure */}
        {!isGraveyard && streakBroken && deployStreak === 0 && (
          <StreakShatterBurst size={size} />
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
