'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import type { GitHubUser } from '@/types'

interface CentralStarProps {
  user: GitHubUser
  score: number
  totalStars: number
  totalRepos: number
  onClick: () => void
}

export function CentralStar({ score, onClick }: CentralStarProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const coronaRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)

  // Star size based on score (1.2 to 3.5)
  const starSize = useMemo(() => {
    return Math.max(1.2, Math.min(3.5, 1.2 + (score / 10000) * 2.3))
  }, [score])

  // Star color based on score tier
  const starColor = useMemo(() => {
    if (score > 50000) return '#fff5e0' // blue-white giant
    if (score > 10000) return '#ffffcc' // yellow-white
    if (score > 2000) return '#ffdd88' // yellow
    if (score > 500) return '#ffaa44' // orange
    return '#ff7733' // red dwarf
  }, [score])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (meshRef.current) {
      meshRef.current.rotation.y = t * 0.05
      meshRef.current.rotation.x = Math.sin(t * 0.1) * 0.05
    }
    if (coronaRef.current) {
      coronaRef.current.rotation.z = -t * 0.03
      coronaRef.current.rotation.y = t * 0.02
      const pulse = 1 + Math.sin(t * 1.5) * 0.04
      coronaRef.current.scale.setScalar(pulse)
    }
    if (glowRef.current) {
      const pulse2 = 1 + Math.sin(t * 0.8 + 1) * 0.06
      glowRef.current.scale.setScalar(pulse2)
    }
  })

  return (
    <group onClick={onClick}>
      {/* Outer glow sphere */}
      <Sphere ref={glowRef} args={[starSize * 2.5, 32, 32]}>
        <meshBasicMaterial
          color={starColor}
          transparent
          opacity={0.04}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Mid glow */}
      <Sphere args={[starSize * 1.8, 32, 32]}>
        <meshBasicMaterial
          color={starColor}
          transparent
          opacity={0.08}
          side={THREE.BackSide}
        />
      </Sphere>

      {/* Corona */}
      <Sphere ref={coronaRef} args={[starSize * 1.25, 16, 16]}>
        <MeshDistortMaterial
          color={starColor}
          emissive={starColor}
          emissiveIntensity={0.3}
          distort={0.3}
          speed={2}
          transparent
          opacity={0.5}
          wireframe={false}
        />
      </Sphere>

      {/* Main star body */}
      <Sphere ref={meshRef} args={[starSize, 64, 64]}>
        <MeshDistortMaterial
          color={starColor}
          emissive={starColor}
          emissiveIntensity={1.2}
          distort={0.15}
          speed={3}
          roughness={0.1}
          metalness={0}
        />
      </Sphere>

      {/* Point light for illuminating planets */}
      <pointLight
        color={starColor}
        intensity={score > 10000 ? 3 : 2}
        distance={200}
        decay={1}
      />
      <pointLight
        color={starColor}
        intensity={0.5}
        distance={300}
        decay={0.5}
      />
    </group>
  )
}
