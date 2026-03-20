import type { GitHubRepo } from '@/types'

export type HealthTier = 'thriving' | 'healthy' | 'struggling' | 'dormant'

export interface RepoHealth {
  score: number        // 0–100
  tier: HealthTier
  label: string
  color: string
  breakdown: { label: string; points: number; earned: boolean }[]
}

export function calcRepoHealth(repo: GitHubRepo): RepoHealth {
  const daysSince = Math.floor(
    (Date.now() - new Date(repo.pushed_at).getTime()) / 86400000
  )

  const checks = [
    {
      label: 'Pushed within 30 days',
      points: 25,
      earned: daysSince <= 30,
    },
    {
      label: 'Pushed within 90 days',
      points: 15,
      // only awards if not already in 30-day window
      earned: daysSince > 30 && daysSince <= 90,
    },
    {
      label: 'Has description',
      points: 10,
      earned: !!repo.description && repo.description.trim().length > 0,
    },
    {
      label: 'Has at least 1 star',
      points: 10,
      earned: repo.stargazers_count > 0,
    },
    {
      label: 'More than 10 stars',
      points: 10,
      earned: repo.stargazers_count > 10,
    },
    {
      label: 'More than 100 stars',
      points: 15,
      earned: repo.stargazers_count > 100,
    },
    {
      label: 'Not a fork',
      points: 15,
      earned: !repo.fork,
    },
  ]

  const score = Math.min(
    100,
    checks.reduce((sum, c) => sum + (c.earned ? c.points : 0), 0)
  )

  let tier: HealthTier
  let label: string
  let color: string

  if (score >= 80) {
    tier  = 'thriving'
    label = 'Thriving'
    color = '#00e5a0'
  } else if (score >= 50) {
    tier  = 'healthy'
    label = 'Healthy'
    color = '#00e5ff'
  } else if (score >= 20) {
    tier  = 'struggling'
    label = 'Struggling'
    color = '#ff8844'
  } else {
    tier  = 'dormant'
    label = 'Dormant'
    color = '#556677'
  }

  return { score, tier, label, color, breakdown: checks }
}
