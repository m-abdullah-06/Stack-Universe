'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Orbitron } from 'next/font/google'
import { getLanguageColor } from '@/lib/language-colors'
import { EmbedCanvas } from '@/components/embed/EmbedCanvas'
import type { UniverseData } from '@/types'

const orbitron = Orbitron({ subsets: ['latin'] })

export default function EmbedPage() {
  const params = useParams()
  const router = useRouter()
  const rawUsername = params?.username as string
  const decodedUsername = rawUsername ? decodeURIComponent(rawUsername) : ''
  const username = decodedUsername.replace(/^@/, '').toLowerCase()

  const [data, setData] = useState<UniverseData | null>(null)
  const [claim, setClaim] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!username) return
    console.log('[Embed] Fetching for username:', username)

    const fetchData = async () => {
      try {
        const [res, claimRes] = await Promise.all([
          fetch(`/api/github/${username}`),
          fetch(`/api/claim/${username}`, { cache: 'no-store' })
        ])

        if (res.ok) {
          setData(await res.json())
        } else {
          console.error('[Embed] GitHub fetch failed:', res.status)
        }
        if (claimRes.ok) {
          const c = await claimRes.json()
          setClaim(c.claim)
        }
      } catch (err) {
        console.error('Embed fetch failed:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [username])

  const pinnedRepos = useMemo(() => {
    if (!data) return []
    
    // If user has manually pinned repos
    if (claim?.pinned_repos?.length > 0) {
      return claim.pinned_repos.map((name: string) => {
        const repo = data.repos.find(r => r.name === name)
        return {
          name,
          language: repo?.language || null,
          color: getLanguageColor(repo?.language || '')
        }
      }).slice(0, 3)
    }

    // Fallback to top 3 by stars
    return data.repos
      .slice(0, 3)
      .map(r => ({
        name: r.name,
        language: r.language || null,
        color: getLanguageColor(r.language || '')
      }))
  }, [data, claim])

  if (loading) return (
    <div className="w-[400px] h-[180px] bg-black flex items-center justify-center border border-white/5">
      <div className="w-4 h-4 border-2 border-space-cyan/30 border-t-space-cyan rounded-full animate-spin" />
    </div>
  )

  if (!data) return (
    <div className="w-[400px] h-[180px] bg-black flex items-center justify-center border border-white/5">
      <p className="font-mono text-[10px] text-gray-600 uppercase tracking-widest">Universe not found</p>
    </div>
  )

  return (
    <div 
      onClick={() => router.push(`/${username}`)}
      className="group relative w-[400px] h-[180px] bg-black overflow-hidden border border-white/5 cursor-pointer flex items-center px-8"
    >
      {/* Background Static Logic */}
      <div className="absolute inset-0 grid-overlay opacity-10 pointer-events-none" />
      
      {/* Canvas Animation */}
      <EmbedCanvas 
        starColor={claim?.star_color || '#00e5ff'} 
        pinnedRepos={pinnedRepos} 
      />

      {/* Info Panel (Right Side) */}
      <div className="relative z-10 ml-auto text-right flex flex-col justify-center gap-1 max-w-[180px]">
        <div className="mb-2">
          <p className="font-mono text-[8px] text-space-cyan/40 tracking-[0.2em] uppercase leading-none mb-1">UNIVERSE OF</p>
          <h2 className={`${orbitron.className} font-bold text-lg text-white leading-none truncate`}>
            @{data.username}
          </h2>
          {(claim?.bio) && (
            <p className="font-mono text-[8px] text-gray-500 italic mt-1 truncate">
              "{claim.bio}"
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4">
          <div className="text-right">
            <p className="font-mono text-[7px] text-gray-600 uppercase tracking-widest leading-none mb-1">Score</p>
            <p className={`${orbitron.className} font-bold text-sm text-space-cyan leading-none`}>
              {data.universeScore.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-[7px] text-gray-600 uppercase tracking-widest leading-none mb-1">Stats</p>
            <p className={`${orbitron.className} font-bold text-sm text-white leading-none`}>
              {data.repos.length} <span className="text-[7px] font-mono font-normal opacity-40">REPOS</span>
            </p>
          </div>
        </div>

        <div className="mt-2 bg-white/5 border border-white/10 rounded-md py-1 px-2 flex items-center justify-between">
          <span className="font-mono text-[7px] text-gray-500 uppercase tracking-widest">Distance</span>
          <span className="font-mono text-[8px] text-space-cyan truncate ml-2 max-w-[80px]">
            {data.distanceLabel}
          </span>
        </div>
      </div>

      {/* Version & Link Hint */}
      <div className="absolute bottom-2 left-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="font-mono text-[6px] text-gray-700 tracking-widest">v1.0.4</span>
        <span className="font-mono text-[7px] text-space-cyan uppercase tracking-tighter">VIEW FULL UNIVERSE →</span>
      </div>
    </div>
  )
}
