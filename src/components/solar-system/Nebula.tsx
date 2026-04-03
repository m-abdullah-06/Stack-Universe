'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { NebulaShaderMaterial } from './NebulaShaderMaterial'
import type { UniverseData } from '@/types'

// ─── nebula type detection ────────────────────────────────────────────────────
export type NebulaType =
  | 'emission'       // 10k+ stars  — light beams radiating outward
  | 'dark'           // no commits 6+ months — dim, absorbs light
  | 'reflection'     // 8+ languages — multicolour shifting
  | 'planetary'      // 100+ repos — ring shaped
  | 'protostellar'   // account < 1yr OR < 5 repos — swirling inward
  | 'supernova'      // 365-day streak — expanding shockwave
  | 'standard'       // default

export interface NebulaTypeOptions {
  totalStars: number
  monthsInactive: number
  languageCount: number
  totalRepos: number
  accountAgeYears: number
  isHighStreak: boolean
}

export function resolveNebulaType(opts: NebulaTypeOptions): NebulaType {
  if (opts.isHighStreak) return 'supernova'
  if (opts.totalStars >= 10000) return 'emission'
  if (opts.languageCount >= 8) return 'reflection'
  if (opts.monthsInactive > 6) return 'dark'
  if (opts.totalRepos >= 100) return 'planetary'
  if (opts.accountAgeYears < 1) return 'protostellar'

  return 'standard'
}

// ─── deterministic seeded random ─────────────────────────────────────────────
function seededRandom(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    return (s >>> 0) / 0xffffffff
  }
}

// ─── Procedural Technical Point Texture ──────────────────────────────────────
function createTechPointTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext('2d')
  if (!context) return null

  // Sharp center with subtle ring
  context.beginPath()
  context.arc(32, 32, 4, 0, Math.PI * 2)
  context.fillStyle = '#ffffff'
  context.fill()

  context.beginPath()
  context.arc(32, 32, 16, 0, Math.PI * 2)
  context.strokeStyle = 'rgba(255, 255, 255, 0.2)'
  context.stroke()

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

function usernameHash(username: string): number {
  let h = 2166136261
  for (let i = 0; i < username.length; i++) {
    h ^= username.charCodeAt(i)
    h = (h * 16777619) >>> 0
  }
  return h
}

// ─── Particle Distribution Helpers ───────────────────────────────────────────
function makeParticleField(count: number, rand: () => number, radiusMin: number, radiusMax: number, thickness: number) {
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const r = radiusMin + rand() * (radiusMax - radiusMin)
    const angle = rand() * Math.PI * 2
    const y = (rand() - 0.5) * r * thickness
    arr[i * 3]     = Math.cos(angle) * r
    arr[i * 3 + 1] = y
    arr[i * 3 + 2] = Math.sin(angle) * r
  }
  return arr
}

function makeBeamField(count: number, rand: () => number, length: number, width: number) {
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const y = (rand() - 0.5) * length
    // Tapered width (narrower at center/sun)
    const currentWidth = width * (1.0 - Math.abs(y / length))
    const angle = rand() * Math.PI * 2
    const r = rand() * currentWidth
    arr[i * 3]     = Math.cos(angle) * r
    arr[i * 3 + 1] = y
    arr[i * 3 + 2] = Math.sin(angle) * r
  }
  return arr
}

function makeRingField(count: number, rand: () => number, radius: number, thickness: number) {
  const arr = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const angle = rand() * Math.PI * 2
    const r = radius + (rand() - 0.5) * thickness
    const y = (rand() - 0.5) * (thickness * 0.2) // Vertically flat
    arr[i * 3]     = Math.cos(angle) * r
    arr[i * 3 + 1] = y
    arr[i * 3 + 2] = Math.sin(angle) * r
  }
  return arr
}

// ─── CLOUD COMPONENT (The new Wow) ──────────────────────────────────────────
function NebulaCloud({ position, color, opacity = 0.1, scale = 20 }: { position: [number, number, number]; color: string; opacity?: number; scale?: number }) {
  const ref = useRef<any>(null)
  useFrame((state: any) => {
    if (ref.current) ref.current.uTime = state.clock.getElapsedTime()
  })
  return (
    <Billboard position={position}>
      <mesh>
        <planeGeometry args={[scale, scale]} />
        <nebulaShaderMaterial
          ref={ref}
          uColor={new THREE.Color(color)}
          uOpacity={opacity}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </Billboard>
  )
}

// Re-using the point fields as anchor points for clouds
function CloudField({ 
  positions, 
  color, 
  opacity, 
  cloudScale 
}: { 
  positions: Float32Array; 
  color: string; 
  opacity: number; 
  cloudScale: number 
}) {
  const clouds = useMemo(() => {
    const list = []
    // Take every 10th-50th point to avoid thousands of billboard meshes (performance first!)
    const step = Math.max(30, Math.floor(positions.length / 300)) 
    for (let i = 0; i < positions.length; i += step * 3) {
      list.push([positions[i], positions[i+1], positions[i+2]] as [number, number, number])
    }
    return list
  }, [positions])

  return (
    <group>
      {clouds.map((pos, i) => (
        <NebulaCloud key={i} position={pos} color={color} opacity={opacity} scale={cloudScale} />
      ))}
    </group>
  )
}

// ─── EMISSION NEBULA ─────────────────────────────────────────────────────────
function EmissionNebula({ color, rand }: { color: string; rand: () => number }) {
  const hazePos  = useMemo(() => makeParticleField(1200, rand, 80, 240, 0.05), [rand])
  return <CloudField positions={hazePos} color={color} opacity={0.05} cloudScale={60} />
}

// ─── DARK NEBULA ─────────────────────────────────────────────────────────────
function DarkNebula({ rand }: { rand: () => number }) {
  const hazePos = useMemo(() => makeParticleField(2000, rand, 70, 160, 0.2), [rand])
  return <CloudField positions={hazePos} color="#00000a" opacity={0.08} cloudScale={80} />
}

// ─── REFLECTION NEBULA ───────────────────────────────────────────────────────
function ReflectionNebula({ colors, rand }: { colors: string[]; rand: () => number }) {
  const layers = useMemo(() => colors.slice(0, 5).map((col, ci) => ({
    col,
    pos: makeParticleField(600, rand, 60 + ci * 25, 120 + ci * 30, 0.3),
  })), [colors, rand])

  return (
    <group>
      {layers.map((l, i) => (
        <CloudField key={i} positions={l.pos} color={l.col} opacity={0.03} cloudScale={70 + i * 10} />
      ))}
    </group>
  )
}

// ─── PLANETARY NEBULA ────────────────────────────────────────────────────────
function PlanetaryNebula({ color, rand }: { color: string; rand: () => number }) {
  const ringPos = useMemo(() => makeRingField(1500, rand, 120, 10), [rand])
  const dustPos = useMemo(() => makeParticleField(1000, rand, 50, 160, 0.3), [rand])
  return (
    <group>
      <CloudField positions={ringPos} color={color} opacity={0.06} cloudScale={40} />
      <CloudField positions={dustPos} color={color} opacity={0.02} cloudScale={100} />
    </group>
  )
}

// ─── PROTOSTELLAR NEBULA ─────────────────────────────────────────────────────
function ProtostellarNebula({ color, rand }: { color: string; rand: () => number }) {
  const spiralPos = useMemo(() => {
    const count = 1500
    const arr   = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const t = rand(); const r = 60 + t * 140; const angle = t * Math.PI * 10 + rand() * 0.6
      arr[i * 3] = Math.cos(angle) * r; arr[i * 3+1] = 0; arr[i * 3+2] = Math.sin(angle) * r
    }
    return arr
  }, [rand])
  return <CloudField positions={spiralPos} color={color} opacity={0.04} cloudScale={50} />
}

// ─── SUPERNOVA REMNANT ───────────────────────────────────────────────────────
function SupernovaRemnant({ color, rand }: { color: string; rand: () => number }) {
  const blastPos = useMemo(() => makeParticleField(2500, rand, 60, 240, 0.4), [rand])
  return <CloudField positions={blastPos} color={color} opacity={0.04} cloudScale={90} />
}

// ─── STANDARD NEBULA ─────────────────────────────────────────────────────────
function StandardNebula({ color, rand }: { color: string; rand: () => number }) {
  const hazePos = useMemo(() => makeParticleField(800, rand, 80, 200, 0.1), [rand])
  return <CloudField positions={hazePos} color={color} opacity={0.05} cloudScale={70} />
}

// ─── PHANTOM PLANETS (for users with < 5 repos) ───────────────────────────────
export function PhantomPlanets() {
  const PHANTOM_RADII  = [8, 11.5, 15, 17, 20]
  const angleRef       = useRef(0)
  const groupRef       = useRef<THREE.Group>(null)

  useFrame((state: any, dt: any) => {
    angleRef.current += dt * 0.08
    if (groupRef.current) groupRef.current.rotation.y = angleRef.current * 0.02
  })

  return (
    <group ref={groupRef}>
      {PHANTOM_RADII.map((r, i) => (
        <group key={i}>
          {/* Orbit ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[r - 0.04, r + 0.04, 80]} />
            <meshBasicMaterial
              color="#00e5ff"
              transparent
              opacity={0.06}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* Phantom sphere at one point on the orbit */}
          <mesh position={[r, 0, 0]}>
            <sphereGeometry args={[0.35, 12, 12]} />
            <meshBasicMaterial
              color="#00e5ff"
              transparent
              opacity={0.07}
              wireframe
              depthWrite={false}
            />
          </mesh>
          {/* Outer glow ring */}
          <mesh position={[r, 0, 0]}>
            <sphereGeometry args={[0.55, 8, 8]} />
            <meshBasicMaterial
              color="#00e5ff"
              transparent
              opacity={0.03}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
interface NebulaProps {
  username: string
  primaryColor: string
  nebulaType: NebulaType
  spread: number
  density: number
  extraColors: string[]
  sentiment?: number
}

export function Nebula({ 
  username, 
  primaryColor, 
  nebulaType, 
  spread,
  density, 
  extraColors,
  sentiment = 0
}: NebulaProps) {
  const seed = usernameHash(username)
  const rand = useMemo(() => seededRandom(seed), [seed])

  // --- Sentiment-based Color Shift ---
  const adjustedPrimary = useMemo(() => {
    const base = new THREE.Color(primaryColor)
    if (sentiment > 0.3) {
      // Shift toward Cyan/Teal
      return base.lerp(new THREE.Color('#00ffff'), 0.4).getStyle()
    } else if (sentiment < -0.2) {
      // Shift toward Red/Deep Purple
      return base.lerp(new THREE.Color('#ff0055'), 0.5).getStyle()
    }
    return primaryColor
  }, [primaryColor, sentiment])

  const adjustedExtras = useMemo(() => {
    return extraColors.map(c => {
      const base = new THREE.Color(c)
      if (sentiment > 0.3) return base.lerp(new THREE.Color('#00ffaa'), 0.3).getStyle()
      if (sentiment < -0.2) return base.lerp(new THREE.Color('#aa00ff'), 0.4).getStyle()
      return c
    })
  }, [extraColors, sentiment])

  // Scale and density are now controlled by spread and density props
  const sizeMultiplier = spread / 40 // Normalize spread to scale
  const densityMultiplier = density // Use density directly for internal counts if needed

  // Language-based colors (legacy, now using primaryColor from props)
  return (
    <group scale={sizeMultiplier}>
      {/* Container for density adjustment - we could pass it down, 
          but scaling points works well for visual density too. */}
      {(() => {
        switch (nebulaType) {
          case 'emission':
            return <EmissionNebula color={adjustedPrimary} rand={rand} />
          case 'dark':
            return <DarkNebula rand={rand} />
          case 'reflection':
            return <ReflectionNebula colors={adjustedExtras} rand={rand} />
          case 'planetary':
            return <PlanetaryNebula color={adjustedPrimary} rand={rand} />
          case 'protostellar':
            return <ProtostellarNebula color={adjustedPrimary} rand={rand} />
          case 'supernova':
            return <SupernovaRemnant color={adjustedPrimary} rand={rand} />
          default:
            return <StandardNebula color={adjustedPrimary} rand={rand} />
        }
      })()}
    </group>
  )
}
