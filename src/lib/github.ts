import type {
  GitHubUser,
  GitHubRepo,
  GitHubEvent,
  CommitData,
  LanguageData,
  UniverseData,
} from '@/types'
import { getLanguageColor } from './language-colors'
import {
  calculateUniverseScore,
  calculateDistance,
  getAccountAgeYears,
  getDaysSinceActivity,
} from './universe-score'

const GITHUB_API = 'https://api.github.com'

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'StackUniverse',
  }
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return headers
}

async function fetchGitHub<T>(path: string): Promise<T> {
  const res = await fetch(`${GITHUB_API}${path}`, {
    headers: getHeaders(),
    next: { revalidate: 300 },
  })
  if (res.status === 404) throw new Error('USER_NOT_FOUND')
  if (res.status === 403) throw new Error('RATE_LIMITED')
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`)
  return res.json()
}

export async function fetchUniverseData(username: string): Promise<UniverseData> {
  const [user, repos, events] = await Promise.all([
    fetchGitHub<GitHubUser>(`/users/${username}`),
    fetchGitHub<GitHubRepo[]>(
      `/users/${username}/repos?per_page=100&sort=pushed&type=owner`
    ),
    fetchGitHub<GitHubEvent[]>(`/users/${username}/events/public?per_page=30`).catch(
      () => [] as GitHubEvent[]
    ),
  ])

  // --- Language aggregation ---
  const langMap: Record<string, { bytes: number; repos: GitHubRepo[]; lastPushed: string }> = {}

  for (const repo of repos) {
    if (!repo.fork && repo.language) {
      if (!langMap[repo.language]) {
        langMap[repo.language] = { bytes: 0, repos: [], lastPushed: repo.pushed_at }
      }
      langMap[repo.language].bytes += repo.size * 1024
      langMap[repo.language].repos.push(repo)
      if (repo.pushed_at > langMap[repo.language].lastPushed) {
        langMap[repo.language].lastPushed = repo.pushed_at
      }
    }
  }

  const totalLangBytes = Object.values(langMap).reduce((s, v) => s + v.bytes, 0)

  const languages: LanguageData[] = Object.entries(langMap)
    .map(([name, data]) => ({
      name,
      bytes: data.bytes,
      percentage: totalLangBytes > 0 ? (data.bytes / totalLangBytes) * 100 : 0,
      color: getLanguageColor(name),
      repos: data.repos.sort((a, b) => b.stargazers_count - a.stargazers_count).slice(0, 6),
      lastPushed: data.lastPushed,
      daysSinceActivity: getDaysSinceActivity(data.lastPushed),
    }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 12)

  // --- Fetch language breakdown, commit activity, and open PRs for top 5 repos ---
  const top5 = [...repos]
    .filter(r => !r.fork)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5)

  const [langResults, activityResults, prResults] = await Promise.all([
    Promise.allSettled(
      top5.map(r =>
        fetchGitHub<Record<string, number>>(`/repos/${username}/${r.name}/languages`)
      )
    ),
    Promise.allSettled(
      top5.map(r =>
        // Returns array of 52 objects: { week, total, days[] }
        fetchGitHub<Array<{ week: number; total: number; days: number[] }>>(
          `/repos/${username}/${r.name}/stats/commit_activity`
        )
      )
    ),
    Promise.allSettled(
      top5.map(r =>
        fetchGitHub<Array<{
          id: number; number: number; title: string
          html_url: string; created_at: string
          user: { login: string } | null; draft: boolean
        }>>(`/repos/${username}/${r.name}/pulls?state=open&per_page=10`)
      )
    ),
  ])

  const repoLanguages: Record<string, Record<string, number>> = {}
  top5.forEach((r, i) => {
    const res = langResults[i]
    if (res.status === 'fulfilled') repoLanguages[r.name] = res.value
  })

  // Collapse 52 weekly totals → 12 monthly buckets (oldest first)
  const commitActivity: Record<string, number[]> = {}
  top5.forEach((r, i) => {
    const res = activityResults[i]
    if (res.status !== 'fulfilled' || !Array.isArray(res.value)) return
    const weeks = res.value  // 52 items, oldest first
    const months = Array(12).fill(0)
    weeks.forEach((w, wi) => {
      // Map week index (0-51) to month bucket (0-11)
      const monthIdx = Math.min(11, Math.floor(wi / (52 / 12)))
      months[monthIdx] += w.total
    })
    commitActivity[r.name] = months
  })

  const openPRs: Record<string, Array<{
    id: number; number: number; title: string
    html_url: string; created_at: string
    user: { login: string } | null; draft: boolean
  }>> = {}
  top5.forEach((r, i) => {
    const res = prResults[i]
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      openPRs[r.name] = res.value
    }
  })

  // --- Commit extraction ---
  const recentCommits: CommitData[] = []
  for (const event of events) {
    if (event.type === 'PushEvent' && event.payload.commits) {
      for (const commit of event.payload.commits.slice(0, 2)) {
        recentCommits.push({
          sha: commit.sha,
          message: commit.message.split('\n')[0].slice(0, 80),
          date: event.created_at,
          repoName: event.repo.name.split('/')[1],
          repoUrl: `https://github.com/${event.repo.name}`,
        })
      }
    }
    if (recentCommits.length >= 15) break
  }

  if (recentCommits.length === 0) {
    const recentPublicRepos = repos
      .filter(r => !r.fork)
      .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime())
      .slice(0, 3)

    const commitBatches = await Promise.allSettled(
      recentPublicRepos.map(repo =>
        fetchGitHub<Array<{
          sha: string
          commit: { message: string; author: { date: string } }
        }>>(`/repos/${username}/${repo.name}/commits?per_page=5`)
      )
    )

    for (let i = 0; i < commitBatches.length; i++) {
      const result = commitBatches[i]
      const repo = recentPublicRepos[i]
      if (result.status === 'fulfilled' && Array.isArray(result.value)) {
        for (const c of result.value) {
          recentCommits.push({
            sha: c.sha,
            message: c.commit.message.split('\n')[0].slice(0, 80),
            date: c.commit.author.date,
            repoName: repo.name,
            repoUrl: `https://github.com/${username}/${repo.name}`,
          })
        }
      }
      if (recentCommits.length >= 15) break
    }
  }

  // --- Stats ---
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0)
  const totalForks = repos.reduce((s, r) => s + r.forks_count, 0)
  const accountAgeYears = getAccountAgeYears(user.created_at)
  const universeScore = calculateUniverseScore(totalStars, repos.length, languages.length, accountAgeYears)
  const { lightYears, distanceLabel } = calculateDistance(universeScore)

  return {
    username,
    user,
    repos: repos.sort((a, b) => b.stargazers_count - a.stargazers_count),
    languages,
    recentCommits,
    totalStars,
    totalForks,
    universeScore,
    lightYears,
    distanceLabel,
    dominantLanguage: languages[0]?.name ?? null,
    accountAgeYears,
    repoLanguages,
    commitActivity,
    openPRs,
  }
}
