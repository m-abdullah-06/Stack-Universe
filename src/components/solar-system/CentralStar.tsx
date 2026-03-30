'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial } from '@react-three/drei'
import { useUniverseStore } from '@/store'
import * as THREE from 'three'
import type { StarType } from '@/types'

function ClaimPulse({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame((state) => {
    if (!meshRef.current || !active) return
    const t = state.clock.getElapsedTime() * 2
    const scale = 1 + (t % 1) * 30
    const opacity = 1 - (t % 1)
    meshRef.current.scale.setScalar(scale)
    if (meshRef.current.material instanceof THREE.MeshBasicMaterial) {
      meshRef.current.material.opacity = Math.max(0, opacity * 0.4)
    }
  })

  if (!active) return null

  return (
    <Sphere ref={meshRef} args={[1, 32, 32]}>
      <meshBasicMaterial 
        color="#ffd700" 
        transparent 
        opacity={0.4} 
        side={THREE.DoubleSide}
        blending={THREE.AdditiveBlending}
      />
    </Sphere>
  )
}

interface CentralStarProps {
  score: number
  totalRepos: number
  totalStars: number
  onClick: () => void
}

function getStarType(totalRepos: number): StarType {
  if (totalRepos >= 250) return 'hypergiant'
  if (totalRepos >= 121) return 'supergiant'
  if (totalRepos >= 61)  return 'giant'
  if (totalRepos >= 31)  return 'subgiant'
  if (totalRepos >= 11)  return 'yellow'
  return 'dwarf'
}

const STAR_CONFIG: Record<StarType, { color: string; coronaColor: string; intensity: number }> = {
  dwarf:      { color: '#ff5500', coronaColor: '#ff2200', intensity: 1.5 },
  yellow:     { color: '#ffcc00', coronaColor: '#ff8800', intensity: 1.8 },
  subgiant:   { color: '#ffeeaa', coronaColor: '#ffba00', intensity: 2.2 },
  giant:      { color: '#ffffff', coronaColor: '#00ccff', intensity: 2.8 },
  supergiant: { color: '#00f3ff', coronaColor: '#0077ff', intensity: 3.5 },
  hypergiant: { color: '#ffffff', coronaColor: '#ff00e5', intensity: 4.5 },
}

function ParticleStreams({ color, count = 120 }: { color: string; count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r     = 3 + Math.random() * 5
      const theta = Math.random() * Math.PI * 2
      const phi   = (Math.random() - 0.5) * 0.6
      arr[i * 3]     = Math.cos(theta) * Math.cos(phi) * r
      arr[i * 3 + 1] = Math.sin(phi) * r
      arr[i * 3 + 2] = Math.sin(theta) * Math.cos(phi) * r
    }
    return arr
  }, [count])
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.getElapsedTime() * 0.08
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.04} sizeAttenuation transparent opacity={0.3} />
    </points>
  )
}

export function CentralStar({ score, totalRepos, totalStars, onClick }: CentralStarProps) {
  const meshRef   = useRef<THREE.Mesh>(null)
  const coronaRef = useRef<THREE.Mesh>(null)
  const glowRef   = useRef<THREE.Mesh>(null)
  const ringRef1  = useRef<THREE.Mesh>(null)
  const ringRef2  = useRef<THREE.Mesh>(null)

  const { showClaimPulse, claimData } = useUniverseStore()

  const starType = getStarType(totalRepos)
  const baseCfg  = STAR_CONFIG[starType]
  
  // Apply claim customization
  const cfg = useMemo(() => {
    if (claimData?.star_color) {
      return { 
        ...baseCfg, 
        color: claimData.star_color,
        coronaColor: claimData.star_color // Simpler for now
      }
    }
    return baseCfg
  }, [baseCfg, claimData?.star_color])

  const isHyper  = starType === 'hypergiant'

  const starSize = useMemo(() => {
    return Math.max(1.8, Math.min(6.0,
      1.8 +
      Math.log10(totalRepos + 1) * 0.6 +
      Math.log10(totalStars + 1) * 0.4
    ))
  }, [totalRepos, totalStars])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.04
      meshRef.current.rotation.x = Math.sin(t * 0.08) * 0.04
    }
    if (coronaRef.current) {
      coronaRef.current.rotation.z = -t * 0.025
      coronaRef.current.scale.setScalar(1 + Math.sin(t * 1.5) * 0.04)
    }
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(t * 0.7 + 1) * 0.06)
    }
    if (ringRef1.current) ringRef1.current.rotation.z = t * 0.06
    if (ringRef2.current) ringRef2.current.rotation.z = -t * 0.04
  })

  return (
    <group onClick={onClick}>
      {/* Outer glow */}
      <Sphere ref={glowRef} args={[starSize * 3.5, 32, 32]}>
        <meshBasicMaterial color={cfg.color} transparent opacity={0.08} side={THREE.BackSide} />
      </Sphere>

      {/* Mid glow */}
      <Sphere args={[starSize * 2.5, 32, 32]}>
        <meshBasicMaterial color={cfg.coronaColor} transparent opacity={0.15} side={THREE.BackSide} />
      </Sphere>

      {/* Glow rings — giant+ */}
      {(starType === 'giant' || starType === 'supergiant' || isHyper) && (
        <>
          <mesh ref={ringRef1} rotation={[Math.PI / 2.5, 0, 0]}>
            <torusGeometry args={[starSize * 1.7, 0.06, 8, 64]} />
            <meshBasicMaterial color={cfg.coronaColor} transparent opacity={0.25} />
          </mesh>
          <mesh ref={ringRef2} rotation={[Math.PI / 3, 0.5, 0]}>
            <torusGeometry args={[starSize * 2.1, 0.04, 8, 64]} />
            <meshBasicMaterial color={cfg.color} transparent opacity={0.15} />
          </mesh>
        </>
      )}

      {/* Particle streams — supergiant+ */}
      {(starType === 'supergiant' || isHyper) && (
        <ParticleStreams color={cfg.coronaColor} count={isHyper ? 200 : 120} />
      )}

      {/* Corona */}
      <Sphere ref={coronaRef} args={[starSize * 1.28, 16, 16]}>
        <MeshDistortMaterial
          color={isHyper ? '#ffccff' : cfg.coronaColor}
          emissive={cfg.coronaColor}
          emissiveIntensity={1.0}
          distort={0.25}
          speed={isHyper ? 4 : 2}
          transparent
          opacity={0.7}
        />
      </Sphere>

      {/* Main star body */}
      <Sphere ref={meshRef} args={[starSize, 64, 64]}>
        <MeshDistortMaterial
          color={cfg.color}
          emissive={cfg.color}
          emissiveIntensity={cfg.intensity}
          distort={isHyper ? 0.2 : 0.12}
          speed={isHyper ? 5 : 3}
          roughness={0.1}
        />
      </Sphere>

      <ClaimPulse active={showClaimPulse} />

      <pointLight color={cfg.color} intensity={score > 10000 ? 15 : 10} distance={400} decay={1} />
      <pointLight color={cfg.coronaColor} intensity={5} distance={500} decay={0.8} />
    </group>
  )
}
