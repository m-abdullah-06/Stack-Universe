'use client'

import { useRef, useState, Suspense, useMemo, useEffect, useCallback } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, AdaptiveDpr } from '@react-three/drei'
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
import type { UniverseData, LanguageData, GitHubRepo, ViewMode } from '@/types'
import { useUniverseStore } from '@/store'
import { getLanguageColor } from '@/lib/language-colors'

// ── Tier orbit constants ──────────────────────────────────────────────────────
const T1_BASE = 8,  T1_STEP = 3.5
const T2_BASE = 26, T2_STEP = 2.0
const T3_BASE = 48, T3_STEP = 1.4
const T4_INNER = 72, T4_OUTER = 82

// ── Background ────────────────────────────────────────────────────────────────
function BackgroundStars() {
  return <Stars radius={150} depth={60} count={5000} factor={4} saturation={0.1} fade speed={0.3} />
}

// ── Nebula badge labels ───────────────────────────────────────────────────────
const NEBULA_LABELS: Record<string, { label: string; color: string }> = {
  emission:     { label: '🌟 Emission Nebula',    color: '#ff9944' },
  dark:         { label: '🌑 Dark Nebula',         color: '#445566' },
  reflection:   { label: '🌈 Reflection Nebula',   color: '#44aaff' },
  planetary:    { label: '🪐 Planetary Nebula',    color: '#aa44ff' },
  protostellar: { label: '🌀 Protostellar Cloud',  color: '#00e5ff' },
  supernova:    { label: '💥 Supernova Remnant',   color: '#ff4466' },
  standard:     { label: '✨ Nebula',              color: '#334455' },
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

// ── Repo detail panel ─────────────────────────────────────────────────────────
function RepoDetailPanel({ repo, onClose, repoLanguages }: {
  repo: GitHubRepo; onClose: () => void; repoLanguages?: Record<string, number>
}) {
  const color = getLanguageColor(repo.language ?? '')
  const total = repoLanguages ? Object.values(repoLanguages).reduce((s, v) => s + v, 0) : 0

  return (
    <motion.div
      key={repo.id}
      className="absolute top-1/2 right-4 -translate-y-1/2 hud-panel rounded overflow-hidden w-72"
      style={{ zIndex: 20 }}
      initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2 }}
    >
      <div className="h-0.5 w-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 mr-2">
            <p className="font-mono text-xs text-gray-600 tracking-widest">REPO PLANET</p>
            <p className="font-orbitron font-bold text-base leading-tight text-white truncate">{repo.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-700 hover:text-white font-mono text-xs flex-shrink-0">✕</button>
        </div>
        {repo.description && (
          <p className="font-mono text-xs text-gray-500 mb-3 leading-relaxed">{repo.description}</p>
        )}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs mb-3">
          <span className="text-gray-600">Stars</span>
          <span className="text-yellow-400">★ {repo.stargazers_count.toLocaleString()}</span>
          <span className="text-gray-600">Forks</span>
          <span className="text-white">⑂ {repo.forks_count.toLocaleString()}</span>
          <span className="text-gray-600">Last pushed</span>
          <span className="text-white">{fmtDays(repo.pushed_at)}</span>
          <span className="text-gray-600">Open issues</span>
          <span className="text-orange-400">{repo.open_issues_count}</span>
          {repo.language && <>
            <span className="text-gray-600">Primary lang</span>
            <span style={{ color }}>{repo.language}</span>
          </>}
        </div>

        {repoLanguages && total > 0 && (
          <div className="mb-3">
            <p className="font-mono text-xs text-gray-700 tracking-widest mb-1.5">LANGUAGES (moons)</p>
            {Object.entries(repoLanguages)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 5)
              .map(([lang, bytes]) => (
                <div key={lang} className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: getLanguageColor(lang) }} />
                  <div className="flex-1 bg-white/5 rounded-full h-1 overflow-hidden">
                    <div className="h-full rounded-full"
                      style={{ width: `${(bytes / total * 100).toFixed(0)}%`, background: getLanguageColor(lang) }} />
                  </div>
                  <span className="font-mono text-xs text-gray-500 w-20 text-right truncate">{lang}</span>
                  <span className="font-mono text-xs text-gray-700 w-8 text-right">
                    {(bytes / total * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
          </div>
        )}

        {repo.stargazers_count >= 50 && (
          <div className="flex items-center gap-2 px-2 py-1 rounded mb-3"
            style={{ background: 'rgba(255,215,0,0.05)', border: '1px solid rgba(255,215,0,0.2)' }}>
            <span className="text-yellow-400 text-xs">🪐</span>
            <span className="font-mono text-xs text-yellow-600">
              Planetary rings — {repo.stargazers_count}+ stars
            </span>
          </div>
        )}

        <a href={repo.html_url} target="_blank" rel="noopener noreferrer"
          className="block text-center font-mono text-xs py-2 rounded transition-all"
          style={{ color, border: `1px solid ${color}33`, background: `${color}11` }}
        >
          Open on GitHub →
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
    hasStreak:       false,
    isEmpty,
  }), [data, monthsInactive, isEmpty])

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
  const { tier1, tier2, tier3, tier4 } = useMemo(() => {
    const sorted = [...ownRepos].sort((a, b) => b.stargazers_count - a.stargazers_count)
    return {
      tier1: sorted.slice(0, 5),
      tier2: sorted.slice(5, 15),
      tier3: sorted.slice(15, 30),
      tier4: sorted.slice(30),
    }
  }, [ownRepos])

  const MIN_ORBIT     = 8, ORBIT_STEP = 4.5
  const asteroidInner = MIN_ORBIT + data.languages.length * ORBIT_STEP + 2
  const asteroidOuter = asteroidInner + 7
  const caOffset      = useMemo(() => new THREE.Vector2(0.0005, 0.0005), [])
  const panelLang     = selectedLanguage ?? hoveredLanguage
  const panelPinned   = selectedLanguage !== null

  return (
    <div className="w-full h-full relative">
      {/* View mode toggle */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1 hud-panel rounded-full px-1 py-1">
        {(['repos', 'langs'] as ViewMode[]).map(m => (
          <button
            key={m}
            onClick={() => handleSetMode(m)}
            className="px-4 py-1.5 rounded-full font-mono text-xs tracking-widest transition-all"
            style={{
              background: viewMode === m ? 'rgba(0,229,255,0.15)' : 'transparent',
              color:      viewMode === m ? '#00e5ff' : '#2a4a5a',
              border:     viewMode === m ? '1px solid rgba(0,229,255,0.4)' : '1px solid transparent',
              boxShadow:  viewMode === m ? '0 0 10px rgba(0,229,255,0.2)' : 'none',
            }}
          >
            {m === 'repos' ? '⬤ REPOS' : '◎ LANGS'}
          </button>
        ))}
      </div>

      {/* Nebula type badge — bottom left */}
      <motion.div
        className="absolute bottom-16 left-4 z-10 flex items-center gap-2 pointer-events-none"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}
      >
        <div className="w-1.5 h-1.5 rounded-full"
          style={{ background: nebulaBadge.color, boxShadow: `0 0 6px ${nebulaBadge.color}` }} />
        <span className="font-mono text-xs tracking-widest"
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
        camera={{ position: [0, 20, 60], fov: 60, near: 0.1, far: 2000 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        style={{ background: '#000008' }}
      >
        <AdaptiveDpr pixelated />
        <ambientLight intensity={isEmpty ? 0.12 : 0.05} />

        <Suspense fallback={null}>
          <BackgroundStars />

          {/* Procedural nebula — seeded by username, unique per developer */}
          <Nebula
            username={data.username}
            primaryColor={primaryColor}
            nebulaType={nebulaType}
            spread={nebulaSpread}
            density={nebulaDensity}
            extraColors={extraColors}
          />

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
                  repoLanguages={data.repoLanguages[repo.name]}
                  onSelect={setSelectedRepo}
                  isSelected={selectedRepo?.id === repo.id}
                />
              ))}
              {tier2.map((repo, i) => (
                <RepoPlanet
                  key={repo.id} repo={repo} tier={2}
                  orbitRadius={T2_BASE + i * T2_STEP}
                  offset={(i / tier2.length) * Math.PI * 2 + 0.5}
                  index={i}
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
            </>
          )}

          {/* REPOS MODE — empty universe: show the few repos that exist */}
          {viewMode === 'repos' && isEmpty && tier1.map((repo, i) => (
            <RepoPlanet
              key={repo.id} repo={repo} tier={1}
              orbitRadius={T1_BASE + i * T1_STEP}
              offset={(i / Math.max(tier1.length, 1)) * Math.PI * 2}
              index={i}
              repoLanguages={data.repoLanguages[repo.name]}
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
        {viewMode === 'repos' && selectedRepo && (
          <RepoDetailPanel
            repo={selectedRepo}
            repoLanguages={data.repoLanguages[selectedRepo.name]}
            onClose={() => setSelectedRepo(null)}
          />
        )}
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
