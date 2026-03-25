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
    
    // Premium Dimensions
    const width = 540
    const height = 200
    const centerX = 150
    const centerY = 100

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
      const rx = 52 + i * 22
      const ry = rx * 0.5
      const duration = 12 + i * 6
      const pathId = `orbit-${i}`
      const pathD = `M ${centerX + rx} ${centerY} a ${rx} ${ry} 0 1 1 0 -0.0001`

      return `
        <path id="${pathId}" d="${pathD}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1" />
        <circle r="4.5" fill="${repo.color}" filter="url(#planetGlow)">
          <animateMotion dur="${duration}s" repeatCount="indefinite">
            <mpath href="#${pathId}" />
          </animateMotion>
          <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
        </circle>
      `
    }).join('')

    const svg = `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <style>
    .star { animation: pulse 4s ease-in-out infinite; transform-origin: ${centerX}px ${centerY}px; }
    @keyframes pulse {
      0%, 100% { r: 15; opacity: 0.8; }
      50% { r: 19; opacity: 1; }
    }
    .text-main { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-weight: 900; fill: white; }
    .text-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 10px; fill: rgba(255,255,255,0.45); text-transform: uppercase; letter-spacing: 0.2em; }
    .bio-text { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; font-size: 9px; fill: rgba(255,255,255,0.35); font-style: italic; }
  </style>
  
  <rect width="${width}" height="${height}" rx="16" fill="#000008" stroke="rgba(0,229,255,0.15)" stroke-width="1.5" />
  
  <defs>
    <radialGradient id="starGrad" cx="${centerX}" cy="${centerY}" r="40" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${starColor}" stop-opacity="0.4" />
      <stop offset="100%" stop-color="${starColor}" stop-opacity="0" />
    </radialGradient>
    <filter id="starGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="planetGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="rgba(0,229,255,0.04)" stroke-width="0.5"/>
    </pattern>
  </defs>
  
  <rect width="${width}" height="${height}" fill="url(#grid)" rx="16" />
  <circle cx="${centerX}" cy="${centerY}" r="50" fill="url(#starGrad)" />
  
  <!-- Central Star -->
  <circle cx="${centerX}" cy="${centerY}" r="17" fill="${starColor}" class="star" filter="url(#starGlow)" />
  <ellipse cx="${centerX}" cy="${centerY}" rx="35" ry="17.5" fill="none" stroke="${starColor}" stroke-width="0.5" stroke-dasharray="3 8" opacity="0.25" />
  
  <!-- Orbits & Planets -->
  ${orbits}
  
  <!-- Info Panel -->
  <g transform="translate(300, 45)">
    <text class="text-mono" y="0">Universe of</text>
    <text class="text-main" y="28" font-size="24" letter-spacing="-0.02em">@${data.username.toUpperCase()}</text>
    ${bio ? `<text class="bio-text" y="46">"${bio.length > 35 ? bio.slice(0, 32) + '...' : bio}"</text>` : ''}
    
    <g transform="translate(0, 68)">
      <g>
        <text class="text-mono" y="0">Universe Score</text>
        <text class="text-main" y="24" font-size="20" fill="#00e5ff">${data.universeScore.toLocaleString()}</text>
      </g>
      <g transform="translate(130, 0)">
        <text class="text-mono" y="0">Repositories</text>
        <text class="text-main" y="24" font-size="20">${data.repos.length}</text>
      </g>
    </g>
    
    <g transform="translate(0, 115)">
      <rect width="210" height="24" rx="6" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" />
      <text class="text-mono" x="10" y="15" font-size="9" fill="rgba(0,229,255,0.7)">Distance: ${data.distanceLabel}</text>
    </g>
  </g>
  
  <!-- Corner Accents -->
  <g stroke="rgba(0,229,255,0.25)" stroke-width="2">
    <path d="M 16 16 L 32 16 M 16 16 L 16 32" />
    <path d="M ${width-16} 16 L ${width-32} 16 M ${width-16} 16 L ${width-16} 32" />
    <path d="M 16 ${height-16} L 32 ${height-16} M 16 ${height-16} L 16 ${height-32}" />
    <path d="M ${width-16} ${height-16} L ${width-32} ${height-16} M ${width-16} ${height-16} L ${width-16} ${height-32}" />
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
