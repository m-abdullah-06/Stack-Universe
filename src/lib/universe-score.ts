import type { UniverseScore } from '@/types'

export function calculateUniverseScore(
  totalStars: number,
  totalRepos: number,
  languageCount: number,
  accountAgeYears: number
): number {
  return (
    totalStars * 10 +
    totalRepos * 5 +
    languageCount * 20 +
    Math.round(accountAgeYears * 15)
  )
}

export function calculateDistance(score: number): UniverseScore {
  const multiplier = 5_000_000
  const rawDistance = Math.max(1000, 50_000_000_000 - score * multiplier)
  const lightYears = Math.round(rawDistance)

  let distanceLabel: string
  let tier: string

  if (score < 500) {
    distanceLabel = 'Outer edges of known universe'
    tier = 'outer-edge'
  } else if (score < 2000) {
    distanceLabel = 'Deep space'
    tier = 'deep-space'
  } else if (score < 10000) {
    distanceLabel = 'Outer galaxy'
    tier = 'outer-galaxy'
  } else if (score < 50000) {
    distanceLabel = 'Known galaxy'
    tier = 'known-galaxy'
  } else {
    distanceLabel = 'Multiverse Core neighbor'
    tier = 'core'
  }

  return { score, lightYears, distanceLabel, tier }
}

export function formatLightYears(ly: number): string {
  if (ly >= 1_000_000_000) {
    return `${(ly / 1_000_000_000).toFixed(1)} billion light-years`
  }
  if (ly >= 1_000_000) {
    return `${(ly / 1_000_000).toFixed(1)} million light-years`
  }
  if (ly >= 1_000) {
    return `${(ly / 1_000).toFixed(1)} thousand light-years`
  }
  return `${ly.toLocaleString()} light-years`
}

export function getAccountAgeYears(createdAt: string): number {
  const created = new Date(createdAt)
  const now = new Date()
  return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
}

export function getDaysSinceActivity(dateStr: string): number {
  const date = new Date(dateStr)
  const now = new Date()
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
}

export function getOrbitSpeed(daysSinceActivity: number): number {
  // Recent activity (< 30 days) = fast orbit
  // Old activity (> 365 days) = very slow / frozen
  if (daysSinceActivity < 7) return 0.8
  if (daysSinceActivity < 30) return 0.5
  if (daysSinceActivity < 90) return 0.3
  if (daysSinceActivity < 180) return 0.2
  if (daysSinceActivity < 365) return 0.1
  return 0.03 // nearly frozen
}
