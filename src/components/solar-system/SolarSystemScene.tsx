'use client'

import { useRef, useState, Suspense, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, AdaptiveDpr, Line } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { CentralStar } from './CentralStar'
import { Planet } from './Planet'
import { RepoPlanet } from './RepoPlanet'
import { TierBeltMesh, BeltHoverLabel, BeltRepoPanel } from './TierBelt'
import { AsteroidBelt, BeltStats } from './AsteroidBelt'
import { ShootingStars } from './ShootingStars'
import type { CommitTooltipState } from './ShootingStars'
import { Nebula, resolveNebulaType } from './Nebula'
import { EmptyUniverse } from './EmptyUniverse'
import type { UniverseData, LanguageData, GitHubRepo, ViewMode, ActionRun } from '@/types'
import { useUniverseStore } from '@/store'
import { getLanguageColor } from '@/lib/language-colors'
import { calcRepoHealth } from '@/lib/repo-health'

// ── Tier orbit constants ──────────────────────────────────────────────────────
const T1_BASE = 15,  T1_STEP = 7.0
const T2_BASE = 55,  T2_STEP = 5.0
const T3_BASE = 110, T3_STEP = 4.0
const T4_INNER = 160, T4_OUTER = 185
const GY_BASE  = 220, GY_STEP  = 6.0   // graveyard — beyond the belt

// ── Background ────────────────────────────────────────────────────────────────
function BackgroundStars({ perfLevel }: { perfLevel: 'low' | 'high' }) {
  return (
    <Stars 
      radius={perfLevel === 'low' ? 120 : 180} 
      depth={perfLevel === 'low' ? 40 : 80} 
      count={perfLevel === 'low' ? 2000 : 8000} 
      factor={perfLevel === 'low' ? 3 : 5} 
      saturation={perfLevel === 'low' ? 0.05 : 0.4} 
      fade 
      speed={perfLevel === 'low' ? 0.2 : 0.8} 
    />
  )
}

// ── Nebula badge labels ───────────────────────────────────────────────────────
const NEBULA_LABELS: Record<string, { label: string; color: string }> = {
  emission:     { label: '🌟 Emission Nebula',    color: '#00ccff' },
  dark:         { label: '🌑 Dark Nebula',         color: '#334455' },
  reflection:   { label: '🌈 Reflection Nebula',   color: '#bf00ff' },
  planetary:    { label: '🪐 Planetary Nebula',    color: '#ff00e5' },
  protostellar: { label: '🌀 Protostellar Cloud',  color: '#00ffcc' },
  supernova:    { label: '💥 Supernova Remnant',   color: '#ff4400' },
  standard:     { label: '✨ Nebula',              color: '#00e5ff' },
}

// ── Fun facts ─────────────────────────────────────────────────────────────────
const LANG_FACTS: Record<string, string> = {
  JavaScript: 'Created in 10 days by Brendan Eich in 1995. Originally called Mocha.',
  TypeScript: 'Developed by Anders Hejlsberg at Microsoft. Released in 2012.',
  Python:     'Named after Monty Python, not the snake.',
  Rust:       'Named after a fungus. Mozilla started funding it in 2009.',
  Go:         'Designed at Google in 2007. Gopher mascot by Renée French.',
  Java:       'Originally called Oak. Now runs on ~3 billion devices.',
  'C++':      '"C with Classes" was its first name.',
  Ruby:       'Designed for developer happiness by Yukihiro Matsumoto.',
  Swift:      'Apple replaced Objective-C with Swift in 2014.',
  Kotlin:     'Named after Kotlin Island near St. Petersburg.',
  Lua:        'Lua means "moon" in Portuguese.',
  HTML:       'Tim Berners-Lee invented HTML in 1991 with only 18 tags.',
}
const getFact = (lang: string) => LANG_FACTS[lang] ?? `${lang} powers projects worldwide.`

function fmtDays(dateStr: string) {
  const d = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (d < 1)   return 'Today'
  if (d < 7)   return `${d}d ago`
  if (d < 30)  return `${Math.floor(d / 7)}w ago`
  if (d < 365) return `${Math.floor(d / 30)}mo ago`
  return `${Math.floor(d / 365)}yr ago`
}

function ConstellationLines({ 
  tier1, 
  starSize = 1 
}: { 
  tier1: GitHubRepo[]; 
  starSize?: number 
}) {
  return (
    <group>
      {tier1.map((repo, i) => {
        const radius = T1_BASE + i * T1_STEP
        const angle = (i / tier1.length) * Math.PI * 2
        const x = Math.cos(angle) * radius
        const z = Math.sin(angle) * radius
        const color = getLanguageColor(repo.language || '')
        
        return (
          <Line
            key={repo.id}
            points={[[0, 0, 0], [x, 0, z]]}
            color={color}
            lineWidth={0.5}
            transparent
            opacity={0.12}
          />
        )
      })}
    </group>
  )
}

// ── Language side panel ───────────────────────────────────────────────────────
function LangPanel({ lang, pinned, onClose }: {
  lang: LanguageData; pinned: boolean; onClose: () => void
}) {
  return (
    <motion.div
      key={lang.name}
      className="absolute top-1/2 right-4 -translate-y-1/2 hud-panel rounded overflow-hidden w-72"
      style={{ zIndex: 20 }}
      initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2 }}
    >
      <div className="h-0.5 w-full" style={{ background: lang.color, boxShadow: `0 0 8px ${lang.color}` }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-mono text-xs text-gray-600 tracking-widest">PLANET</p>
            <p className="font-orbitron font-bold text-lg leading-tight" style={{ color: lang.color }}>{lang.name}</p>
          </div>
          {pinned && <button onClick={onClose} className="text-gray-700 hover:text-white font-mono text-xs">✕</button>}
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs mb-3">
          <span className="text-gray-600">Coverage</span>
          <span style={{ color: lang.color }}>{lang.percentage.toFixed(1)}%</span>
          <span className="text-gray-600">Repos</span>
          <span className="text-white">{lang.repos.length}</span>
          <span className="text-gray-600">Last active</span>
          <span className="text-white">{fmtDays(lang.lastPushed)}</span>
          <span className="text-gray-600">Top stars</span>
          <span className="text-yellow-400">★ {lang.repos[0]?.stargazers_count.toLocaleString() ?? '0'}</span>
        </div>
        <div className="px-2 py-2 rounded mb-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <p className="font-mono text-xs text-gray-600 mb-0.5 tracking-widest">FUN FACT</p>
          <p className="font-mono text-xs text-gray-400 leading-relaxed">{getFact(lang.name)}</p>
        </div>
        <div className="space-y-1">
          {lang.repos.slice(0, 4).map(r => (
            <a key={r.id} href={r.html_url} target="_blank" rel="noopener noreferrer"
              className="flex justify-between items-center px-2 py-1 rounded hover:bg-white/5 transition-colors"
            >
              <span className="font-mono text-xs truncate max-w-40" style={{ color: lang.color + 'cc' }}>{r.name}</span>
              <span className="font-mono text-xs text-yellow-500 flex-shrink-0">★ {r.stargazers_count}</span>
            </a>
          ))}
        </div>
        {!pinned && <p className="font-mono text-xs text-gray-800 mt-2 text-center">click to pin</p>}
      </div>
    </motion.div>
  )
}

// ── Commit velocity ring — 12 monthly segments ───────────────────────────────
function VelocityRing({
  commits,
  color,
}: {
  commits: { date: string }[]
  color: string
}) {
  // Bucket commits into last 12 months
  const now = Date.now()
  const buckets = Array(12).fill(0)
  commits.forEach((c) => {
    const monthsAgo = Math.floor(
      (now - new Date(c.date).getTime()) / (1000 * 60 * 60 * 24 * 30.5)
    )
    if (monthsAgo >= 0 && monthsAgo < 12) {
      buckets[11 - monthsAgo]++
    }
  })
  const max = Math.max(...buckets, 1)

  const cx = 40
  const cy = 40
  const r = 28
  const segCount = 12
  const gap = 0.08  // radians gap between segments

  const segments = Array.from({ length: segCount }, (_, i) => {
    const startAngle = (i / segCount) * Math.PI * 2 - Math.PI / 2
    const endAngle   = ((i + 1) / segCount) * Math.PI * 2 - Math.PI / 2
    const fill       = buckets[i] / max

    const r1 = 14
    const r2 = r1 + 10 + fill * 14

    const cos1s = Math.cos(startAngle + gap)
    const sin1s = Math.sin(startAngle + gap)
    const cos1e = Math.cos(endAngle - gap)
    const sin1e = Math.sin(endAngle - gap)

    const x1 = cx + cos1s * r1
    const y1 = cy + sin1s * r1
    const x2 = cx + cos1s * r2
    const y2 = cy + sin1s * r2
    const x3 = cx + cos1e * r2
    const y3 = cy + sin1e * r2
    const x4 = cx + cos1e * r1
    const y4 = cy + sin1e * r1

    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

    const d = [
      `M ${x1} ${y1}`,
      `L ${x2} ${y2}`,
      `A ${r2} ${r2} 0 ${largeArc} 1 ${x3} ${y3}`,
      `L ${x4} ${y4}`,
      `A ${r1} ${r1} 0 ${largeArc} 0 ${x1} ${y1}`,
      'Z',
    ].join(' ')

    return { d, fill, active: buckets[i] > 0 }
  })

  const totalCommits = buckets.reduce((s, v) => s + v, 0)

  return (
    <div className="flex flex-col items-center">
      <svg width={80} height={80} viewBox="0 0 80 80">
        {/* Base ring */}
        <circle cx={cx} cy={cy} r={20} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={10} />
        {segments.map((seg, i) => (
          <path
            key={i}
            d={seg.d}
            fill={seg.active ? color : 'rgba(255,255,255,0.05)'}
            opacity={seg.active ? 0.3 + seg.fill * 0.7 : 1}
          />
        ))}
        {/* Center label */}
        <text x={cx} y={cy - 3} textAnchor="middle" fontSize={9}
          fontFamily="JetBrains Mono, monospace" fill={color} fontWeight="bold">
          {totalCommits}
        </text>
        <text x={cx} y={cy + 7} textAnchor="middle" fontSize={6}
          fontFamily="JetBrains Mono, monospace" fill="rgba(255,255,255,0.3)">
          commits
        </text>
      </svg>
      <span className="font-mono text-xs text-gray-700 -mt-1">last 12mo</span>
    </div>
  )
}

// ── Repo detail panel ─────────────────────────────────────────────────────────
function RepoDetailPanel({ repo, onClose, repoLanguages, recentCommits, actionRuns, tierNumber, rank, totalRepos }: {
  repo: GitHubRepo
  onClose: () => void
  repoLanguages?: Record<string, number>
  recentCommits: { sha: string; message: string; date: string; repoName: string; repoUrl: string }[]
  actionRuns?: ActionRun[]
  tierNumber: 1 | 2 | 3 | 4
  rank: number
  totalRepos: number
}) {
  const color  = getLanguageColor(repo.language ?? '')
  const total  = repoLanguages ? Object.values(repoLanguages).reduce((s, v) => s + v, 0) : 0
  const health = calcRepoHealth(repo)

  // Filter commits that belong to this repo
  const repoCommits = recentCommits.filter(c => c.repoName === repo.name)

  // CI/CD Metrics
  const ciStats = useMemo(() => {
    if (!actionRuns || actionRuns.length === 0) return null
    const concluded = actionRuns.filter(r => r.status === 'completed')
    const passCount = concluded.filter(r => r.conclusion === 'success').length
    const failCount = concluded.filter(r => r.conclusion === 'failure').length
    const total = actionRuns.length
    const rate = concluded.length > 0 ? (passCount / concluded.length) * 100 : 0
    
    // Streak
    let streak = 0
    for (const run of actionRuns) {
      if (run.status !== 'completed') continue
      if (run.conclusion === 'success') streak++
      else break
    }

    return { total, passCount, failCount, rate, latest: actionRuns[0], streak }
  }, [actionRuns])

  return (
    <motion.div
      key={repo.id}
      className="fixed inset-x-0 bottom-0 md:inset-y-0 md:right-0 md:left-auto md:w-96 z-[120] bg-black/60 md:bg-black/60 backdrop-blur-[40px] border-t md:border-t-0 md:border-l border-white/10 flex flex-col shadow-[0_-20px_80px_rgba(0,0,0,0.8)] md:shadow-[-20px_0_80px_rgba(0,0,0,0.6)] rounded-t-[2.5rem] md:rounded-l-3xl md:rounded-tr-none overflow-hidden max-h-[90vh] md:max-h-none"
      initial={{ y: "100%", x: 0 }}
      animate={{ y: 0, x: 0 }}
      exit={{ y: "100%", x: 0 }}
      transition={{ duration: 0.6, type: "spring", damping: 30, stiffness: 100 }}
    >
      {/* Mobile Handle area */}
      <div className="md:hidden w-full flex flex-col items-center pt-3 pb-2 cursor-pointer" onClick={onClose}>
        <div className="w-12 h-1 bg-white/20 rounded-full mb-2" />
        <span className="font-mono text-[8px] text-gray-600 tracking-[0.3em] uppercase">Close Station Record</span>
      </div>
      {/* Color accent bar */}
      <div className="h-1 w-full flex-shrink-0"
        style={{ background: `linear-gradient(90deg, ${color}, transparent)`, boxShadow: `0 0 12px ${color}66` }} />

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6 space-y-6 custom-scrollbar">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="min-w-0 mr-4">
            <p className="font-mono text-[10px] text-gray-600 tracking-[0.3em] mb-1">STATION RECORD</p>
            <h2 className="font-orbitron font-bold text-xl leading-tight text-white tracking-wide">
              {repo.name}
            </h2>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
              <span className="font-mono text-xs" style={{ color: color }}>{repo.language || 'Plain Text'}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-white font-mono text-lg transition-colors p-2"
          >
            ✕
          </button>
        </div>

        {/* Description */}
        {repo.description && (
          <p className="font-mono text-xs text-gray-400 leading-relaxed border-l-2 pl-4 py-1"
            style={{ borderColor: `${color}44` }}>
            {repo.description}
          </p>
        )}

        {/* Health score card */}
        <div className="rounded-xl p-4 space-y-3 bg-black/40 border border-white/5 shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] text-gray-500 tracking-widest uppercase opacity-70">Sustainability</span>
            <div className="flex items-center gap-2">
              <span className="font-orbitron font-bold text-lg" style={{ color: health.color }}>
                {health.score}
              </span>
              <span className="font-mono text-[10px] text-gray-700">/ 100</span>
            </div>
          </div>

          <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ background: health.color, boxShadow: `0 0 12px ${health.color}66` }}
              initial={{ width: 0 }}
              animate={{ width: `${health.score}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest" style={{ color: health.color }}>
              {health.label}
            </span>
            <span className="font-mono text-[9px] text-gray-600 ml-auto">
              Level {Math.ceil(health.score / 20)} Node
            </span>
          </div>
        </div>

        {/* Optimization Log — New Task List */}
        {health.breakdown.some(c => !c.earned) && (
          <div className="space-y-3">
            <p className="font-mono text-[10px] text-gray-600 tracking-widest uppercase mb-1">Optimization Log</p>
            <div className="bg-black/30 border border-white/5 rounded-lg p-4 space-y-2">
              {health.breakdown
                .filter(c => !c.earned)
                .map((task, i) => (
                  <div key={i} className="flex items-start gap-3 group">
                    <div className="mt-1 w-3 h-3 rounded flex-shrink-0 border border-white/20 group-hover:border-white/40 transition-colors flex items-center justify-center">
                    </div>
                    <span className="font-mono text-[10px] text-gray-400 group-hover:text-white transition-colors leading-tight">
                      {task.label.includes('description') ? 'Add repository description' :
                       task.label.includes('30 days') ? 'Perform fresh data sync (Push 30d)' :
                       task.label.includes('90 days') ? 'Perform fresh data sync (Push 90d)' :
                       task.label.includes('stars') ? 'Expand system influence (Gain Stars)' :
                       task.label}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* CI/CD Section */}
        <div className="space-y-3">
          <p className="font-mono text-[10px] text-gray-600 tracking-widest uppercase mb-1">CI/CD Pipeline</p>
          <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-5 shadow-2xl relative overflow-hidden group">
            {ciStats ? (
              <>
                {/* Background accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[40px] rounded-full -mr-16 -mt-16 pointer-events-none" />
                
                <div className="flex items-start justify-between relative">
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-gray-500 tracking-wider">Pass Rate</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-orbitron font-bold text-emerald-400">{ciStats.rate.toFixed(0)}%</span>
                      <span className="text-[10px] font-mono text-gray-600 uppercase">Stability</span>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-mono text-gray-500 tracking-wider">Streak</p>
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-xl font-orbitron font-bold text-yellow-400">⚡{ciStats.streak}</span>
                      <span className="text-[10px] font-mono text-gray-600 uppercase">Builds</span>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-2 relative">
                  <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden border border-white/5">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400"
                      style={{ boxShadow: '0 0 10px rgba(52, 211, 153, 0.4)' }}
                      initial={{ width: 0 }}
                      animate={{ width: `${ciStats.rate}%` }}
                      transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                  </div>
                  <div className="flex justify-between font-mono text-[9px] text-gray-600">
                    <span>{ciStats.passCount} PASSES</span>
                    <span>{ciStats.total} TOTAL RUNS</span>
                  </div>
                </div>

                {/* Latest run */}
                <div className="pt-2 border-t border-white/5 space-y-2">
                  <p className="text-[9px] font-mono text-gray-600 tracking-wider uppercase">Latest System Event</p>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                        ciStats.latest.status === 'in_progress' ? 'bg-yellow-400 animate-bounce' :
                        ciStats.latest.conclusion === 'success' ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'
                      }`} />
                      <span className="text-[10px] font-mono text-white/80 truncate">{ciStats.latest.name}</span>
                    </div>
                    <span className={`text-[9px] font-mono uppercase font-bold ${
                      ciStats.latest.status === 'in_progress' ? 'text-yellow-400' :
                      ciStats.latest.conclusion === 'success' ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {ciStats.latest.status === 'in_progress' ? 'Running' : ciStats.latest.conclusion}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-4 text-center space-y-2">
                <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-2 opacity-50">
                  <span className="text-gray-500 text-xs text-center">∅</span>
                </div>
                <p className="font-orbitron text-[10px] text-gray-500 tracking-[0.2em] uppercase">No CI/CD configured</p>
                <p className="font-mono text-[9px] text-gray-700">No recent GitHub Actions data detected.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Redistribution Logic ── */}
        {(() => {
          const TIER_META: Record<number, { label: string; color: string; bg: string; border: string }> = {
            1: { label: 'FEATURED',    color: '#ffd700', bg: 'rgba(255,215,0,0.08)',  border: 'rgba(255,215,0,0.25)' },
            2: { label: 'STANDARD',    color: '#00e5ff', bg: 'rgba(0,229,255,0.08)',  border: 'rgba(0,229,255,0.25)' },
            3: { label: 'SMALL WORLD', color: '#ff8844', bg: 'rgba(255,136,68,0.08)', border: 'rgba(255,136,68,0.25)' },
            4: { label: 'ASTEROID',    color: '#556677', bg: 'rgba(85,102,119,0.08)', border: 'rgba(85,102,119,0.25)' },
          }
          const isHealthy = health.score >= 40
          const FEATURES = [
            { name: 'Atmosphere Glow',     tiers: [1],       howTo: 'Be in the top 5 repos by stars to get a glowing atmosphere effect around your planet.', active: true },
            { name: 'PR Moons',            tiers: [1],       howTo: 'Top 5 repos show open Pull Requests as orbiting moons around the planet.', active: true },
            { name: 'Constellation Lines', tiers: [1],       howTo: 'Tier 1 planets are connected by constellation lines, forming a visual star map.', active: true },
            { name: 'Velocity Ring',       tiers: [1, 2],    howTo: 'Top 15 repos display a commit velocity ring showing recent activity pulses.', active: true },
            { name: 'Health Badge',        tiers: [1, 2, 3], howTo: isHealthy
                ? 'Your repo health score is above 40 — the badge is active and green.'
                : 'Health score is below 40 (struggling). Add a description, push code recently, and gain stars to restore it.',
              active: isHealthy },
            { name: 'Planet Body',         tiers: [1, 2, 3], howTo: 'Top 30 repos are rendered as full planet bodies. Below that, repos become belt particles.', active: true },
            { name: 'Belt Particle',       tiers: [4],       howTo: 'Repos ranked 30+ are shown as tiny particles in the asteroid belt.', active: true },
          ]
          const UPGRADES: Record<number, string> = {
            2: `Reach top 5 by stars to become Featured. You're ranked #${rank} — need ${Math.max(rank - 5, 0)} more spots.`,
            3: `Reach top 15 by stars to reach Standard. You're ranked #${rank} — need ${Math.max(rank - 15, 0)} more spots.`,
            4: `Reach top 30 by stars to reach Small World. You're ranked #${rank} — need ${Math.max(rank - 30, 0)} more spots.`,
          }
          const meta = TIER_META[tierNumber]
          const pct = totalRepos > 1 ? ((totalRepos - rank) / (totalRepos - 1)) * 100 : 100

          return (
            <div className="rounded-xl p-4 space-y-4 border shadow-2xl" style={{ background: meta.bg, borderColor: meta.border }}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-gray-500 tracking-widest uppercase">Redistribution</span>
                <span className="font-mono text-[10px] px-2.5 py-0.5 rounded-full font-bold tracking-widest"
                  style={{ color: meta.color, background: `${meta.color}18`, border: `1px solid ${meta.color}40` }}>
                  TIER {tierNumber} · {meta.label}
                </span>
              </div>

              {/* Rank */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="font-orbitron text-sm font-bold" style={{ color: meta.color }}>
                    Ranked #{rank}
                  </span>
                  <span className="font-mono text-[10px] text-gray-500">of {totalRepos} repos</span>
                </div>
                <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${meta.color}, ${meta.color}88)`, boxShadow: `0 0 10px ${meta.color}44` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                  />
                </div>
                <p className="font-mono text-[9px] text-gray-600">
                  Sorted by ★ stargazers — {repo.stargazers_count.toLocaleString()} stars
                </p>
              </div>

              {/* Features unlocked by tier */}
              <div className="space-y-3">
                <p className="font-mono text-[9px] text-gray-500 tracking-widest uppercase">Visual Features</p>
                <div className="space-y-1.5">
                  {FEATURES.map((f) => {
                    const tierMatch = f.tiers.includes(tierNumber)
                    const unlocked = tierMatch && f.active
                    const failed = tierMatch && !f.active  // tier matches but health failed
                    return (
                      <div key={f.name} className={`rounded-lg p-2.5 transition-colors ${
                        unlocked ? 'bg-white/[0.03]' : failed ? 'bg-red-500/[0.04]' : 'bg-transparent'
                      }`}>
                        <div className={`flex items-center gap-2 text-[10px] font-mono ${
                          unlocked ? 'text-white/80' : failed ? 'text-red-400/70' : 'text-gray-700'
                        }`}>
                          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[8px] flex-shrink-0 ${
                            unlocked
                              ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                              : failed
                                ? 'bg-red-500/20 border border-red-500/40 text-red-400'
                                : 'border border-white/10'
                          }`}>
                            {unlocked ? '✓' : failed ? '✕' : ''}
                          </span>
                          <span className={!tierMatch && !failed ? 'line-through' : ''}>{f.name}</span>
                          {failed && <span className="text-[8px] text-red-400/50 ml-auto">NEEDS FIX</span>}
                        </div>
                        <p className={`font-mono text-[8px] leading-relaxed mt-1 ml-[22px] ${
                          unlocked ? 'text-gray-500' : failed ? 'text-red-400/40' : 'text-gray-700/50'
                        }`}>
                          {f.howTo}
                        </p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Upgrade hint */}
              {tierNumber > 1 && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-black/30 border border-white/5">
                  <span className="text-[10px] mt-0.5">💡</span>
                  <p className="font-mono text-[9px] text-gray-400 leading-relaxed">
                    {UPGRADES[tierNumber]}
                  </p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Growth</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-orbitron text-yellow-400">★ {repo.stargazers_count.toLocaleString()}</span>
              <span className="text-[10px] font-mono text-gray-700">stars</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Forks</p>
            <div className="flex items-center gap-2">
              <span className="text-sm font-orbitron text-blue-400">⑂ {repo.forks_count.toLocaleString()}</span>
              <span className="text-[10px] font-mono text-gray-700">nodes</span>
            </div>
          </div>
        </div>

        {/* Velocity Ring Section */}
        <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
          <div className="space-y-1">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">Pulse</p>
            <p className="text-xs font-mono text-white opacity-80">{repoCommits.length} Recent Syncs</p>
            <p className="text-[9px] font-mono text-gray-700">Frequency: Last {fmtDays(repo.pushed_at)}</p>
          </div>
          <div className="scale-110">
            <VelocityRing commits={repoCommits} color={color} />
          </div>
        </div>

        {/* Language Composition */}
        {repoLanguages && total > 0 && (
          <div className="space-y-3">
            <p className="font-mono text-[10px] text-gray-600 tracking-widest uppercase">Composition</p>
            <div className="space-y-2">
              {Object.entries(repoLanguages)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([lang, bytes]) => {
                  const lColor = getLanguageColor(lang)
                  return (
                    <div key={lang} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-gray-400">{lang}</span>
                        <span style={{ color: lColor }}>{(bytes / total * 100).toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-black/40 h-1 rounded-full overflow-hidden">
                        <div className="h-full" style={{ width: `${(bytes / total * 100)}%`, background: lColor }} />
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

      </div>

      {/* Footer Actions */}
      <div className="flex-shrink-0 p-6 bg-black/40 border-t border-white/5 flex gap-3">
        <a
          href={repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 font-mono text-[10px] py-3 rounded-lg transition-all tracking-widest hover:scale-[1.02] active:scale-[0.98]"
          style={{ color, border: `1px solid ${color}44`, background: `${color}15` }}
        >
          CONNECT TO CORE ↗
        </a>
      </div>
    </motion.div>
  )
}

// ── Main Scene ────────────────────────────────────────────────────────────────
interface SolarSystemSceneProps {
  data: UniverseData
}

export function SolarSystemScene({ data }: SolarSystemSceneProps) {
  const { selectedPlanetIndex, setSelectedPlanetIndex, viewMode, setViewMode } = useUniverseStore()
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageData | null>(null)
  const [hoveredLanguage, setHoveredLanguage]   = useState<LanguageData | null>(null)
  const [selectedRepo, setSelectedRepo]         = useState<GitHubRepo | null>(null)
  const [commitTooltip, setCommitTooltip]       = useState<CommitTooltipState | null>(null)
  const [beltPanelOpen, setBeltPanelOpen]       = useState(false)
  const [beltHoverPos, setBeltHoverPos]         = useState<{ x: number; y: number } | null>(null)
  const [perfLevel, setPerfLevel] = useState<'low' | 'high'>('high')

  useEffect(() => {
    const isLowPower = (typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 8) <= 4) || 
                       (typeof window !== 'undefined' && window.innerWidth < 768)
    if (isLowPower) setPerfLevel('low')
  }, [])

  // ── Computed nebula state ──────────────────────────────────────────────────
  const ownRepos    = useMemo(() => data.repos.filter(r => !r.fork), [data.repos])
  const isEmpty     = ownRepos.length < 5
  const primaryColor = data.languages[0]?.color ?? '#00e5ff'
  const extraColors  = data.languages.slice(1, 5).map(l => l.color)

  const monthsInactive = useMemo(() => {
    const lastPush = data.repos[0]?.pushed_at ?? data.user.created_at
    return Math.floor((Date.now() - new Date(lastPush).getTime()) / (1000 * 60 * 60 * 24 * 30))
  }, [data.repos, data.user.created_at])

  const nebulaType = useMemo(() => resolveNebulaType({
    totalStars:      data.totalStars,
    monthsInactive,
    languageCount:   data.languages.length,
    totalRepos:      data.repos.length,
    accountAgeYears: data.accountAgeYears,
    isHighStreak:    false,
  }), [data, monthsInactive])

  const nebulaSpread  = Math.max(25, Math.min(80, data.accountAgeYears * 12 + 20))
  const nebulaDensity = Math.min(1, data.recentCommits.length / 15)
  const nebulaBadge   = NEBULA_LABELS[nebulaType] ?? NEBULA_LABELS.standard

  // ── Mode persistence ───────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const saved = localStorage.getItem('su-viewmode') as 'repos' | 'langs' | null
      if (saved === 'repos' || saved === 'langs') setViewMode(saved)
    } catch {}
  }, [setViewMode])

  const handleSetMode = useCallback((mode: ViewMode) => {
    setViewMode(mode)
    setSelectedLanguage(null)
    setSelectedPlanetIndex(null)
    setSelectedRepo(null)
    try { localStorage.setItem('su-viewmode', mode) } catch {}
  }, [setViewMode, setSelectedPlanetIndex])

  // ── Tier computation ───────────────────────────────────────────────────────
  const TWO_YEARS_MS = 2 * 365.25 * 24 * 60 * 60 * 1000

  const { tier1, tier2, tier3, tier4, graveyard } = useMemo(() => {
    const now   = Date.now()
    const dead  = ownRepos.filter(r => now - new Date(r.pushed_at).getTime() > TWO_YEARS_MS)
    const alive = ownRepos.filter(r => now - new Date(r.pushed_at).getTime() <= TWO_YEARS_MS)
    const sorted = [...alive].sort((a, b) => b.stargazers_count - a.stargazers_count)
    return {
      tier1:     sorted.slice(0, 5),
      tier2:     sorted.slice(5, 15),
      tier3:     sorted.slice(15, 30),
      tier4:     sorted.slice(30),
      graveyard: dead,
    }
  }, [ownRepos, TWO_YEARS_MS])

  const MIN_ORBIT     = 8, ORBIT_STEP = 4.5
  const asteroidInner = MIN_ORBIT + data.languages.length * ORBIT_STEP + 2
  const asteroidOuter = asteroidInner + 7
  const caOffset      = useMemo(() => new THREE.Vector2(0.0005, 0.0005), [])
  const panelLang     = selectedLanguage ?? hoveredLanguage
  const panelPinned   = selectedLanguage !== null

  return (
    <div className="w-full h-full relative bg-[#020205]">
      {/* Technical Grid Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]" 
           style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      {/* Redundant toggle removed — Now handled by HUD.tsx */}

      {/* Nebula type badge — Relocated to avoid footer overlap */}
      <motion.div
        className="absolute top-24 left-1/2 -translate-x-1/2 md:top-auto md:bottom-28 md:left-8 md:translate-x-0 z-10 flex items-center gap-2 pointer-events-none"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
      >
        <div className="w-1.5 h-1.5 rounded-full"
          style={{ background: nebulaBadge.color, boxShadow: `0 0 8px ${nebulaBadge.color}` }} />
        <span className="font-mono text-[10px] tracking-[0.3em] uppercase"
          style={{ color: nebulaBadge.color + 'aa' }}>
          {nebulaBadge.label}
        </span>
      </motion.div>

      {/* Empty universe message */}
      {isEmpty && (
        <motion.div
          className="absolute bottom-28 left-1/2 -translate-x-1/2 text-center pointer-events-none z-10"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}
        >
          <p className="font-mono text-xs text-space-cyan/30 tracking-widest">
            A young universe — still forming
          </p>
          <p className="font-mono text-xs text-space-cyan/15 tracking-wider mt-0.5">
            The greatest stars take time.
          </p>
        </motion.div>
      )}

      <Canvas
        camera={{ position: [0, 40, 140], fov: 45, near: 0.1, far: 2000 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 1.5]}
      >
        <color attach="background" args={['#020205']} />
        <AdaptiveDpr pixelated />
        <ambientLight intensity={isEmpty ? 0.12 : 0.05} />

        <Suspense fallback={null}>
          {/* Pure minimal background stars */}
          <BackgroundStars perfLevel={perfLevel} />
          
          {/* Subtle accent light for the 'system' center */}
          <pointLight position={[0, 0, 0]} intensity={1.5} color={primaryColor} distance={150} decay={2} />

          {/* Ghost planets for < 5 repos */}
          {isEmpty && (
            <EmptyUniverse repoCount={ownRepos.length} />
          )}

          <CentralStar
            score={data.universeScore}
            totalRepos={data.repos.length}
            totalStars={data.totalStars}
            onClick={() => {
              setSelectedLanguage(null)
              setSelectedPlanetIndex(null)
              setSelectedRepo(null)
            }}
          />

          {/* REPOS MODE — full system */}
          {viewMode === 'repos' && !isEmpty && (
            <>
              {tier1.map((repo, i) => (
                <RepoPlanet
                  key={repo.id} repo={repo} tier={1}
                  orbitRadius={T1_BASE + i * T1_STEP}
                  offset={(i / tier1.length) * Math.PI * 2}
                  index={i}
                  repoLanguages={data.repoLanguages?.[repo.name]}
                  commitMonths={data.commitActivity?.[repo.name]}
                  openPRs={data.openPRs?.[repo.name]}
                  actionRuns={data.repoActions?.[repo.name]}
                  onSelect={setSelectedRepo}
                  isSelected={selectedRepo?.id === repo.id}
                />
              ))}
              
              {viewMode === 'repos' && <ConstellationLines tier1={tier1} />}
              
              {tier2.map((repo, i) => (
                <RepoPlanet
                  key={repo.id} repo={repo} tier={2}
                  orbitRadius={T2_BASE + i * T2_STEP}
                  offset={(i / tier2.length) * Math.PI * 2 + 0.5}
                  index={i}
                  actionRuns={data.repoActions?.[repo.name]}
                  onSelect={setSelectedRepo}
                  isSelected={selectedRepo?.id === repo.id}
                />
              ))}
              {tier3.map((repo, i) => (
                <RepoPlanet
                  key={repo.id} repo={repo} tier={3}
                  orbitRadius={T3_BASE + i * T3_STEP}
                  offset={(i / tier3.length) * Math.PI * 2 + 1.0}
                  index={i}
                  actionRuns={data.repoActions?.[repo.name]}
                  onSelect={setSelectedRepo}
                  isSelected={selectedRepo?.id === repo.id}
                />
              ))}
              {tier4.length > 0 && (
                <TierBeltMesh
                  innerRadius={T4_INNER} outerRadius={T4_OUTER}
                  repoCount={tier4.length}
                  onHover={(h, x, y) => setBeltHoverPos(h && x !== undefined && y !== undefined ? { x, y } : null)}
                  onClick={() => { setBeltPanelOpen(true); setBeltHoverPos(null) }}
                />
              )}

              {/* Dead repos — drifting in the graveyard zone beyond the belt */}
              {graveyard.map((repo, i) => (
                <RepoPlanet
                  key={repo.id} repo={repo} tier={3}
                  orbitRadius={GY_BASE + i * GY_STEP}
                  offset={(i / Math.max(graveyard.length, 1)) * Math.PI * 2 + 2.2}
                  index={i}
                  isGraveyard
                  onSelect={setSelectedRepo}
                  isSelected={selectedRepo?.id === repo.id}
                />
              ))}
            </>
          )}

          {/* REPOS MODE — empty universe: show the few repos that exist */}
          {viewMode === 'repos' && isEmpty && tier1.map((repo, i) => (
            <RepoPlanet
              key={repo.id} repo={repo} tier={1}
              orbitRadius={T1_BASE + i * T1_STEP}
              offset={(i / Math.max(tier1.length, 1)) * Math.PI * 2}
              index={i}
              repoLanguages={data.repoLanguages?.[repo.name]}
              commitMonths={data.commitActivity?.[repo.name]}
              openPRs={data.openPRs?.[repo.name]}
              actionRuns={data.repoActions?.[repo.name]}
              onSelect={setSelectedRepo}
              isSelected={selectedRepo?.id === repo.id}
            />
          ))}

          {/* LANGS MODE */}
          {viewMode === 'langs' && (
            <>
              {data.languages.map((lang, i) => (
                <Planet
                  key={lang.name}
                  language={lang}
                  orbitRadius={MIN_ORBIT + i * ORBIT_STEP}
                  size={Math.max(0.3, Math.min(1.2, 0.3 + (lang.percentage / 100) * 2.8))}
                  offset={(i / data.languages.length) * Math.PI * 2}
                  index={i}
                  onSelect={(l) => {
                    if (!l) { setSelectedLanguage(null); setSelectedPlanetIndex(null) }
                    else    { setSelectedLanguage(l); setSelectedPlanetIndex(i) }
                  }}
                  onHover={(l) => { if (!selectedLanguage) setHoveredLanguage(l) }}
                  isSelected={selectedPlanetIndex === i}
                />
              ))}
              <AsteroidBelt
                repos={data.repos}
                innerRadius={asteroidInner}
                outerRadius={asteroidOuter}
              />
            </>
          )}

          <ShootingStars
            commits={data.recentCommits}
            repos={data.repos.slice(0, 10).map(r => ({ name: r.name, html_url: r.html_url }))}
            onTooltip={setCommitTooltip}
          />

          <EffectComposer>
            <Bloom
              intensity={isEmpty ? 0.8 : 1.4}
              luminanceThreshold={0.3}
              luminanceSmoothing={0.9}
              blendFunction={BlendFunction.SCREEN}
            />
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={caOffset}
              radialModulation={false}
              modulationOffset={0}
            />
          </EffectComposer>
        </Suspense>

        <OrbitControls
          enablePan={false}
          enableZoom
          minDistance={10}
          maxDistance={viewMode === 'repos' ? 280 : 200}
          autoRotate={selectedPlanetIndex === null && !selectedRepo}
          autoRotateSpeed={0.15}
          makeDefault
        />
      </Canvas>

      {/* ── DOM overlays ── */}

      {/* Side panels */}
      <AnimatePresence>
        {viewMode === 'langs' && panelLang && (
          <LangPanel
            lang={panelLang} pinned={panelPinned}
            onClose={() => { setSelectedLanguage(null); setSelectedPlanetIndex(null) }}
          />
        )}
        {viewMode === 'repos' && selectedRepo && (() => {
          // Compute rank + tier for the selected repo
          const TWO_YEARS = 2 * 365.25 * 24 * 60 * 60 * 1000
          const alive = data.repos.filter((r: GitHubRepo) => !r.fork && Date.now() - new Date(r.pushed_at).getTime() <= TWO_YEARS)
          const sorted = [...alive].sort((a: GitHubRepo, b: GitHubRepo) => b.stargazers_count - a.stargazers_count)
          const rank = sorted.findIndex((r: GitHubRepo) => r.id === selectedRepo.id) + 1
          const tierNum: 1 | 2 | 3 | 4 = rank <= 5 ? 1 : rank <= 15 ? 2 : rank <= 30 ? 3 : 4
          return (
            <RepoDetailPanel
              repo={selectedRepo}
              repoLanguages={data.repoLanguages?.[selectedRepo.name]}
              recentCommits={data.recentCommits}
              actionRuns={data.repoActions?.[selectedRepo.name]}
              onClose={() => setSelectedRepo(null)}
              tierNumber={tierNum}
              rank={rank || 1}
              totalRepos={sorted.length}
            />
          )
        })()}
      </AnimatePresence>

      {/* Asteroid belt stats (langs mode) */}
      {viewMode === 'langs' && <BeltStats repos={data.repos} />}

      {/* Tier 4 belt overlays (repos mode) */}
      {viewMode === 'repos' && beltHoverPos && !beltPanelOpen && (
        <BeltHoverLabel count={tier4.length} x={beltHoverPos.x} y={beltHoverPos.y} />
      )}
      <AnimatePresence>
        {viewMode === 'repos' && beltPanelOpen && (
          <BeltRepoPanel repos={tier4} onClose={() => setBeltPanelOpen(false)} />
        )}
      </AnimatePresence>

      {/* Commit tooltip */}
      {commitTooltip && (
        <div style={{
          position: 'fixed',
          left: Math.min(commitTooltip.x + 18, window.innerWidth - 240),
          top: Math.max(commitTooltip.y - 70, 8),
          zIndex: 1000,
          pointerEvents: 'none',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '11px',
          background: 'rgba(0,0,15,0.97)',
          border: '1px solid rgba(255,0,110,0.6)',
          color: '#e0f4ff',
          padding: '10px 14px',
          borderRadius: '4px',
          maxWidth: '230px',
          lineHeight: 1.6,
          boxShadow: '0 0 24px rgba(255,0,110,0.3)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ color: '#ff006e', fontWeight: 'bold', fontSize: 12 }}>
              ⚡ {commitTooltip.commit.repoName}
            </span>
            <span style={{
              fontSize: 8, padding: '1px 5px', borderRadius: 3,
              background: commitTooltip.isReal ? 'rgba(0,229,255,0.15)' : 'rgba(255,255,255,0.07)',
              color: commitTooltip.isReal ? '#00e5ff' : '#555',
              border: `1px solid ${commitTooltip.isReal ? 'rgba(0,229,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
            }}>
              {commitTooltip.isReal ? 'LIVE' : 'GENERIC'}
            </span>
          </div>
          <div style={{ color: '#ccc', fontSize: 10, marginBottom: 6, wordBreak: 'break-word' }}>
            {commitTooltip.commit.message}
          </div>
          <div style={{ color: '#555', fontSize: 9 }}>
            {new Date(commitTooltip.commit.date).toLocaleDateString('en-US', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </div>
          {commitTooltip.commit.repoUrl && (
            <div style={{ color: '#ff006e', fontSize: 9, marginTop: 4, opacity: 0.7 }}>
              click to open repo →
            </div>
          )}
        </div>
      )}
    </div>
  )
}
