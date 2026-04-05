'use client'

import { useState, useEffect, useRef } from 'react'
import * as Tone from 'tone'
import { motion, AnimatePresence } from 'framer-motion'

interface UniverseRadioProps {
  score: number
  languages: string[]
  isOwner?: boolean
}

export function UniverseRadio({ score, languages, isOwner }: UniverseRadioProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const synthRef = useRef<Tone.PolySynth | null>(null)
  const bassRef = useRef<Tone.FMSynth | null>(null)
  const lfoRef = useRef<Tone.LFO | null>(null)

  // 1. Initialize Tone on mount
  useEffect(() => {
    return () => {
      // Cleanup
      if (synthRef.current) synthRef.current.dispose()
      if (bassRef.current) bassRef.current.dispose()
      if (lfoRef.current) lfoRef.current.dispose()
    }
  }, [])

  const startAudio = async () => {
    await Tone.start()
    
    // Scale mapping (Simplified Pentatonic)
    const notes = ['C3', 'Eb3', 'F3', 'G3', 'Bb3', 'C4', 'D4', 'Eb4']
    
    // Create Synth
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.8, decay: 0.1, sustain: 0.3, release: 2 }
    }).toDestination()

    const reverb = new Tone.Reverb({ decay: 5, wet: 0.6 }).toDestination()
    synth.connect(reverb)

    const bass = new Tone.FMSynth({
      harmonicity: 3.01,
      modulationIndex: 14,
      oscillator: { type: 'sine' },
      envelope: { attack: 2, decay: 0.1, sustain: 0.8, release: 4 }
    }).toDestination()
    bass.volume.value = -12

    // Logic based on score/languages
    const baseFreq = Math.min(Math.max(score / 500, 60), 440)
    const modRate = Math.min(languages.length * 0.5, 5)

    const lfo = new Tone.LFO(modRate, 0.2, 0.8).start()
    lfo.connect(synth.volume)

    synthRef.current = synth
    bassRef.current = bass
    lfoRef.current = lfo

    setIsPlaying(true)
    setIsLoaded(true)

    // Start Generative Loop
    const loop = new Tone.Loop(time => {
      // Pick random note from scale
      const noteIdx = Math.floor(Math.random() * notes.length)
      synth.triggerAttackRelease(notes[noteIdx], '2n', time)
      
      // Occasionally trigger bass
      if (Math.random() > 0.7) {
        bass.triggerAttackRelease('C1', '1n', time)
      }
    }, '4n').start(0)

    Tone.Transport.start()
  }

  const stopAudio = () => {
    Tone.Transport.stop()
    setIsPlaying(false)
  }

  return (
    <div className="fixed bottom-32 right-8 z-[70] flex flex-col items-end gap-3 pointer-events-auto">
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="hud-panel p-3 rounded-xl border border-space-cyan/30 bg-black/60 backdrop-blur-xl flex items-center gap-4"
          >
            {/* Visualizer Lines */}
            <div className="flex items-end gap-1 h-8">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-space-cyan shadow-[0_0_8px_rgba(0,229,255,0.8)]"
                  animate={{ height: ['20%', '90%', '40%', '70%', '30%'] }}
                  transition={{ duration: 0.5 + i * 0.1, repeat: Infinity, ease: 'easeInOut' }}
                />
              ))}
            </div>
            
            <div className="flex flex-col">
              <span className="font-orbitron font-bold text-[8px] text-space-cyan tracking-widest uppercase">
                UNIVERSE RESONANCE
              </span>
              <span className="font-mono text-[7px] text-white/40 uppercase">
                PROCEDURAL_STREAM_{score.toString(16).toUpperCase()}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={isPlaying ? stopAudio : startAudio}
        className={`group flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-300 ${
          isPlaying 
            ? 'border-space-cyan/60 bg-space-cyan/10 text-space-cyan' 
            : 'border-white/10 bg-black/40 text-white/40 hover:text-white hover:border-white/30'
        }`}
      >
        <div className="relative w-3 h-3 flex items-center justify-center">
           {isPlaying ? (
             <span className="block w-2 h-2 bg-space-cyan animate-pulse" />
           ) : (
             <div className="w-0 h-0 border-l-[6px] border-l-white/40 border-y-[4px] border-y-transparent ml-1 group-hover:border-l-white" />
           )}
        </div>
        <span className="font-orbitron text-[9px] font-bold tracking-[0.2em] uppercase">
          {isPlaying ? 'DISCONNECT RADIO' : 'ESTABLISH RESONANCE'}
        </span>
      </button>
    </div>
  )
}
