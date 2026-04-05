'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUniverseStore } from '@/store'
import { UniverseData } from '@/types'

interface DNAFingerprintProps {
  data: UniverseData
}

export function DNAFingerprint({ data }: DNAFingerprintProps) {
  const { showDNAFingerprint, setShowDNAFingerprint } = useUniverseStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    console.log('DNA Panel visibility changed:', showDNAFingerprint);
  }, [showDNAFingerprint]);

  const drawMandala = (ctx: CanvasRenderingContext2D, width: number, height: number, isForExport = false) => {
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) * 0.35
    
    // Safety check for languages
    const languages = (data?.languages || []).slice(0, 12)
    const N = languages.length

    if (N === 0) {
      console.warn('No languages found for DNA generation');
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('NO GENOMIC DATA FOUND', centerX, centerY);
      return
    }

    // Clear background
    if (isForExport) {
      const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height))
      grad.addColorStop(0, '#050510')
      grad.addColorStop(1, '#000000')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)
      
      for (let i = 0; i < 200; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`
        ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1)
      }
    } else {
      ctx.clearRect(0, 0, width, height)
    }

    ctx.save()
    ctx.translate(centerX, centerY)

    // 1. Draw outer rings
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.1)'
    ctx.lineWidth = 1
    for (let r = 1; r <= 4; r++) {
      ctx.beginPath()
      ctx.arc(0, 0, maxRadius * (r / 4), 0, Math.PI * 2)
      ctx.stroke()
    }

    // 2. Draw language petals/spikes
    languages.forEach((lang, i) => {
      const angle = i * (Math.PI * 2 / N) - Math.PI / 2
      const targetLength = maxRadius * (lang.percentage / 100) * 1.5
      
      const petalGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, targetLength)
      petalGrad.addColorStop(0, `${lang.color}22`)
      petalGrad.addColorStop(0.7, `${lang.color}88`)
      petalGrad.addColorStop(1, lang.color)

      ctx.save()
      ctx.rotate(angle)
      
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.bezierCurveTo(targetLength * 0.3, -maxRadius * 0.1, targetLength * 0.6, -maxRadius * 0.05, targetLength, 0)
      ctx.bezierCurveTo(targetLength * 0.6, maxRadius * 0.05, targetLength * 0.3, maxRadius * 0.1, 0, 0)
      
      ctx.fillStyle = petalGrad
      ctx.fill()
      
      ctx.strokeStyle = lang.color
      ctx.lineWidth = 2
      ctx.stroke()
      
      ctx.restore()
    })

    // 3. Draw Connecting Web
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.lineWidth = 0.5
    languages.forEach((lang, i) => {
      const angle = i * (Math.PI * 2 / N) - Math.PI / 2
      const length = maxRadius * (lang.percentage / 100) * 1.5
      const x = Math.cos(angle) * length
      const y = Math.sin(angle) * length
      
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.closePath()
    ctx.stroke()

    ctx.restore()

    if (isForExport) {
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 24px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(`@${data.username}'s Developer DNA`, width / 2, 60)
      
      ctx.font = '12px Courier New'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.fillText('DECODED VIA STACK-UNIVERSE.VERCEL.APP', width / 2, height - 40)
    }
  }

  useEffect(() => {
    if (!showDNAFingerprint || !canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      if (!containerRef.current) return
      const dpr = window.devicePixelRatio || 1
      const rect = containerRef.current.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) return
      
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      drawMandala(ctx, rect.width, rect.height)
    }

    // Delay slightly to ensure component is fully rendered and measured
    const timer = setTimeout(resize, 100)
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      clearTimeout(timer)
    }
  }, [showDNAFingerprint, data])

  const handleDownload = () => {
    setIsExporting(true)
    const exportWidth = 1200
    const exportHeight = 1200
    const canvas = document.createElement('canvas')
    canvas.width = exportWidth
    canvas.height = exportHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    drawMandala(ctx, exportWidth, exportHeight, true)
    
    const link = document.createElement('a')
    link.download = `${data.username}-developer-dna.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    setIsExporting(false)
  }

  const handleShareTwitter = () => {
    const text = `Just decoded my Developer DNA on Stack Universe! 🧬✨\n\nCheck out my universe and get yours at: https://stack-universe.vercel.app/${data.username}\n\n#DeveloperDNA #BuildInPublic @Stack_Universe`
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <AnimatePresence>
      {showDNAFingerprint && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ pointerEvents: 'auto' }}
          className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8 bg-black/95 backdrop-blur-2xl"
          onClick={() => setShowDNAFingerprint(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl h-full max-h-[85vh] flex flex-col items-center bg-black border border-white/20 rounded-3xl overflow-hidden shadow-2xl"
          >
            
            {/* Header */}
            <div className="w-full flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
              <div>
                <h2 className="font-orbitron text-xl md:text-2xl font-black text-white tracking-[0.2em] uppercase">Tech Stack DNA</h2>
                <p className="font-mono text-[10px] text-space-cyan tracking-widest uppercase">Biometric Signature // @{data.username}</p>
              </div>
              <button 
                onClick={() => setShowDNAFingerprint(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
              >
                ✕
              </button>
            </div>

            {/* Canvas Container */}
            <div ref={containerRef} className="flex-1 w-full relative bg-gradient-to-b from-black to-[#050510] overflow-hidden">
              <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />
              
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none w-full px-4">
                <p className="font-mono text-[9px] text-white/30 uppercase tracking-[0.3em]">
                  Unique Genomic visualization based on language registry
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full p-6 flex flex-col md:flex-row gap-4 border-t border-white/10 bg-black/80">
              <button 
                onClick={handleDownload}
                disabled={isExporting}
                className="flex-1 bg-white text-black font-orbitron font-bold py-4 rounded-xl hover:bg-space-cyan transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExporting ? 'GENERATING...' : '📥 DOWNLOAD PNG'}
              </button>
              <button 
                onClick={handleShareTwitter}
                className="flex-1 bg-white/[0.05] border border-white/10 text-white font-orbitron font-bold py-4 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                𝕏 SHARE TO WORLD
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
