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

  const drawMandala = (ctx: CanvasRenderingContext2D, width: number, height: number, isForExport = false) => {
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) * 0.35
    const languages = data.languages.slice(0, 12) // Limit to top 12 for clarity
    const N = languages.length

    // Clear background
    if (isForExport) {
      // Dark space background for export
      const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(width, height))
      grad.addColorStop(0, '#050510')
      grad.addColorStop(1, '#000000')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, width, height)
      
      // Add some subtle star dust for export
      for (let i = 0; i < 200; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.5})`
        ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1)
      }
    } else {
      ctx.clearRect(0, 0, width, height)
    }

    if (N === 0) return

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
      const targetLength = maxRadius * (lang.percentage / 100) * 1.5 // Multiplier for visual drama
      const petalWidth = (Math.PI * 2 / N) * 0.8
      
      // Gradient for petal
      const petalGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, targetLength)
      petalGrad.addColorStop(0, `${lang.color}22`)
      petalGrad.addColorStop(0.7, `${lang.color}88`)
      petalGrad.addColorStop(1, lang.color)

      ctx.save()
      ctx.rotate(angle)
      
      // Draw Petal Shape
      ctx.beginPath()
      ctx.moveTo(0, 0)
      // Bezier curve for organic "DNA" feel
      ctx.bezierCurveTo(targetLength * 0.3, -maxRadius * 0.1, targetLength * 0.6, -maxRadius * 0.05, targetLength, 0)
      ctx.bezierCurveTo(targetLength * 0.6, maxRadius * 0.05, targetLength * 0.3, maxRadius * 0.1, 0, 0)
      
      ctx.fillStyle = petalGrad
      ctx.fill()
      
      // Glowing edge
      ctx.strokeStyle = lang.color
      ctx.lineWidth = 2
      ctx.shadowBlur = 15
      ctx.shadowColor = lang.color
      ctx.stroke()
      
      // Particle "Seeds" along the spine
      ctx.fillStyle = '#fff'
      for (let p = 1; p <= 5; p++) {
        const px = targetLength * (p / 5)
        ctx.beginPath()
        ctx.arc(px, 0, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
      
      ctx.restore()
    })

    // 3. Draw Connecting Web (The "Genome Matrix")
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

    // 4. Center Core
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 20)
    coreGrad.addColorStop(0, '#fff')
    coreGrad.addColorStop(0.5, '#00e5ff')
    coreGrad.addColorStop(1, 'transparent')
    ctx.fillStyle = coreGrad
    ctx.beginPath()
    ctx.arc(0, 0, 20, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()

    // 5. Branding (For Export)
    if (isForExport) {
      ctx.fillStyle = '#fff'
      ctx.font = 'bold 24px Orbitron'
      ctx.textAlign = 'center'
      ctx.fillText(`@${data.username}'s Developer DNA`, width / 2, 60)
      
      ctx.font = '12px Courier New'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.fillText('DECODED VIA STACK-UNIVERSE.VERCEL.APP', width / 2, height - 40)
      
      // Top languages summary
      ctx.textAlign = 'left'
      ctx.font = '10px Courier New'
      languages.slice(0, 5).forEach((lang, i) => {
        ctx.fillStyle = lang.color
        ctx.fillText(`${lang.name}: ${lang.percentage.toFixed(1)}%`, 40, height - 120 + (i * 15))
      })
    }
  }

  useEffect(() => {
    if (!showDNAFingerprint || !canvasRef.current || !containerRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = containerRef.current!.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
      drawMandala(ctx, rect.width, rect.height)
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
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
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-8 bg-black/90 backdrop-blur-3xl"
        >
          <div className="relative w-full max-w-4xl h-full max-h-[85vh] flex flex-col items-center bg-white/[0.02] border border-white/10 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
            
            {/* Header */}
            <div className="w-full flex items-center justify-between p-6 border-b border-white/5">
              <div>
                <h2 className="font-orbitron text-xl md:text-2xl font-black text-white tracking-[0.2em] uppercase">Tech Stack DNA</h2>
                <p className="font-mono text-[10px] text-space-cyan tracking-widest uppercase">Biometric Repository Signature</p>
              </div>
              <button 
                onClick={() => setShowDNAFingerprint(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors border border-white/10"
              >
                ✕
              </button>
            </div>

            {/* Canvas Container */}
            <div ref={containerRef} className="flex-1 w-full relative touch-none">
              <canvas ref={canvasRef} className="w-full h-full" />
              
              {/* Overlay Hint */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center pointer-events-none">
                <p className="font-mono text-[9px] text-white/30 uppercase tracking-[0.3em] px-4">
                  Every slice represents a language percentage of your career
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="w-full p-6 flex flex-col md:flex-row gap-4 border-t border-white/5 bg-black/40">
              <button 
                onClick={handleDownload}
                className="flex-1 bg-white text-black font-orbitron font-bold py-3 rounded-xl hover:bg-space-cyan transition-all flex items-center justify-center gap-2"
              >
                📥 DOWNLOAD IDENTITY PNG
              </button>
              <button 
                onClick={handleShareTwitter}
                className="flex-1 bg-[#1DA1F2] text-white font-orbitron font-bold py-3 rounded-xl hover:bg-[#1a91da] transition-all flex items-center justify-center gap-2"
              >
                𝕏 SHARE TO WORLD
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
