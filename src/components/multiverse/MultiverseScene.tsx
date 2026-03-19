'use client'

import { Suspense, useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, AdaptiveDpr } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { DistantUniverses } from './DistantUniverses'
import type { StoredUniverse, LeaderboardEntry } from '@/types'
import * as THREE from 'three'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

// Very slow camera drift
function DriftCamera() {
  const t = useRef(0)
  useFrame((state, delta) => {
    t.current += delta * 0.05
    state.camera.position.x = Math.sin(t.current) * 8
    state.camera.position.y = Math.cos(t.current * 0.7) * 3
    state.camera.lookAt(0, 0, 0)
  })
  return null
}

// Nebula cloud particles — positions + colors memoized so geometry is stable
function NebulaClouds() {
  const ref = useRef<THREE.Points>(null)

  const { positions, colors } = useMemo(() => {
    const count = 800
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const r = 100 + Math.random() * 400
      const theta = Math.random() * Math.PI * 2
      const phi = (Math.random() - 0.5) * Math.PI * 0.4
      positions[i * 3]     = r * Math.cos(theta) * Math.cos(phi)
      positions[i * 3 + 1] = r * Math.sin(phi) * 0.5
      positions[i * 3 + 2] = r * Math.sin(theta) * Math.cos(phi)

      // cyan/purple/magenta mix
      const pick = Math.random()
      if (pick < 0.4) {
        colors[i * 3] = 0; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 1
      } else if (pick < 0.7) {
        colors[i * 3] = 0.48; colors[i * 3 + 1] = 0.18; colors[i * 3 + 2] = 1
      } else {
        colors[i * 3] = 1; colors[i * 3 + 1] = 0; colors[i * 3 + 2] = 0.43
      }
    }
    return { positions, colors }
  }, [])

  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.002
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.6} vertexColors transparent opacity={0.15} sizeAttenuation />
    </points>
  )
}

interface MultiverseSceneProps {
  universes: StoredUniverse[]
  leaderboard: LeaderboardEntry[]
  isWarping?: boolean
  onWarpStart?: () => void
}

export function MultiverseScene({ universes, leaderboard, isWarping, onWarpStart }: MultiverseSceneProps) {
  const router = useRouter()

  const handlePointerMissed = async () => {
    if (isWarping) return
    onWarpStart?.()

    try {
      document.body.style.cursor = 'wait'
      const res = await fetch('/api/random-github-user')
      if (res.ok) {
        const data = await res.json()
        if (data.username) {
          router.push(`/universe/${data.username}`)
          return
        }
      }
      document.body.style.cursor = 'default'
    } catch {
      document.body.style.cursor = 'default'
    }
  }

  return (
    <div className="absolute inset-0" style={{ cursor: isWarping ? 'wait' : 'pointer' }}>
      <Canvas
        onPointerMissed={handlePointerMissed}
        camera={{ position: [0, 20, 80], fov: 75, near: 0.1, far: 3000 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
        style={{ background: '#000008' }}
      >
        <AdaptiveDpr pixelated />
        <ambientLight intensity={0.02} />
        <DriftCamera />

        <Suspense fallback={null}>
          <Stars radius={500} depth={100} count={8000} factor={5} saturation={0.1} fade speed={0.1} />
          <NebulaClouds />
          <DistantUniverses universes={universes} top10Usernames={leaderboard.slice(0, 10).map((e) => e.username)} />

          <EffectComposer>
            <Bloom
              intensity={2.0}
              luminanceThreshold={0.2}
              luminanceSmoothing={0.8}
              blendFunction={BlendFunction.SCREEN}
            />
          </EffectComposer>
        </Suspense>
      </Canvas>
    </div>
  )
}
