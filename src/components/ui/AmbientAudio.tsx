'use client'

import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export function AmbientAudio() {
  const [enabled, setEnabled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  // Store masterGain so stopAudio can actually fade it
  const masterGainRef = useRef<GainNode | null>(null)
  const nodesRef = useRef<OscillatorNode[]>([])

  useEffect(() => {
    setMounted(true)
    return () => {
      // Cleanup on unmount
      nodesRef.current.forEach(o => { try { o.stop() } catch {} })
      ctxRef.current?.close()
    }
  }, [])

  const startAudio = async () => {
    const AudioCtx = window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()
    ctxRef.current = ctx

    // Browsers suspend AudioContext until a user gesture — resume it
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    const master = ctx.createGain()
    master.gain.setValueAtTime(0, ctx.currentTime)
    master.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 3)
    master.connect(ctx.destination)
    masterGainRef.current = master  // ← store reference

    const addDrone = (freq: number, vol: number, detune = 0) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.detune.value = detune
      gain.gain.value = vol
      osc.connect(gain)
      gain.connect(master)
      osc.start()
      nodesRef.current.push(osc)

      // Slow LFO tremolo
      const lfo = ctx.createOscillator()
      const lfoGain = ctx.createGain()
      lfo.frequency.value = 0.04 + Math.random() * 0.08
      lfoGain.gain.value = vol * 0.25
      lfo.connect(lfoGain)
      lfoGain.connect(gain.gain)
      lfo.start()
      nodesRef.current.push(lfo)
    }

    addDrone(36,  0.40)        // sub-bass root
    addDrone(54,  0.20,  3)    // fifth +3¢
    addDrone(72,  0.15, -4)    // octave -4¢
    addDrone(108, 0.08,  6)    // next fifth
    addDrone(144, 0.05, -8)    // double octave

    // Shimmer
    const shimmer = ctx.createOscillator()
    const shimGain = ctx.createGain()
    shimmer.type = 'triangle'
    shimmer.frequency.value = 432
    shimGain.gain.value = 0.02
    shimmer.connect(shimGain)
    shimGain.connect(master)
    shimmer.start()
    nodesRef.current.push(shimmer)
  }

  const stopAudio = () => {
    const ctx = ctxRef.current
    const master = masterGainRef.current
    if (!ctx || !master) return

    // Fade out the ACTUAL masterGain we stored
    master.gain.setValueAtTime(master.gain.value, ctx.currentTime)
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5)

    setTimeout(() => {
      nodesRef.current.forEach(o => { try { o.stop() } catch {} })
      nodesRef.current = []
      ctx.close()
      ctxRef.current = null
      masterGainRef.current = null
    }, 1600)
  }

  const toggle = async () => {
    if (enabled) {
      stopAudio()
      setEnabled(false)
    } else {
      await startAudio()
      setEnabled(true)
    }
  }

  if (!mounted) return null

  return (
    <motion.button
      onClick={toggle}
      className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 font-mono text-[9px] tracking-widest transition-all flex items-center gap-2"
      style={{ color: enabled ? '#00e5ff' : '#888' }}
      whileHover={{ scale: 1.03, backgroundColor: 'rgba(255,255,255,0.05)' }}
      whileTap={{ scale: 0.97 }}
      title={enabled ? 'Mute ambient sound' : 'Enable ambient sound'}
    >
      {enabled ? (
        <>
          <span className="flex gap-px items-end h-3">
            {[1, 2, 3, 2, 1].map((h, i) => (
              <motion.div
                key={i}
                className="w-0.5 bg-space-cyan rounded-full"
                animate={{ height: [`${h * 4}px`, `${h * 8}px`, `${h * 4}px`] }}
                transition={{ duration: 0.6 + i * 0.1, repeat: Infinity, delay: i * 0.1 }}
              />
            ))}
          </span>
          <span>AMBIENT ON</span>
        </>
      ) : (
        <>
          <span className="text-gray-700">♪</span>
          <span>AMBIENT OFF</span>
        </>
      )}
    </motion.button>
  )
}
