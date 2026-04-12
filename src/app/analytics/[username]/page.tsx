'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { AnalyticsDashboard } from '@/components/ui/AnalyticsDashboard'
import type { UniverseData } from '@/types'

export default function PublicAnalyticsPage() {
  const params = useParams()
  const rawUsername = params?.username as string
  const username = rawUsername?.replace(/^@/, '')?.toLowerCase()

  const [data, setData] = useState<UniverseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!username) return

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/github/${username}`)
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error || 'Failed to fetch')
        }
        const json: UniverseData = await res.json()
        setData(json)
      } catch (err: any) {
        setError(err.message || 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [username])

  if (!username) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020205]">
        <p className="font-mono text-space-magenta">Invalid username</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020205] gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-space-cyan border-t-transparent animate-spin" />
        <p className="font-mono text-xs text-space-cyan/60 tracking-widest uppercase">
          Loading analytics for @{username}...
        </p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#020205] gap-6">
        <div className="text-center">
          <p className="font-orbitron text-space-magenta text-xl mb-2">
            ANALYTICS UNAVAILABLE
          </p>
          <p className="font-mono text-xs text-gray-500 mb-4">
            @{username} could not be found or data could not be loaded.
          </p>
          <p className="font-mono text-xs text-gray-700">{error}</p>
        </div>
        <a
          href="/"
          className="font-mono text-xs text-space-cyan hover:text-white transition-colors tracking-widest"
        >
          ← RETURN TO MULTIVERSE
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#020205]">
      {/* SEO-friendly header for the public page */}
      <div className="border-b border-white/5 px-4 md:px-8 py-3 flex items-center justify-between">
        <a
          href="/"
          className="font-orbitron font-bold text-xs text-space-cyan tracking-widest hover:text-white transition-colors"
        >
          STACK UNIVERSE
        </a>
        <a
          href={`/${data.username}`}
          className="font-mono text-[10px] text-gray-500 hover:text-space-cyan transition-colors tracking-wider"
        >
          View Solar System →
        </a>
      </div>
      <AnalyticsDashboard data={data} standalone />
    </div>
  )
}
