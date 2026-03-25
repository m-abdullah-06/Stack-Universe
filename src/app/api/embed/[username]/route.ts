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
    const [data, claimResult] = await Promise.all([
      fetchUniverseData(username),
      supabaseAdmin 
        ? supabaseAdmin.from('claims').select('*').eq('username', username).single()
        : Promise.resolve({ data: null })
    ])

    const claim = claimResult.data
    const starColor = claim?.star_color || '#00e5ff'
    const bio = claim?.bio || ''
    
    // Width and Center Logic
    const width = 480
    const height = 180
    const centerX = 160
    const centerY = 90

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

    const orbits = pinnedRepos.map((repo: any, i: number) => {
      const rx = 45 + i * 18
      const ry = rx * 0.5
      const duration = 10 + i * 5
      const pathId = `orbit-${i}`
      
      // Ellipse path starting from the right side
      const pathD = `M ${centerX + rx} ${centerY} a ${rx} ${ry} 0 1 1 0 -0.0001`

      return `
        <path id="${pathId}" d="${pathD}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1" />
        <circle r="4" fill="${repo.color}">
          <animateMotion dur="${duration}s" repeatCount="indefinite">
            <mpath href="#${pathId}" />
          </animateMotion>
          <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
          <animate attributeName="r" values="3.5;4.5;3.5" dur="3s" repeatCount="indefinite" />
        </circle>
      `
    }).join('')

    const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <style>
    .star { animation: pulse 4s ease-in-out infinite; transform-origin: ${centerX}px ${centerY}px; }
    @keyframes pulse {
      0%, 100% { r: 14; opacity: 0.8; }
      50% { r: 17; opacity: 1; }
    }
    .text-main { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-weight: 800; fill: white; }
    .text-mono { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 9px; fill: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.15em; }
    .bio-text { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 8px; fill: rgba(255,255,255,0.3); font-style: italic; }
  </style>
  
  <rect width="${width}" height="${height}" rx="12" fill="#000008" stroke="rgba(0,229,255,0.1)" stroke-width="1" />
  
  <defs>
    <pattern id="grid" width="24" height="24" patternUnits="userSpaceOnUse">
      <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(0,229,255,0.03)" stroke-width="0.5"/>
    </pattern>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grid)" rx="12" />
  
  <!-- Central Star -->
  <circle cx="${centerX}" cy="${centerY}" r="16" fill="${starColor}" class="star" filter="url(#glow)" />
  <ellipse cx="${centerX}" cy="${centerY}" rx="30" ry="15" fill="none" stroke="${starColor}" stroke-width="0.5" stroke-dasharray="2 6" opacity="0.2" />
  
  <!-- Orbits & Planets -->
  ${orbits}
  
  <!-- Info Panel -->
  <g transform="translate(310, 40)">
    <text class="text-mono" y="0">Universe of</text>
    <text class="text-main" y="24" font-size="18">@${data.username.toUpperCase()}</text>
    ${bio ? `<text class="bio-text" y="38" font-size="8">"${bio.length > 30 ? bio.slice(0, 27) + '...' : bio}"</text>` : ''}
    
    <g transform="translate(0, 58)">
      <text class="text-mono" y="0">Score</text>
      <text class="text-main" y="20" font-size="16" fill="#00e5ff">${data.universeScore.toLocaleString()}</text>
      
      <text class="text-mono" x="90" y="0">Repos</text>
      <text class="text-main" x="90" y="20" font-size="16">${data.repos.length}</text>
    </g>
    
    <g transform="translate(0, 105)">
      <rect width="170" height="22" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" />
      <text class="text-mono" x="8" y="14" font-size="8" fill="rgba(0,229,255,0.6)">Distance: ${data.distanceLabel}</text>
    </g>
  </g>
  
  <!-- Accents -->
  <g stroke="rgba(0,229,255,0.2)" stroke-width="1.5">
    <path d="M 12 12 L 24 12 M 12 12 L 12 24" />
    <path d="M ${width-12} 12 L ${width-24} 12 M ${width-12} 12 L ${width-12} 24" />
    <path d="M 12 ${height-12} L 24 ${height-12} M 12 ${height-12} L 12 ${height-24}" />
    <path d="M ${width-12} ${height-12} L ${width-24} ${height-12} M ${width-12} ${height-12} L ${width-12} ${height-24}" />
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
