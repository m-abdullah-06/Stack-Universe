export type ViewMode = 'repos' | 'langs'

export type StarType = 'dwarf' | 'yellow' | 'subgiant' | 'giant' | 'supergiant' | 'hypergiant'

export type RepoTier = 1 | 2 | 3 | 4

export interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
  public_repos: number
  followers: number
  following: number
  created_at: string
  bio: string | null
  html_url: string
  company: string | null
  location: string | null
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  description: string | null
  stargazers_count: number
  forks_count: number
  language: string | null
  updated_at: string
  pushed_at: string
  html_url: string
  fork: boolean
  size: number
  topics: string[]
  open_issues_count: number
}

export interface GitHubEvent {
  id: string
  type: string
  repo: { name: string }
  payload: {
    commits?: Array<{ sha: string; message: string }>
    ref?: string
  }
  created_at: string
}

export interface CommitData {
  sha: string
  message: string
  date: string
  repoName: string
  repoUrl: string
}

export interface LanguageData {
  name: string
  bytes: number
  percentage: number
  color: string
  repos: GitHubRepo[]
  lastPushed: string
  daysSinceActivity: number
}

export interface UniverseScore {
  score: number
  lightYears: number
  distanceLabel: string
  tier: string
}

export interface PullRequest {
  id: number
  number: number
  title: string
  html_url: string
  created_at: string
  user: { login: string } | null
  draft: boolean
}

export interface UniverseData {
  username: string
  user: GitHubUser
  repos: GitHubRepo[]
  languages: LanguageData[]
  recentCommits: CommitData[]
  totalStars: number
  totalForks: number
  universeScore: number
  lightYears: number
  distanceLabel: string
  dominantLanguage: string | null
  accountAgeYears: number
  repoLanguages:      Record<string, Record<string, number>>
  // 12-month commit buckets per top-5 repo  [month0..month11, oldest→newest]
  commitActivity:     Record<string, number[]>
  // open PRs per top-5 repo
  openPRs:            Record<string, PullRequest[]>
}

export interface StoredUniverse {
  id: string
  username: string
  universe_score: number
  total_stars: number
  total_repos: number
  language_count: number
  account_age_years: number
  position_x: number
  position_y: number
  position_z: number
  created_at: string
  updated_at: string
}

export interface LeaderboardEntry {
  rank: number
  username: string
  universe_score: number
  total_stars: number
  total_repos: number
  language_count: number
}

export interface MoonProps {
  repo: GitHubRepo
  orbitRadius: number
  orbitSpeed: number
  size: number
  offset: number
  color: string
}
