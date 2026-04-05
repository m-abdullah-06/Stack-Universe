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

import { useKeyboard } from '@/hooks/useKeyboard'

// Interactive WASD Flight with Proximity Triggers
function ControlledShipCamera({ 
  cockpitMode, 
  universes, 
  onTargetSelect,
  onProximityChange
}: { 
  cockpitMode?: boolean, 
  universes: StoredUniverse[],
  onTargetSelect?: (username: string) => void,
  onProximityChange?: (username: string | null) => void
}) {
  const keys = useKeyboard()
  const t = useRef(0)
  const targetLookAt = useRef(new THREE.Vector3(0, 0, -500))
  const lastProximityTrigger = useRef<string | null>(null)
  const lastWarningTarget = useRef<string | null>(null)

  useFrame((state, delta) => {
    if (cockpitMode) {
      // 1. Position Setup (Movement)
      const moveSpeed = delta * 60
      const direction = new THREE.Vector3()
      state.camera.getWorldDirection(direction)
      const side = new THREE.Vector3().crossVectors(state.camera.up, direction).normalize()

      if (keys.forward) state.camera.position.addScaledVector(direction, moveSpeed)
      if (keys.backward) state.camera.position.addScaledVector(direction, -moveSpeed)
      if (keys.left) state.camera.position.addScaledVector(side, moveSpeed)
      if (keys.right) state.camera.position.addScaledVector(side, -moveSpeed)
      if (keys.up) state.camera.position.y += moveSpeed
      if (keys.down) state.camera.position.y -= moveSpeed

      // 2. Interactive Steering (Mouse-based)
      const steerX = state.pointer.x * 150
      const steerY = state.pointer.y * 100
      const nextLookAt = new THREE.Vector3(
        state.camera.position.x + steerX, 
        state.camera.position.y + steerY, 
        state.camera.position.z - 500
      )
      targetLookAt.current.lerp(nextLookAt, 0.03)
      state.camera.lookAt(targetLookAt.current)

      // 3. Dynamic Bank (Z-rotation)
      state.camera.rotation.z = THREE.MathUtils.lerp(
        state.camera.rotation.z,
        -state.pointer.x * 0.15,
        0.05
      )

      // 4. Proximity Detection (Auto-Trigger & Warning)
      let nearestTarget: string | null = null
      for (const u of universes) {
        const uPos = new THREE.Vector3(u.position_x, u.position_y, u.position_z)
        const dist = state.camera.position.distanceTo(uPos)
        
        // Entry threshold (Much tighter now to prevent accidental warp)
        if (dist < 6 && lastProximityTrigger.current !== u.username) {
          lastProximityTrigger.current = u.username
          onTargetSelect?.(u.username)
          break
        }

        // Warning threshold
        if (dist < 25) {
          nearestTarget = u.username
        }
      }

      if (nearestTarget !== lastWarningTarget.current) {
        lastWarningTarget.current = nearestTarget
        onProximityChange?.(nearestTarget)
      }

      // 5. Hyperspace FOV Stretching (Speed Effect)
      if ((state.camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
        const cam = state.camera as THREE.PerspectiveCamera
        const targetFov = keys.forward ? 85 : 75
        cam.fov = THREE.MathUtils.lerp(cam.fov, targetFov, 0.05)
        cam.updateProjectionMatrix()
      }

      return
    }

    // Standard Map Mode Drift
    t.current += delta * 0.05
    state.camera.position.x = Math.sin(t.current) * 8
    state.camera.position.y = Math.cos(t.current * 0.7) * 3
    state.camera.lookAt(0, 0, 0)
    state.camera.rotation.z = 0
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
  cockpitMode?: boolean
  selectedTarget?: string | null
  onTargetSelect?: (username: string) => void
  onProximityChange?: (username: string | null) => void
}

export function MultiverseScene({ 
  universes, 
  leaderboard, 
  isWarping, 
  onWarpStart,
  cockpitMode,
  selectedTarget,
  onTargetSelect,
  onProximityChange
}: MultiverseSceneProps) {
  const router = useRouter()

  const handlePointerMissed = async () => {
    if (isWarping || cockpitMode) return
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
        onPointerMissed={cockpitMode ? undefined : handlePointerMissed}
        camera={{ position: [0, 20, 80], fov: 75, near: 0.1, far: 3000 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 1.5]}
        style={{ background: '#000008' }}
      >
        <AdaptiveDpr pixelated />
        <ambientLight intensity={0.02} />
        <ControlledShipCamera 
          cockpitMode={cockpitMode} 
          universes={universes}
          onTargetSelect={onTargetSelect}
          onProximityChange={onProximityChange}
        />

        <Suspense fallback={null}>
          <Stars radius={500} depth={120} count={12000} factor={6} saturation={0.5} fade speed={0.25} />
          <NebulaClouds />
          <DistantUniverses 
            universes={universes} 
            top10Usernames={leaderboard.slice(0, 10).map((e) => e.username)} 
            cockpitMode={cockpitMode}
            onTargetSelect={onTargetSelect}
          />

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
