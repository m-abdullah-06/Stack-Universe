import type { GitHubRepo } from '@/types'

export type HealthTier = 'thriving' | 'struggling' | 'dormant'

export interface RepoHealth {
  score: number        // 0–100
  tier: HealthTier
  label: string
  color: string
  breakdown: { label: string; points: number; earned: boolean }[]
}

export function calcRepoHealth(repo: GitHubRepo): RepoHealth {
  // 1. Detect project context
  const language = repo.language ?? ''
  const isComplex = ['TypeScript', 'JavaScript', 'Python', 'Rust', 'Go', 'Java', 'C++', 'Swift', 'C#', 'PHP', 'Ruby'].includes(language)
  const isSmall = repo.size < 2000 // Increased to 2MB
  // Only classify as "Software Service" if it has some activity or is complex/large
  const isSoftware = isComplex && !isSmall

  // 2. Metrics
  const commitCount = repo.commit_count_90d ?? 0
  const openIssues = repo.open_issues_count
  const closedIssues = repo.closed_issues_count ?? 0
  const totalIssues = openIssues + closedIssues
  const issueRatio = totalIssues > 0 ? closedIssues / totalIssues : 1.0
  const mergedPRs = repo.merged_pr_count ?? 0

  // 3. Scoring with Adaptive Weights
  let score = 0
  
  // Commits (20 pts for software, 30 pts for lightweight)
  const commitWeight = isSoftware ? 20 : 30
  if (commitCount >= 10) score += commitWeight
  else if (commitCount >= 5) score += commitWeight * 0.8
  else if (commitCount >= 1) score += commitWeight * 0.5
  else if (commitCount === 0) {
    // Check pushed_at as fallback
    const daysSincePush = Math.floor((Date.now() - new Date(repo.pushed_at).getTime()) / 86400000)
    if (daysSincePush < 30) score += commitWeight * 0.5
    else if (daysSincePush < 90) score += commitWeight * 0.3
  }

  // Issues (20 pts) - Shared by all
  // If no issues at all, it's not "unhealthy", just "simple".
  if (totalIssues === 0) score += 20
  else if (issueRatio > 0.5) score += 20
  else if (issueRatio > 0.2) score += 15
  else score += 10

  // PR Merge Activity (20 pts for software, redistributes to README/License if not)
  if (isSoftware) {
    if (mergedPRs >= 1) score += 20
    else score += 10 // Baseline for software even without PRs if other things are good
  }

  // README (15 pts for software, 25 pts for lightweight)
  const readmeWeight = isSoftware ? 15 : 25
  if (repo.has_readme) score += readmeWeight
  else if (repo.description) score += readmeWeight * 0.5 // Partial credit for description

  // License (15 pts for software, 25 pts for lightweight)
  const licenseWeight = isSoftware ? 15 : 25
  if (repo.license || (repo as any).has_license) score += licenseWeight
  else score += 5 // Baseline points for being public

  // CI/CD (10 pts) - Software only
  if (isSoftware) {
    if (repo.has_workflows) score += 10
    else score += 5 // Baseline for software
  }

  score = Math.min(100, score)

  let tier: HealthTier
  let label: string
  let color: string

  if (score >= 70) { // Lowered threshold for Healthy
    tier  = 'thriving'
    label = 'Healthy'
    color = '#00f5d4' 
  } else if (score >= 30) { // Lowered threshold for Struggling
    tier  = 'struggling'
    label = 'Struggling'
    color = '#ff4d4d'
  } else {
    tier  = 'dormant'
    label = 'Dead'
    color = '#4a4e69'
  }

  // Simplified breakdown for the UI (descriptive language)
  const uiBreakdown = [
    { 
      label: score >= 40 || commitCount > 0 ? 'Freshly maintained' : 'Needs recent activity', 
      points: commitCount, 
      earned: score >= 40 || commitCount > 0 
    },
    { 
      label: (totalIssues === 0 || issueRatio > 0.5) ? 'Community healthy' : 'High issue backlog', 
      points: closedIssues, 
      earned: totalIssues === 0 || issueRatio > 0.5 
    },
    { 
      label: repo.has_readme ? 'Well documented' : (repo.description ? 'Has description' : 'Missing README.md'), 
      points: 1, 
      earned: !!repo.has_readme || !!repo.description 
    },
    { 
      label: (repo.license || (repo as any).has_license) ? 'Licensed project' : 'Public domain/Unlicensed', 
      points: 1, 
      earned: !!repo.license || !!(repo as any).has_license 
    },
  ]
  if (isSoftware) {
    uiBreakdown.push({ 
      label: repo.has_workflows ? 'CI/CD running' : 'Automated tests missing', 
      points: 1, 
      earned: !!repo.has_workflows 
    })
    uiBreakdown.push({ 
      label: mergedPRs > 0 ? 'Highly collaborative' : 'Direct commits only', 
      points: mergedPRs, 
      earned: mergedPRs > 0 
    })
  }

  return { score, tier, label, color, breakdown: uiBreakdown }
}
