import { NextRequest } from 'next/server'
import { fetchUniverseData } from '@/lib/github'
import { supabaseAdmin } from '@/lib/supabase'
import { getLanguageColor } from '@/lib/language-colors'

export const runtime = 'nodejs' 
export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  const username = params.username.toLowerCase()

  try {
    const [data, claimResult] = await Promise.all([
      fetchUniverseData(username),
      supabaseAdmin 
        ? supabaseAdmin.from('claims').select('*').eq('username', username).single()
        : Promise.resolve({ data: null })
    ])

    const claim = claimResult.data
    const starColor = claim?.star_color || '#00e5ff'
    const bio = claim?.bio || ''
    
    // IMMERSIVE DIMENSIONS
    const width = 1000
    const height = 360
    const centerX = 280
    const centerY = 180

    let pinnedRepos = []
    if (claim?.pinned_repos?.length > 0) {
      pinnedRepos = claim.pinned_repos.map((name: string) => {
        const repo = data.repos.find(r => r.name === name)
        return {
          name,
          color: getLanguageColor(repo?.language || '')
        }
      }).slice(0, 5)
    } else {
      pinnedRepos = data.repos.slice(0, 5).map(r => ({
        name: r.name,
        color: getLanguageColor(r.language || '')
      }))
    }

    // Advanced 3D Planet Generation
    const planetDefs = pinnedRepos.map((repo: any, i: number) => `
      <radialGradient id="planetGrad-${i}" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stop-color="${repo.color}" stop-opacity="1" />
        <stop offset="60%" stop-color="${repo.color}" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#02040a" stop-opacity="0.9" />
      </radialGradient>
    `).join('')

    const orbits = pinnedRepos.map((repo: any, i: number) => {
      const rx = 100 + i * 45
      const ry = rx * 0.4
      const duration = 18 + i * 7
      const pathId = `orbit-${i}`
      const pathD = `M ${centerX + rx} ${centerY} a ${rx} ${ry} 0 1 1 0 -0.0001`
      const size = 6 + (i % 3) * 2 // Dynamic sizes
      
      let extras = ''
      if (i === 1) {
        // Add planetary rings
        extras = `<ellipse cx="0" cy="0" rx="${size * 2.2}" ry="${size * 0.6}" fill="none" stroke="${repo.color}" stroke-opacity="0.5" stroke-width="2" transform="rotate(-20)" />`
      }
      if (i === 3) {
        // Add a tiny moon 
        extras = `<circle cx="${size * 1.5}" cy="${size * 1.5}" r="2" fill="#fff" opacity="0.6" />`
      }

      return `
        <path id="${pathId}" d="${pathD}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1.5" stroke-dasharray="2 8" />
        <g>
          <animateMotion dur="${duration}s" repeatCount="indefinite">
            <mpath href="#${pathId}" />
          </animateMotion>
          <circle r="${size}" fill="url(#planetGrad-${i})" filter="drop-shadow(0 0 4px ${repo.color}55)" />
          ${extras}
        </g>
      `
    }).join('')

    // Generate random background stars
    const bgStars = Array.from({ length: 120 }).map(() => {
      const x = Math.floor(Math.random() * width)
      const y = Math.floor(Math.random() * height)
      const r = Math.random() * 1.5 + 0.3
      const dur = Math.random() * 4 + 3
      const delay = Math.random() * 5
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="0.1">
                <animate attributeName="opacity" values="0.1;0.9;0.1" dur="${dur}s" begin="${delay}s" repeatCount="indefinite" />
              </circle>`
    }).join('')

    // Language Spectrum Bar
    const topLangs = data.languages.slice(0, 4)
    const totalLangBytes = topLangs.reduce((sum: number, l: any) => sum + l.bytes, 0)
    let currentX = 0
    const langBars = topLangs.map((lang: any) => {
      const barWidth = Math.max(0.02, lang.bytes / totalLangBytes) * 380
      const rect = `<rect x="${currentX}" y="0" height="8" width="${barWidth}" fill="${lang.color}" />`
      currentX += barWidth
      return rect
    }).join('')

    const langLabels = topLangs.map((lang: any, i: number) => {
      const pct = Math.round((lang.bytes / totalLangBytes) * 100)
      const xPos = (i % 2) * 180
      const yPos = 30 + Math.floor(i / 2) * 18
      const output = `<g transform="translate(${xPos}, ${yPos})">
        <polygon points="0,-4 3,-1 0,2" fill="${lang.color}" />
        <text class="text-mono" x="8" y="0">${lang.name} ${pct}%</text>
      </g>`
      return output
    }).join('')

    // Sci-Fi Border frame for HUD
    const hudFrame = `
      <path d="M 0 20 L 20 0 L 410 0 L 430 20 L 430 310 L 410 330 L 20 330 L 0 310 Z" fill="#040710" opacity="0.9" stroke="rgba(0,229,255,0.2)" stroke-width="1.5" />
      <path d="M -5 15 L -5 -5 L 15 -5" fill="none" stroke="#00e5ff" stroke-width="2" />
      <path d="M 435 315 L 435 335 L 415 335" fill="none" stroke="#00e5ff" stroke-width="2" />
    `

    const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <style>
    .star-core { animation: corePulse 3s ease-in-out infinite alternate; }
    .star-flare { animation: flareSpin 20s linear infinite; transform-origin: ${centerX}px ${centerY}px; }
    @keyframes corePulse {
      0% { r: 28; filter: url(#neonGlow); }
      100% { r: 34; filter: url(#neonGlowIntense); }
    }
    @keyframes flareSpin {
      100% { transform: rotate(360deg); }
    }
    .text-title { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; font-weight: 900; font-size: 36px; fill: white; letter-spacing: -0.02em; }
    .text-value { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-weight: 800; font-size: 32px; fill: #ffffff; letter-spacing: 0.05em; }
    .text-mono { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 11px; fill: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.15em; font-weight: 600; }
    .text-mono-sub { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 9px; fill: rgba(0,229,255,0.6); text-transform: uppercase; letter-spacing: 0.25em; }
    .bio-text { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; font-size: 13px; fill: rgba(255,255,255,0.6); font-style: italic; font-weight: 300; }
    .neon-text { fill: #00e5ff; filter: drop-shadow(0 0 10px rgba(0,229,255,0.6)); }
  </style>

  <defs>
    <!-- Background Space Gradient -->
    <radialGradient id="deepSpace" cx="30%" cy="50%" r="80%" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#060918" />
      <stop offset="50%" stop-color="#020308" />
      <stop offset="100%" stop-color="#000000" />
    </radialGradient>
    
    <!-- Immersive Star Bloom -->
    <radialGradient id="starBloom1" cx="${centerX}" cy="${centerY}" r="220" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${starColor}" stop-opacity="0.35" />
      <stop offset="100%" stop-color="${starColor}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="starBloom2" cx="${centerX}" cy="${centerY}" r="100" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${starColor}" stop-opacity="0.6" />
      <stop offset="100%" stop-color="${starColor}" stop-opacity="0" />
    </radialGradient>
    
    ${planetDefs}

    <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="neonGlowIntense" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 2 0" result="boost" />
      <feComposite in="SourceGraphic" in2="boost" operator="over" />
    </filter>
    
    <!-- Perspective Grid Pattern -->
    <pattern id="gridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
      <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(0,229,255,0.03)" stroke-width="1"/>
    </pattern>
  </defs>

  <!-- Deep Space Base -->
  <rect width="${width}" height="${height}" fill="url(#deepSpace)" rx="24" />
  
  <!-- Perspective Grid -->
  <rect width="${width}" height="${height}" fill="url(#gridPattern)" rx="24" />

  <!-- Starfield -->
  ${bgStars}

  <!-- Massive Cinematic Nebula Glows -->
  <circle cx="20%" cy="40%" r="350" fill="rgba(0,229,255,0.02)" filter="blur(80px)" />
  <circle cx="80%" cy="70%" r="400" fill="rgba(255,0,128,0.015)" filter="blur(90px)" />

  <!-- The Star system Base -->
  <circle cx="${centerX}" cy="${centerY}" r="220" fill="url(#starBloom1)" />
  <circle cx="${centerX}" cy="${centerY}" r="100" fill="url(#starBloom2)" />
  
  <!-- Star Flare Polygon -->
  <polygon class="star-flare" points="${centerX},${centerY-60} ${centerX+15},${centerY-15} ${centerX+60},${centerY} ${centerX+15},${centerY+15} ${centerX},${centerY+60} ${centerX-15},${centerY+15} ${centerX-60},${centerY} ${centerX-15},${centerY-15}" fill="${starColor}" opacity="0.4" filter="url(#neonGlow)" />
  
  <!-- Core Star -->
  <circle cx="${centerX}" cy="${centerY}" r="30" fill="#ffffff" class="star-core" />
  
  ${orbits}

  <!-- Data HUD Frame -->
  <g transform="translate(520, 15)">
    <!-- Sci-Fi HUD Background -->
    ${hudFrame}
    
    <g transform="translate(35, 25)">
      <text class="text-mono-sub" x="0" y="0">// EXPLORER ORIGIN</text>
      <text class="text-title" x="0" y="32">@${data.username.toUpperCase()}</text>
      ${bio ? `<text class="bio-text" x="0" y="58">"${bio.length > 55 ? bio.slice(0, 52) + '...' : bio}"</text>` : ''}
      
      <!-- Stats Grid -->
      <g transform="translate(0, 95)">
        <!-- Score -->
        <g>
          <path d="M 0 5 L 5 0 L 160 0 L 160 80 L 155 85 L 0 85 Z" fill="rgba(0,229,255,0.03)" stroke="rgba(0,229,255,0.3)" stroke-width="1.5" />
          <text class="text-mono" x="16" y="28">Universe Score</text>
          <text class="text-value neon-text" x="16" y="68">${data.universeScore.toLocaleString()}</text>
        </g>
        <!-- Repos -->
        <g transform="translate(180, 0)">
          <path d="M 0 5 L 5 0 L 160 0 L 160 80 L 155 85 L 0 85 Z" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
          <text class="text-mono" x="16" y="28">Repositories</text>
          <text class="text-value" x="16" y="68">${data.repos.length}</text>
        </g>
      </g>

      <!-- Sub Stats -->
      <g transform="translate(0, 200)">
        <polygon points="0,0 12,0 16,16 0,16" fill="rgba(0,229,255,0.2)" />
        <text class="text-mono" x="24" y="12">Total Stars: <tspan fill="white">${data.totalStars}</tspan></text>
      </g>
      <g transform="translate(180, 200)">
        <polygon points="0,0 12,0 16,16 0,16" fill="rgba(0,229,255,0.2)" />
        <text class="text-mono" x="24" y="12">Code Age: <tspan fill="white">${(data.accountAgeYears || 0).toFixed(1)} y</tspan></text>
      </g>
      
      <!-- Language Bar -->
      <g transform="translate(0, 255)">
        <text class="text-mono-sub" y="0">// PRIMARY COMPOSITION MATRIX</text>
        <g transform="translate(0, 15)">
           <clipPath id="barR"><rect width="380" height="8" rx="4" /></clipPath>
           <g clip-path="url(#barR)">
             ${langBars}
           </g>
           ${langLabels}
        </g>
      </g>
    </g>
  </g>

  <!-- Live Status Dot -->
  <g transform="translate(30, 335)">
    <circle cx="0" cy="-4" r="4" fill="#00ff66">
      <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
    </circle>
    <text class="text-mono" x="14" y="0" fill="#00ff66">[ SYSTEM_ONLINE ]</text>
  </g>
  
  <!-- Outer Corner Targets -->
  <g stroke="rgba(0,229,255,0.3)" stroke-width="2">
    <path d="M 24 24 L 44 24 M 24 24 L 24 44" />
    <path d="M ${width-24} 24 L ${width-44} 24 M ${width-24} 24 L ${width-24} 44" />
    <path d="M 24 ${height-24} L 44 ${height-24} M 24 ${height-24} L 24 ${height-44}" />
    <path d="M ${width-24} ${height-24} L ${width-44} ${height-24} M ${width-24} ${height-24} L ${width-24} ${height-44}" />
  </g>
</svg>
`

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-store, max-age=0',
      },
    })
  } catch (err: any) {
    console.error('Embed SVG error:', err)
    return new Response('Failed to generate embed', { status: 500 })
  }
}
