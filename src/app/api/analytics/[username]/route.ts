import { NextResponse } from 'next/server'
import { fetchUniverseData } from '@/lib/github'
import { calcRepoHealth } from '@/lib/repo-health'

export async function GET(
  request: Request,
  { params }: { params: { username: string } }
) {
  try {
    const data = await fetchUniverseData(params.username)

    // Compute analytics summary
    const ownRepos = data.repos.filter(r => !r.fork)
    const repoHealthScores = ownRepos.map(r => ({
      name: r.name,
      health: calcRepoHealth(r).score,
      stars: r.stargazers_count,
      language: r.language,
      pushed_at: r.pushed_at,
    }))

    const avgHealth = ownRepos.length > 0
      ? Math.round(repoHealthScores.reduce((s, r) => s + r.health, 0) / ownRepos.length)
      : 0

    // Language stats
    const langStats = data.languages.map(l => ({
      name: l.name,
      percentage: l.percentage,
      color: l.color,
      repoCount: l.repos.length,
    }))

    // CI/CD stats
    const cicdRepos = Object.entries(data.repoActions)
      .filter(([_, runs]) => runs.length > 0)
      .map(([name, runs]) => ({
        name,
        totalRuns: runs.length,
        passRate: runs.length > 0
          ? Math.round((runs.filter(r => r.conclusion === 'success').length / runs.length) * 100)
          : 0,
      }))

    return NextResponse.json({
      username: data.username,
      avatarUrl: data.user.avatar_url,
      universeScore: data.universeScore,
      distanceLabel: data.distanceLabel,
      totalStars: data.totalStars,
      totalRepos: data.repos.length,
      languageCount: data.languages.length,
      accountAgeYears: data.accountAgeYears,
      systemHealth: avgHealth,
      repoHealthScores,
      langStats,
      commitActivity: data.commitActivity,
      cicdRepos,
    })
  } catch (err: any) {
    if (err.message === 'USER_NOT_FOUND') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    if (err.message === 'RATE_LIMITED') {
      return NextResponse.json({ error: 'GitHub API rate limited' }, { status: 429 })
    }
    console.error('Analytics API error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
