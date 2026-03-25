import { NextRequest } from 'next/server'
import { fetchUniverseData } from '@/lib/github'
import { supabaseAdmin } from '@/lib/supabase'
import { getLanguageColor } from '@/lib/language-colors'

export const runtime = 'nodejs' 

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  const username = params.username.toLowerCase()

  try {
    // 1. Fetch Data
    const [data, claimResult] = await Promise.all([
      fetchUniverseData(username),
      supabaseAdmin 
        ? supabaseAdmin.from('claims').select('*').eq('username', username).single()
        : Promise.resolve({ data: null })
    ])

    const claim = claimResult.data
    const starColor = claim?.star_color || '#00e5ff'
    const bio = claim?.bio || ''
    
    // 2. Identify Pinned/Top Repos for Orbits
    let pinnedRepos = []
    if (claim?.pinned_repos?.length > 0) {
      pinnedRepos = claim.pinned_repos.map((name: string) => {
        const repo = data.repos.find(r => r.name === name)
        return {
          name,
          color: getLanguageColor(repo?.language || '')
        }
      }).slice(0, 3)
    } else {
      pinnedRepos = data.repos.slice(0, 3).map(r => ({
        name: r.name,
        color: getLanguageColor(r.language || '')
      }))
    }

    // 3. Generate SVG Orbits
    const orbits = pinnedRepos.map((repo: any, i: number) => {
      const radius = 45 + i * 15
      const duration = 10 + i * 5
      return `
        <circle cx="100" cy="90" r="${radius}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
        <g class="orbit" style="--duration: ${duration}s">
          <circle cx="${100 + radius}" cy="90" r="4" fill="${repo.color}">
            <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      `
    }).join('')

    // 4. Build SVG
    const svg = `
<svg width="400" height="180" viewBox="0 0 400 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700&amp;family=JetBrains+Mono&amp;display=swap');
    
    .star { animation: pulse 4s ease-in-out infinite; }
    @keyframes pulse {
      0%, 100% { r: 15; opacity: 0.8; }
      50% { r: 18; opacity: 1; }
    }
    .orbit { animation: rotate var(--duration) linear infinite; transform-origin: 100px 90px; }
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .text-main { font-family: 'Orbitron', sans-serif; font-weight: bold; fill: white; }
    .text-mono { font-family: 'JetBrains Mono', monospace; font-size: 9px; fill: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.15em; }
    .bio-text { font-family: 'JetBrains Mono', monospace; font-size: 8px; fill: rgba(255,255,255,0.3); font-style: italic; }
  </style>
  
  <rect width="400" height="180" rx="12" fill="#000008" stroke="rgba(0,229,255,0.1)" stroke-width="1" />
  
  <!-- Grid -->
  <defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(0,229,255,0.03)" stroke-width="0.5"/>
    </pattern>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="400" height="180" fill="url(#grid)" rx="12" />
  
  <!-- Central Star -->
  <circle cx="100" cy="90" r="16" fill="${starColor}" class="star" filter="url(#glow)" />
  <circle cx="100" cy="90" r="28" fill="none" stroke="${starColor}" stroke-width="0.5" stroke-dasharray="2 6" opacity="0.3" />
  
  <!-- Orbits -->
  ${orbits}
  
  <!-- Info Panel -->
  <g transform="translate(220, 40)">
    <text class="text-mono" y="0">Universe of</text>
    <text class="text-main" y="24" font-size="20">@${data.username.toUpperCase()}</text>
    ${bio ? `<text class="bio-text" y="38" font-size="8">"${bio.length > 30 ? bio.slice(0, 27) + '...' : bio}"</text>` : ''}
    
    <g transform="translate(0, 58)">
      <text class="text-mono" y="0">Score</text>
      <text class="text-main" y="20" font-size="16" fill="#00e5ff">${data.universeScore.toLocaleString()}</text>
      
      <text class="text-mono" x="90" y="0">Repos</text>
      <text class="text-main" x="90" y="20" font-size="16">${data.repos.length}</text>
    </g>
    
    <g transform="translate(0, 105)">
      <rect width="160" height="22" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
      <text class="text-mono" x="8" y="14" font-size="8" fill="rgba(0,229,255,0.6)">Distance: ${data.distanceLabel}</text>
    </g>
  </g>
  
  <!-- Accents -->
  <g stroke="rgba(0,229,255,0.2)" stroke-width="1.5">
    <path d="M 12 12 L 24 12 M 12 12 L 12 24" />
    <path d="M 388 12 L 376 12 M 388 12 L 388 24" />
    <path d="M 12 168 L 24 168 M 12 168 L 12 156" />
    <path d="M 388 168 L 376 168 M 388 168 L 388 156" />
  </g>
</svg>
    `

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err: any) {
    console.error('Embed SVG error:', err)
    return new Response('Failed to generate embed', { status: 500 })
  }
}
