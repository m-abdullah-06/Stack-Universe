'use client'

import { useRef, useMemo, forwardRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'
import * as THREE from 'three'
import { useUniverseStore } from '@/store'
import { StarShaderMaterial } from './StarShaderMaterial'
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
  dwarf:      { color: '#ff5500', coronaColor: '#ff2200', intensity: 1.2 },
  yellow:     { color: '#ffcc00', coronaColor: '#ff8800', intensity: 1.4 },
  subgiant:   { color: '#ffeeaa', coronaColor: '#ffba00', intensity: 1.8 },
  giant:      { color: '#ffffff', coronaColor: '#00ccff', intensity: 2.2 },
  supergiant: { color: '#00f3ff', coronaColor: '#0077ff', intensity: 2.8 },
  hypergiant: { color: '#ffffff', coronaColor: '#ff00e5', intensity: 3.2 },
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

export const CentralStar = forwardRef<THREE.Mesh, CentralStarProps>(
  ({ score, totalRepos, totalStars, onClick }, ref) => {
  const coronaRef = useRef<THREE.Mesh>(null)
  const glowRef   = useRef<THREE.Mesh>(null)
  const ringRef1  = useRef<THREE.Mesh>(null)
  const ringRef2  = useRef<THREE.Mesh>(null)

  const { showClaimPulse, claimData } = useUniverseStore()
  const shaderRef = useRef<any>(null)

  const starType = getStarType(totalRepos)
  const baseCfg  = STAR_CONFIG[starType]
  
  // Apply claim customization with intelligent corona derivation
  const cfg = useMemo(() => {
    if (claimData?.star_color) {
      const base = new THREE.Color(claimData.star_color)
      // Create a darker, more saturated variant for the corona to preserve depth
      const corona = base.clone().multiplyScalar(0.4)
      return { 
        ...baseCfg, 
        color: claimData.star_color,
        coronaColor: `#${corona.getHexString()}`
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
    if (shaderRef.current) {
      shaderRef.current.uTime = t
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
        <meshBasicMaterial color={cfg.color} transparent opacity={0.05} side={THREE.BackSide} />
      </Sphere>

      {/* Mid glow */}
      <Sphere args={[starSize * 2.5, 32, 32]}>
        <meshBasicMaterial color={cfg.coronaColor} transparent opacity={0.10} side={THREE.BackSide} />
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

      {/* Corona to hide the hard edges */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[starSize * 1.05, 64, 64]} />
        <starShaderMaterial
          ref={shaderRef}
          uColor={new THREE.Color(cfg.color)}
          uCoronaColor={new THREE.Color(cfg.coronaColor)}
          uIntensity={cfg.intensity * 0.5}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Main star body — this is what GodRays targets */}
      <mesh ref={ref}>
        <sphereGeometry args={[starSize, 64, 64]} />
        <starShaderMaterial
          uColor={new THREE.Color(cfg.color)}
          uCoronaColor={new THREE.Color(cfg.coronaColor)}
          uIntensity={cfg.intensity}
        />
      </mesh>

      <ClaimPulse active={showClaimPulse} />

      <pointLight color={cfg.color} intensity={score > 10000 ? 10 : 7} distance={400} decay={1} />
      <pointLight color={cfg.coronaColor} intensity={2.5} distance={500} decay={0.8} />
    </group>
  )
}
)
