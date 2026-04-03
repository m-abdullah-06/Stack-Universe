'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Html } from '@react-three/drei'

interface EnergyStreamProps {
  start?: [number, number, number]
  end: [number, number, number]
  color: string
}

/**
 * EnergyStream
 * Replaces the 'ugly singular line' with an animated flow of particles and soft flares.
 */
export function EnergyStream({ start = [0, 0, 0], end, color }: EnergyStreamProps) {
  const count = 15
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      offset: Math.random(), // initial position along the path (0 to 1)
      speed: 0.1 + Math.random() * 0.2, // speed of flow
      size: 0.05 + Math.random() * 0.1,
      opacity: 0.2 + Math.random() * 0.5
    }))
  }, [count])

  const meshRefs = useRef<(THREE.Mesh | null)[]>([])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    meshRefs.current.forEach((mesh, i) => {
      if (!mesh) return
      
      const p = particles[i]
      // Calculate progress along the line: (initialOffset + time * speed) % 1
      const progress = (p.offset + t * p.speed) % 1
      
      // Interpolate position
      const x = start[0] + (end[0] - start[0]) * progress
      const y = start[1] + (end[1] - start[1]) * progress
      const z = start[2] + (end[2] - start[2]) * progress
      
      mesh.position.set(x, y, z)
      
      // Fade in at start, fade out at end
      const fade = Math.sin(progress * Math.PI)
      if (mesh.material instanceof THREE.MeshBasicMaterial) {
        mesh.material.opacity = p.opacity * fade
      }
      
      // Subtle jitter/oscillation
      mesh.position.x += Math.sin(t * 2 + i) * 0.05
      mesh.position.y += Math.cos(t * 2.5 + i) * 0.05
    })
  })

  return (
    <group>
      {/* The main flow particles */}
      {particles.map((_, i) => (
        <mesh 
          key={i} 
          ref={(el) => { meshRefs.current[i] = el }}
        >
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial 
            color={color} 
            transparent 
            blending={THREE.AdditiveBlending} 
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}
