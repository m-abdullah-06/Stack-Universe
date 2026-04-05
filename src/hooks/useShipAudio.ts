'use client'

import { useEffect, useRef } from 'react'

export function useShipAudio(active: boolean, speedMultiplier: number, isProximity: boolean) {
  const audioCtx = useRef<AudioContext | null>(null)
  const engineOsc = useRef<OscillatorNode | null>(null)
  const engineGain = useRef<GainNode | null>(null)
  const proximityOsc = useRef<OscillatorNode | null>(null)
  const proximityGain = useRef<GainNode | null>(null)

  useEffect(() => {
    if (!active) {
      if (audioCtx.current && audioCtx.current.state !== 'closed') {
         audioCtx.current.close()
         audioCtx.current = null
      }
      return
    }

    // Initialize Audio Context on user interaction (handled by standard ambient toggle)
    if (!audioCtx.current) {
      audioCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      // 1. Engine Hum (Low Frequency)
      engineOsc.current = audioCtx.current.createOscillator()
      engineGain.current = audioCtx.current.createGain()
      engineOsc.current.type = 'sawtooth' // Rougher engine feel
      engineOsc.current.frequency.setValueAtTime(40, audioCtx.current.currentTime)
      engineGain.current.gain.setValueAtTime(0.05, audioCtx.current.currentTime)
      
      // Low pass filter to make it "deep"
      const filter = audioCtx.current.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(150, audioCtx.current.currentTime)

      engineOsc.current.connect(engineGain.current)
      engineGain.current.connect(filter)
      filter.connect(audioCtx.current.destination)
      engineOsc.current.start()

      // 2. Proximity Radar (Chirp)
      proximityOsc.current = audioCtx.current.createOscillator()
      proximityGain.current = audioCtx.current.createGain()
      proximityOsc.current.type = 'sine'
      proximityOsc.current.frequency.setValueAtTime(880, audioCtx.current.currentTime) // High A
      proximityGain.current.gain.setValueAtTime(0, audioCtx.current.currentTime)
      
      proximityOsc.current.connect(proximityGain.current)
      proximityGain.current.connect(audioCtx.current.destination)
      proximityOsc.current.start()
    }

    return () => {
      // Cleanup
    }
  }, [active])

  // Update Engine Pitch based on speed
  useEffect(() => {
    if (active && engineOsc.current && audioCtx.current) {
      const targetFreq = 40 + (speedMultiplier * 20)
      engineOsc.current.frequency.setTargetAtTime(targetFreq, audioCtx.current.currentTime, 0.1)
      engineGain.current?.gain.setTargetAtTime(0.05 + (speedMultiplier * 0.05), audioCtx.current.currentTime, 0.1)
    }
  }, [active, speedMultiplier])

  // Update Proximity Chirp
  useEffect(() => {
    if (active && proximityGain.current && audioCtx.current) {
       const gainVal = isProximity ? 0.03 : 0
       proximityGain.current.gain.setTargetAtTime(gainVal, audioCtx.current.currentTime, 0.1)
    }
  }, [active, isProximity])

  return null
}
