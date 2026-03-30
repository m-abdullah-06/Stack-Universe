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
    
    // Premium Dimensions
    const width = 800
    const height = 400
    const centerX = 240
    const centerY = 200

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

    const orbits = pinnedRepos.map((repo: any, i: number) => {
      const rx = 80 + i * 35
      const ry = rx * 0.45
      const duration = 15 + i * 6
      const pathId = `orbit-${i}`
      const pathD = `M ${centerX + rx} ${centerY} a ${rx} ${ry} 0 1 1 0 -0.0001`

      return `
        <path id="${pathId}" d="${pathD}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1.5" stroke-dasharray="2 6" />
        <circle r="6" fill="${repo.color}" filter="url(#planetGlow)">
          <animateMotion dur="${duration}s" repeatCount="indefinite">
            <mpath href="#${pathId}" />
          </animateMotion>
        </circle>
      `
    }).join('')

    // Generate random background stars
    const bgStars = Array.from({ length: 70 }).map(() => {
      const x = Math.floor(Math.random() * width)
      const y = Math.floor(Math.random() * height)
      const r = Math.random() * 1.5 + 0.5
      const dur = Math.random() * 3 + 2
      const delay = Math.random() * 3
      return `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffffff" opacity="0.2">
                <animate attributeName="opacity" values="0.1;0.8;0.1" dur="${dur}s" begin="${delay}s" repeatCount="indefinite" />
              </circle>`
    }).join('')

    // Language Spectrum Bar
    const topLangs = data.languages.slice(0, 4)
    const totalLangBytes = topLangs.reduce((sum: number, l: any) => sum + l.bytes, 0)
    let currentX = 0
    const langBars = topLangs.map((lang: any) => {
      const barWidth = Math.max(0.02, lang.bytes / totalLangBytes) * 310
      const rect = `<rect x="${currentX}" y="0" height="6" width="${barWidth}" fill="${lang.color}" />`
      currentX += barWidth
      return rect
    }).join('')

    let currentLabelX = 0
    const langLabels = topLangs.map((lang: any) => {
      const pct = Math.round((lang.bytes / totalLangBytes) * 100)
      const output = `<g transform="translate(${currentLabelX}, 22)">
        <circle cx="2" cy="-3" r="3" fill="${lang.color}" />
        <text class="text-mono" x="8" y="0">${lang.name} ${pct}%</text>
      </g>`
      currentLabelX += 95 // better fixed spacing
      return output
    }).join('')

    const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <style>
    .star { animation: pulse 4s ease-in-out infinite; transform-origin: ${centerX}px ${centerY}px; }
    @keyframes pulse {
      0%, 100% { r: 24; opacity: 1; filter: url(#hyperGlow); }
      50% { r: 28; opacity: 1; filter: url(#hyperGlowSubtle); }
    }
    .text-title { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; font-weight: 900; font-size: 28px; fill: white; letter-spacing: -0.01em; }
    .text-value { font-family: ui-sans-serif, system-ui, -apple-system, sans-serif; font-weight: 800; font-size: 28px; fill: #ffffff; }
    .text-mono { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 10px; fill: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.15em; }
    .bio-text { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 11px; fill: rgba(255,255,255,0.6); font-style: italic; }
    .neon-text { fill: #00e5ff; filter: drop-shadow(0 0 8px rgba(0,229,255,0.8)); }
  </style>

  <defs>
    <!-- Background Gradient -->
    <radialGradient id="bgGrad" cx="40%" cy="50%" r="70%" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#080a14" />
      <stop offset="100%" stop-color="#020205" />
    </radialGradient>
    
    <!-- Central Star Bloom -->
    <radialGradient id="starBloom1" cx="${centerX}" cy="${centerY}" r="180" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${starColor}" stop-opacity="0.25" />
      <stop offset="100%" stop-color="${starColor}" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="starBloom2" cx="${centerX}" cy="${centerY}" r="80" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${starColor}" stop-opacity="0.6" />
      <stop offset="100%" stop-color="${starColor}" stop-opacity="0" />
    </radialGradient>
    
    <!-- Filters -->
    <filter id="hyperGlow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="hyperGlowSubtle" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="planetGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="glassBlur">
      <feGaussianBlur in="BackgroundImage" stdDeviation="10" />
    </filter>
  </defs>

  <!-- Base Grid & Background -->
  <rect width="${width}" height="${height}" fill="url(#bgGrad)" rx="24" />
  
  <!-- Starfield -->
  ${bgStars}

  <!-- Massive Nebula Glow -->
  <circle cx="200" cy="150" r="250" fill="rgba(0,229,255,0.025)" opacity="0.8" />
  <circle cx="600" cy="250" r="300" fill="rgba(255,0,229,0.015)" opacity="0.8" />

  <!-- The Star system -->
  <circle cx="${centerX}" cy="${centerY}" r="180" fill="url(#starBloom1)" />
  <circle cx="${centerX}" cy="${centerY}" r="80" fill="url(#starBloom2)" />
  <circle cx="${centerX}" cy="${centerY}" r="24" fill="${starColor}" class="star" />
  
  ${orbits}

  <!-- Glass HUD Panel -->
  <g transform="translate(420, 30)">
    <!-- Right bounding HUD Backdrop -->
    <rect x="-24" y="-10" width="370" height="340" fill="#0c101a" opacity="0.85" rx="16" stroke="rgba(0,229,255,0.2)" stroke-width="1.5" />
    
    <text class="text-mono" x="0" y="20">Explorer Identity</text>
    <text class="text-title" x="0" y="55">@${data.username.toUpperCase()}</text>
    ${bio ? `<text class="bio-text" x="0" y="80">"${bio.length > 50 ? bio.slice(0, 47) + '...' : bio}"</text>` : ''}
    
    <!-- Stats Grid -->
    <g transform="translate(0, 115)">
      <!-- Score -->
      <g>
        <rect width="150" height="75" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(0,229,255,0.2)" stroke-width="1" />
        <text class="text-mono" x="16" y="26">Universe Score</text>
        <text class="text-value neon-text" x="16" y="60">${data.universeScore.toLocaleString()}</text>
      </g>
      <!-- Repos & Stars -->
      <g transform="translate(165, 0)">
        <rect width="150" height="75" rx="12" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
        <text class="text-mono" x="16" y="26">Repositories</text>
        <text class="text-value" x="16" y="60">${data.repos.length}</text>
      </g>
    </g>

    <!-- Total Stars & Account Age -->
    <g transform="translate(0, 205)">
      <rect width="150" height="40" rx="8" fill="rgba(255,255,255,0.015)" />
      <text class="text-mono" x="16" y="24">Total Stars: <tspan fill="white" font-weight="bold">${data.totalStars}</tspan></text>
    </g>
    <g transform="translate(165, 205)">
      <rect width="150" height="40" rx="8" fill="rgba(255,255,255,0.015)" />
      <text class="text-mono" x="16" y="24">Code Age: <tspan fill="white" font-weight="bold">${data.accountAgeYears.toFixed(1)}y</tspan></text>
    </g>
    
    <!-- Language Bar -->
    <g transform="translate(0, 275)">
      <text class="text-mono" y="0">Primary Composition</text>
      <g transform="translate(0, 12)">
         <!-- Clip path to round the combined bar -->
         <clipPath id="barR"><rect width="310" height="6" rx="3" /></clipPath>
         <g clip-path="url(#barR)">
           ${langBars}
         </g>
         ${langLabels}
      </g>
    </g>
  </g>

  <!-- Live Status Dot -->
  <g transform="translate(35, 360)">
    <circle cx="0" cy="-4" r="4" fill="#00ff66">
      <animate attributeName="opacity" values="0.2;1;0.2" dur="2s" repeatCount="indefinite" />
    </circle>
    <text class="text-mono" x="12" y="0" fill="#00ff66">[ SYSTEM_ACTIVE ]</text>
  </g>
  
  <!-- Outer Corner Accents -->
  <g stroke="rgba(255,255,255,0.15)" stroke-width="2" opacity="0.4">
    <path d="M 32 32 L 48 32 M 32 32 L 32 48" />
    <path d="M ${width-32} 32 L ${width-48} 32 M ${width-32} 32 L ${width-32} 48" />
    <path d="M 32 ${height-32} L 48 ${height-32} M 32 ${height-32} L 32 ${height-48}" />
    <path d="M ${width-32} ${height-32} L ${width-48} ${height-32} M ${width-32} ${height-32} L ${width-32} ${height-48}" />
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
