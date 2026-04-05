import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Well-known top GitHub developers as seed data when DB is empty
const SEED_DEVS = [
  'torvalds', 'gaearon', 'sindresorhus', 'yyx990803',
  'tj', 'antirez', 'JakeWharton', 'addyosmani',
  'nicklockwood', 'jeresig',
]

async function fetchSeedLeaderboard() {
  const results = await Promise.allSettled(
    SEED_DEVS.map(async (username) => {
      const headers: HeadersInit = {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'StackUniverse',
      }
      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
      }

      const [userRes, reposRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`, { headers, next: { revalidate: 3600 } }),
        fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed`, { headers, next: { revalidate: 3600 } }),
      ])

      if (!userRes.ok) return null
      const user = await userRes.json()
      const repos = reposRes.ok ? await reposRes.json() : []

      const totalStars = Array.isArray(repos)
        ? repos.reduce((s: number, r: { stargazers_count: number }) => s + r.stargazers_count, 0)
        : 0
      const accountAgeYears =
        (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60 * 24 * 365.25)

      const langs = new Set(
        Array.isArray(repos)
          ? repos.filter((r: { language: string | null }) => r.language).map((r: { language: string }) => r.language)
          : []
      )

      const universe_score = Math.floor(
        totalStars * 10 +
        user.public_repos * 5 +
        langs.size * 20 +
        accountAgeYears * 15
      )

      return {
        username,
        universe_score,
        total_stars: totalStars,
        total_repos: user.public_repos as number,
        language_count: langs.size,
      }
    })
  )

  const validResults = results
    .filter((r) => r.status === 'fulfilled' && r.value !== null)
    .map((r) => (r as PromiseFulfilledResult<any>).value)

  return validResults
    .sort((a, b) => b.universe_score - a.universe_score)
    .map((entry, idx) => ({ rank: idx + 1, ...entry }))
}

export async function GET() {
  let dbLeaderboard: any[] = []

  // Try Supabase first
  if (supabase) {
    const { data, error } = await supabase
      .from('universes')
      .select('username, universe_score, total_stars, total_repos, language_count')
      .order('universe_score', { ascending: false })
      .limit(10)

    if (!error && data) {
      dbLeaderboard = data
    }
  }

  // If we have 10, just return them
  if (dbLeaderboard.length >= 10) {
    const leaderboard = dbLeaderboard.map((entry, idx) => ({ rank: idx + 1, ...entry }))
    return NextResponse.json({ leaderboard, source: 'db' })
  }

  // Fall back / Pad with live GitHub data for seed developers
  try {
    const seedLeaderboard = await fetchSeedLeaderboard()
    
    // Merge DB and Seed, ensuring no duplicate usernames
    const mergedMap = new Map()
    
    // Add seed first
    seedLeaderboard.forEach(entry => {
      mergedMap.set(entry.username.toLowerCase(), entry)
    })
    
    // DB overrides seed if there's an overlap
    dbLeaderboard.forEach(entry => {
      mergedMap.set(entry.username.toLowerCase(), entry)
    })

    // Sort by score descending and take top 10
    const finalLeaderboard = Array.from(mergedMap.values())
      .sort((a, b) => b.universe_score - a.universe_score)
      .slice(0, 10)
      .map((entry, idx) => ({ rank: idx + 1, ...entry }))

    return NextResponse.json({ leaderboard: finalLeaderboard, source: dbLeaderboard.length > 0 ? 'mixed' : 'github' })
  } catch (err) {
    console.error('Leaderboard fallback error:', err)
    // If fallback fails but we have some DB entries, return them
    if (dbLeaderboard.length > 0) {
      const leaderboard = dbLeaderboard.map((entry, idx) => ({ rank: idx + 1, ...entry }))
      return NextResponse.json({ leaderboard, source: 'db (fallback failed)' })
    }
    return NextResponse.json({ leaderboard: [] })
  }
}

