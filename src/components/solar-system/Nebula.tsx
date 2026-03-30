'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
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

// ─── EMISSION NEBULA (Technical Rays) ─────────────────────────────────────────
function EmissionNebula({ color, rand }: { color: string; rand: () => number }) {
  const hazeRef  = useRef<THREE.Points>(null)
  const texture  = useMemo(() => createTechPointTexture(), [])
  const hazePos  = useMemo(() => makeParticleField(800, rand, 80, 240, 0.05), [rand])

  useFrame((state) => {
    if (hazeRef.current) hazeRef.current.rotation.y = state.clock.getElapsedTime() * 0.005
  })

  return (
    <points ref={hazeRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[hazePos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        color={color}
        size={4}
        sizeAttenuation
        transparent
        opacity={0.1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ─── DARK NEBULA ─────────────────────────────────────────────────────────────
function DarkNebula({ rand }: { rand: () => number }) {
  const ref = useRef<THREE.Points>(null)
  const dustRef = useRef<THREE.Points>(null)
  const hazePos = useMemo(() => makeParticleField(1500, rand, 70, 160, 0.2), [rand])
  const dustPos = useMemo(() => makeParticleField(800, rand, 40, 100, 0.5), [rand])
  const texture = useMemo(() => createTechPointTexture(), [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (ref.current) ref.current.rotation.y = t * 0.002
    if (dustRef.current) dustRef.current.rotation.y = -t * 0.004
  })

  return (
    <group>
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[hazePos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          color="#00000a"
          size={35}
          sizeAttenuation
          transparent
          opacity={0.04} // Subtler void
          depthWrite={false}
        />
      </points>
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          color="#000005"
          size={8}
          sizeAttenuation
          transparent
          opacity={0.06}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

// ─── REFLECTION NEBULA ───────────────────────────────────────────────────────
function ReflectionNebula({ colors, rand }: { colors: string[]; rand: () => number }) {
  const refs   = useRef<THREE.Points[]>([])
  const texture = useMemo(() => createTechPointTexture(), [])
  
  const layers = useMemo(() => colors.slice(0, 5).map((col, ci) => ({
    col,
    pos: makeParticleField(500, rand, 60 + ci * 25, 120 + ci * 30, 0.3),
    speed: 0.002 + ci * 0.001,
    dir: ci % 2 === 0 ? 1 : -1,
  })), [colors, rand])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    layers.forEach((l, i) => {
      if (refs.current[i]) {
        refs.current[i].rotation.y = t * l.speed * l.dir
        refs.current[i].rotation.z = Math.sin(t * 0.03 + i) * 0.05
      }
    })
  })

  return (
    <group>
      {layers.map((l, i) => (
        <points key={i} ref={el => { if (el) refs.current[i] = el }}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[l.pos, 3]} />
          </bufferGeometry>
          <pointsMaterial
            map={texture}
            color={l.col}
            size={20 + i * 10}
            sizeAttenuation
            transparent
            opacity={0.015}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      ))}
    </group>
  )
}

// ─── PLANETARY NEBULA ────────────────────────────────────────────────────────
function PlanetaryNebula({ color, rand }: { color: string; rand: () => number }) {
  const ringRefs = useRef<THREE.Points[]>([])
  const texture  = useMemo(() => createTechPointTexture(), [])
  
  const rings = useMemo(() => Array.from({ length: 4 }, (_, i) => ({
    pos: makeRingField(800 + i * 200, rand, 80 + i * 40, 6 + i * 2),
    opacity: Math.max(0.005, 0.015 - i * 0.003),
    speed: 0.002 - i * 0.0002,
    tilt: (rand() - 0.5) * 0.4,
  })), [rand])

  const dustPos = useMemo(() => makeParticleField(1000, rand, 50, 160, 0.3), [rand])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    rings.forEach((ring, i) => {
      if (ringRefs.current[i]) {
        ringRefs.current[i].rotation.z = t * ring.speed
        ringRefs.current[i].rotation.x = Math.PI / 2 + ring.tilt + Math.sin(t * 0.02 + i) * 0.05
      }
    })
  })

  return (
    <group>
      {/* Dusty Particle Rings instead of hula hoops */}
      {rings.map((ring, i) => (
        <points key={i} ref={el => { if (el) ringRefs.current[i] = el }}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[ring.pos, 3]} />
          </bufferGeometry>
          <pointsMaterial
            map={texture}
            color={color}
            size={12}
            sizeAttenuation
            transparent
            opacity={ring.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      ))}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          color={color}
          size={15}
          sizeAttenuation
          transparent
          opacity={0.008}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

// ─── PROTOSTELLAR NEBULA ─────────────────────────────────────────────────────
function ProtostellarNebula({ color, rand }: { color: string; rand: () => number }) {
  const ref = useRef<THREE.Points>(null)
  const texture = useMemo(() => createTechPointTexture(), [])

  // Push spiral much further out
  const pos = useMemo(() => {
    const count = 2000
    const arr   = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const t     = rand()
      const r     = 60 + t * 140 
      const angle = t * Math.PI * 10 + rand() * 0.6
      const y     = (rand() - 0.5) * r * 0.15
      arr[i * 3]     = Math.cos(angle) * r
      arr[i * 3 + 1] = y
      arr[i * 3 + 2] = Math.sin(angle) * r
    }
    return arr
  }, [rand])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (ref.current) {
      ref.current.rotation.y = -t * 0.008
      ref.current.scale.setScalar(1 + Math.sin(t * 0.1) * 0.01)
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        color={color}
        size={12}
        sizeAttenuation
        transparent
        opacity={0.01}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ─── SUPERNOVA REMNANT ───────────────────────────────────────────────────────
function SupernovaRemnant({ color, rand }: { color: string; rand: () => number }) {
  const ringRefs = useRef<THREE.Points[]>([])
  const shards    = useRef<THREE.Points>(null)
  const texture   = useMemo(() => createTechPointTexture(), [])

  const rings = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    pos: makeRingField(1200 + i * 300, rand, 70 + i * 30, 8 + i * 2),
    opacity: Math.max(0.005, 0.02 - i * 0.003),
    speed: 0.008 + i * 0.002,
    axis: new THREE.Vector3(rand() - 0.5, rand() - 0.5, rand() - 0.5).normalize(),
  })), [rand])

  const shardPos = useMemo(() => makeParticleField(1500, rand, 60, 200, 0.3), [rand])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    rings.forEach((ring, i) => {
      if (ringRefs.current[i]) {
        ringRefs.current[i].rotateOnAxis(ring.axis, ring.speed * 0.01)
        ringRefs.current[i].scale.setScalar(1 + Math.sin(t * 0.05 + i) * 0.03)
      }
    })
    if (shards.current) shards.current.rotation.y = t * 0.002
  })

  return (
    <group>
      {rings.map((ring, i) => (
        <points key={i} ref={el => { if (el) ringRefs.current[i] = el }}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[ring.pos, 3]} />
          </bufferGeometry>
          <pointsMaterial
            map={texture}
            color={i % 2 === 0 ? color : '#ffffff'}
            size={10}
            sizeAttenuation
            transparent
            opacity={ring.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </points>
      ))}
      <points ref={shards}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[shardPos, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={texture}
          color={color}
          size={10}
          sizeAttenuation
          transparent
          opacity={0.01}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

// ─── STANDARD NEBULA ─────────────────────────────────────────────────────────
function StandardNebula({ color, rand }: { color: string; rand: () => number }) {
  const hazeRef = useRef<THREE.Points>(null)
  const hazePos = useMemo(() => makeParticleField(500, rand, 80, 200, 0.1), [rand])
  const texture = useMemo(() => createTechPointTexture(), [])

  useFrame((state) => {
    if (hazeRef.current) hazeRef.current.rotation.y = state.clock.getElapsedTime() * 0.002
  })

  return (
    <points ref={hazeRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[hazePos, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        color={color}
        size={3}
        sizeAttenuation
        transparent
        opacity={0.05}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// ─── PHANTOM PLANETS (for users with < 5 repos) ───────────────────────────────
export function PhantomPlanets() {
  const PHANTOM_RADII  = [8, 11.5, 15, 17, 20]
  const angleRef       = useRef(0)
  const groupRef       = useRef<THREE.Group>(null)

  useFrame((_, dt) => {
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
