'use client'

import { useEffect, useRef } from 'react'

interface PinnedRepo {
  name: string
  language: string | null
  color: string
}

interface EmbedCanvasProps {
  starColor: string
  pinnedRepos: PinnedRepo[]
}

export function EmbedCanvas({ starColor, pinnedRepos }: EmbedCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrame: number
    let time = 0

    const render = () => {
      time += 0.015
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)

      const centerX = width * 0.35 // Shift star to the left to make room for text
      const centerY = height / 2

      // Draw Star Glow
      const pulse = Math.sin(time * 2) * 0.1 + 1.0
      const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 30 * pulse)
      grad.addColorStop(0, starColor)
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.globalAlpha = 0.3
      ctx.beginPath()
      ctx.arc(centerX, centerY, 30 * pulse, 0, Math.PI * 2)
      ctx.fill()

      // Draw Star Core
      ctx.globalAlpha = 1.0
      ctx.fillStyle = starColor
      ctx.beginPath()
      ctx.arc(centerX, centerY, 12 * (1 + Math.sin(time * 3) * 0.05), 0, Math.PI * 2)
      ctx.fill()

      // Draw Pinned Repos (Planets)
      pinnedRepos.forEach((repo, i) => {
        const orbitRadius = 45 + i * 18
        const speed = 0.4 / (i + 1)
        const angle = time * speed + i * (Math.PI * 2 / 3)

        const x = centerX + Math.cos(angle) * orbitRadius
        const y = centerY + Math.sin(angle) * orbitRadius * 0.5 // Elliptical for "3D" feel

        // Orbit path
        ctx.strokeStyle = 'rgba(255,255,255,0.05)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.ellipse(centerX, centerY, orbitRadius, orbitRadius * 0.5, 0, 0, Math.PI * 2)
        ctx.stroke()

        // Planet
        const planetPulse = Math.sin(time * 5 + i) * 0.1 + 1.0
        ctx.fillStyle = repo.color
        ctx.shadowBlur = 10
        ctx.shadowColor = repo.color
        ctx.beginPath()
        ctx.arc(x, y, 4 * planetPulse, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      })

      animationFrame = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animationFrame)
  }, [starColor, pinnedRepos])

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={180}
      className="absolute inset-0 pointer-events-none"
    />
  )
}
