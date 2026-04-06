'use client'

import { useRef, useEffect, useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useUniverseStore } from '@/store'
import type { StoredUniverse } from '@/types'

interface MultiverseMapProps {
  universes: StoredUniverse[]
}

export function MultiverseMap({ universes }: MultiverseMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const { data: session, status } = useSession()
  const setShowAuthGate = useUniverseStore(s => s.setShowAuthGate)
  
  // React State (for triggering UI overlays like Tooltips)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const [hovered, setHovered] = useState<StoredUniverse | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Refs for performance-critical Animation Loop (prevents frame drops)
  const offsetRef = useRef({ x: 0, y: 0 })
  const scaleRef = useRef(1)
  const hoveredRef = useRef<StoredUniverse | null>(null)
  const universesRef = useRef(universes)

  useEffect(() => {
    universesRef.current = universes
  }, [universes])

  // Constellation Cache
  const constellations = useMemo(() => {
    const lines: [StoredUniverse, StoredUniverse][] = []
    if (universes.length < 2) return lines

    for (let i = 0; i < universes.length; i++) {
      for (let j = i + 1; j < universes.length; j++) {
        const u1 = universes[i]
        const u2 = universes[j]
        
        if (u1.top_languages && u2.top_languages) {
          const shared = u1.top_languages.filter(l => u2.top_languages?.includes(l))
          if (shared.length >= 3) {
            lines.push([u1, u2])
          }
        }
      }
    }
    return lines
  }, [universes])

  // Region Labels Cache
  const regions = useMemo(() => {
    return [
      { name: "The JavaScript Nebula", x: -400, y: -200, color: "#f7df1e" },
      { name: "The Rust Cluster", x: 400, y: 300, color: "#dea584" },
      { name: "The Python Belt", x: -600, y: 500, color: "#3776ab" },
      { name: "The TypeScript Corridor", x: 200, y: -600, color: "#3178c6" },
    ]
  }, [])

  // High-Performance Draw Loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const render = () => {
      if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const curOffset = offsetRef.current
      const curScale = scaleRef.current
      const curHovered = hoveredRef.current
      const curUniverses = universesRef.current

      const centerX = canvas.width / 2 + curOffset.x
      const centerY = canvas.height / 2 + curOffset.y

      ctx.fillStyle = '#050510'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.scale(curScale, curScale)
      
      // 1. Constellations
      ctx.lineWidth = 0.5 / curScale
      constellations.forEach(([u1, u2]) => {
        ctx.strokeStyle = 'rgba(0, 229, 255, 0.08)'
        ctx.beginPath()
        ctx.moveTo(u1.position_x, u1.position_z)
        ctx.lineTo(u2.position_x, u2.position_z)
        ctx.stroke()
      })

      // 2. Universes
      curUniverses.forEach((u) => {
        const isHovered = curHovered?.id === u.id
        const radius = (Math.max(u.universe_score / 20000, 2) + (isHovered ? 4 : 0)) / curScale
        
        ctx.beginPath()
        ctx.arc(u.position_x, u.position_z, radius, 0, Math.PI * 2)
        
        const hue = (u.universe_score * 137.5) % 360
        ctx.fillStyle = isHovered ? '#fff' : `hsla(${hue}, 80%, 70%, 0.8)`
        ctx.shadowBlur = isHovered ? 20 : 0
        ctx.shadowColor = `hsla(${hue}, 80%, 70%, 0.8)`
        ctx.fill()
        
        if (isHovered) {
          ctx.strokeStyle = '#fff'
          ctx.lineWidth = 2 / curScale
          ctx.stroke()
        }
      })

      // 3. Regions
      ctx.font = `${12 / curScale}px Orbitron`
      ctx.textAlign = 'center'
      regions.forEach(r => {
        ctx.fillStyle = `${r.color}22`
        ctx.fillText(r.name.toUpperCase(), r.x, r.y)
      })

      ctx.restore()
      animationFrameId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animationFrameId)
  }, [constellations, regions])

  // Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const startX = e.clientX - offsetRef.current.x
    const startY = e.clientY - offsetRef.current.y
    
    const onMouseMove = (moveEvent: MouseEvent) => {
      const newOffset = {
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY
      }
      offsetRef.current = newOffset
      setOffset(newOffset)
    }
    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }

  const handleWheel = (e: React.WheelEvent) => {
    const newScale = Math.min(Math.max(scaleRef.current - e.deltaY * 0.001, 0.05), 10)
    scaleRef.current = newScale
    setScale(newScale)
  }

  const handlePointerMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setMousePos({ x: e.clientX, y: e.clientY })

    const worldX = (x - (rect.width / 2 + offsetRef.current.x)) / scaleRef.current
    const worldY = (y - (rect.height / 2 + offsetRef.current.y)) / scaleRef.current

    let found: StoredUniverse | null = null
    let minDist = 20 / scaleRef.current

    universes.forEach(u => {
      const dx = u.position_x - worldX
      const dy = u.position_z - worldY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < minDist) {
        minDist = dist
        found = u
      }
    })

    hoveredRef.current = found
    setHovered(found)
    document.body.style.cursor = found ? 'pointer' : 'crosshair'
  }

  const handleClick = () => {
    if (!hovered) return
    
    if (status === 'unauthenticated') {
      setShowAuthGate(true)
    } else {
      router.push(`/universe/${hovered.username}`)
    }
  }

  return (
    <div className="w-full h-full relative cursor-crosshair">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onMouseMove={handlePointerMove}
        onClick={handleClick}
        className="block"
      />

      {hovered && (
        <div 
          className="fixed pointer-events-none z-50 hud-panel p-4 rounded-xl border border-white/20 bg-black/80 backdrop-blur-xl"
          style={{ left: mousePos.x + 20, top: mousePos.y + 20 }}
        >
          <div className="flex flex-col gap-1">
            <h3 className="font-orbitron font-bold text-space-cyan uppercase tracking-wider text-sm">
              @{hovered.username}
            </h3>
            <div className="flex gap-4 font-mono text-[9px] text-gray-400">
              <span>SCORE: {hovered.universe_score.toLocaleString()}</span>
              <span>STARS: {hovered.total_stars.toLocaleString()}</span>
            </div>
            {hovered.top_languages && (
              <div className="flex flex-wrap gap-1 mt-2">
                {hovered.top_languages.slice(0, 3).map((lang: string) => (
                  <span key={lang} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-[7px] text-gray-500 uppercase">
                    {lang}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 pt-2 border-t border-white/5 font-mono text-[8px] text-space-gold animate-pulse uppercase">
              Click to Warp Into System →
            </div>
          </div>
        </div>
      )}

      <div className="absolute bottom-12 left-8 font-mono text-[8px] text-gray-600 flex flex-col gap-1 z-10 pointer-events-none">
        <p>[ SCROLL ] ZOOM IN/OUT</p>
        <p>[ DRAG ] PAN CAMERA</p>
        <p>[ CLICK ] FLY TO UNIVERSE</p>
      </div>
    </div>
  )
}
