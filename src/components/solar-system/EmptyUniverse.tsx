'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, Ring } from '@react-three/drei'
import * as THREE from 'three'

// Ghost planet outlines — show where planets will form
interface PhantomPlanetProps {
  orbitRadius: number
  offset: number
  index: number
}

function PhantomPlanet({ orbitRadius, offset, index }: PhantomPlanetProps) {
  const groupRef = useRef<THREE.Group>(null)
  const angleRef = useRef(offset)
  const speed    = 0.04 + index * 0.008

  useFrame((state, delta) => {
    angleRef.current += speed * delta
    if (groupRef.current) {
      groupRef.current.position.set(
        Math.cos(angleRef.current) * orbitRadius,
        Math.sin(angleRef.current * 0.15) * 0.5,
        Math.sin(angleRef.current) * orbitRadius,
      )
    }
  })

  // Slow pulse alpha
  const matRef = useRef<THREE.MeshBasicMaterial>(null)
  useFrame((state) => {
    if (matRef.current) {
      matRef.current.opacity = 0.04 + Math.sin(state.clock.getElapsedTime() * 0.6 + index) * 0.03
    }
  })

  return (
    <group ref={groupRef}>
      {/* Ghost shell */}
      <Sphere args={[0.55, 16, 16]}>
        <meshBasicMaterial
          ref={matRef}
          color="#00e5ff"
          transparent
          opacity={0.05}
          wireframe={false}
          side={THREE.FrontSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>
      {/* Wireframe ring around ghost */}
      <Sphere args={[0.56, 10, 10]}>
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={0.08}
          wireframe
          depthWrite={false}
        />
      </Sphere>
    </group>
  )
}

// Ghost orbit ring
function PhantomOrbit({ radius }: { radius: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[radius - 0.02, radius + 0.02, 80]} />
      <meshBasicMaterial
        color="#00e5ff"
        transparent
        opacity={0.04}
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  )
}

// Protostellar inward swirl for the star
function ProtostellarSwirl({ starSize }: { starSize: number }) {
  const ref = useRef<THREE.Points>(null)
  const count = 200

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r     = starSize * 1.5 + Math.random() * 12
      const theta = Math.random() * Math.PI * 2
      const phi   = (Math.random() - 0.5) * 0.5
      arr[i * 3]     = Math.cos(theta) * Math.cos(phi) * r
      arr[i * 3 + 1] = Math.sin(phi) * r * 0.3
      arr[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * r
    }
    return arr
  }, [starSize])

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y -= dt * 0.05
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffdd88"
        size={0.1}
        sizeAttenuation
        transparent
        opacity={0.25}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

interface EmptyUniverseProps {
  repoCount: number   // 0–4
}

const PHANTOM_ORBITS = [8, 12.5, 17, 21.5, 26]

export function EmptyUniverse({ repoCount }: EmptyUniverseProps) {
  // Show phantom slots for the repos that don't exist yet
  const phantomCount = Math.max(0, 5 - repoCount)
  const starSize = 2.8 // bigger star to fill the void

  return (
    <>
      <ProtostellarSwirl starSize={starSize} />

      {Array.from({ length: phantomCount }, (_, i) => {
        const orbitIdx = repoCount + i
        const r = PHANTOM_ORBITS[orbitIdx] ?? PHANTOM_ORBITS[i]
        return (
          <group key={i}>
            <PhantomOrbit radius={r} />
            <PhantomPlanet
              orbitRadius={r}
              offset={(i / phantomCount) * Math.PI * 2}
              index={i}
            />
          </group>
        )
      })}
    </>
  )
}
