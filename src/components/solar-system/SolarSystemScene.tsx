'use client'

import { useRef, useState, Suspense, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Stars, AdaptiveDpr } from '@react-three/drei'
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import { CentralStar } from './CentralStar'
import { Planet } from './Planet'
import { AsteroidBelt, BeltStats } from './AsteroidBelt'
import { ShootingStars } from './ShootingStars'
import type { CommitTooltipState } from './ShootingStars'
import type { UniverseData, LanguageData } from '@/types'
import { useUniverseStore } from '@/store'

function BackgroundStars() {
  return <Stars radius={150} depth={60} count={5000} factor={4} saturation={0.1} fade speed={0.3} />
}

function NebulaParticles({ color }: { color: string }) {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const count = 300
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 60 + Math.random() * 80
      const a = Math.random() * Math.PI * 2
      const b = (Math.random() - 0.5) * 0.5
      arr[i * 3]     = Math.cos(a) * Math.cos(b) * r
      arr[i * 3 + 1] = Math.sin(b) * r * 0.3
      arr[i * 3 + 2] = Math.sin(a) * Math.cos(b) * r
    }
    return arr
  }, [])
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.003 })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={color} size={0.3} sizeAttenuation transparent opacity={0.2} />
    </points>
  )
}

// Language fun facts
const LANG_FACTS: Record<string, string> = {
  JavaScript:  'Created in 10 days by Brendan Eich in 1995. Originally called Mocha.',
  TypeScript:  'Developed by Anders Hejlsberg at Microsoft. First released in 2012.',
  Python:      'Named after Monty Python, not the snake. Created by Guido van Rossum.',
  Go:          'Designed at Google in 2007. Gopher mascot drawn by Renée French.',
  Java:        'Originally called Oak. Now runs on ~3 billion devices.',
  'C++':       'Created by Bjarne Stroustrup. "C with Classes" was its first name.',
  C:           'Dennis Ritchie created C in 1972 to rewrite UNIX.',
  Ruby:        'Yukihiro Matsumoto designed it for developer happiness, not performance.',
  PHP:         'Originally stood for "Personal Home Page". Now "PHP: Hypertext Preprocessor".',
  Swift:       'Apple replaced Objective-C with Swift in 2014. Compiles 8.4× faster.',
  Kotlin:      'Named after Kotlin Island near St. Petersburg. JetBrains made it.',
  Scala:       '"Scalable Language" — runs on JVM. Functional + OOP combined.',
  Haskell:     'Named after logician Haskell Curry. Purely functional.',
  Elixir:      'Built on Erlang VM, can handle millions of concurrent connections.',
  Dart:        'Google made Dart as a JavaScript replacement. Powers Flutter.',
  R:           'R was created as a free clone of the S language in 1993.',
  Lua:         'Lua means "moon" in Portuguese. Embedded in many games.',
  Rust:        'Memory-safe without a garbage collector — achieves this with "ownership".',
  HTML:        'Tim Berners-Lee invented HTML in 1991 with only 18 tags.',
  CSS:         'Håkon Wium Lie proposed CSS in 1994 while working with Berners-Lee.',
}

function getFact(langName: string): string {
  return LANG_FACTS[langName] ?? `${langName} is used by developers worldwide.`
}

function formatActivity(days: number): string {
  if (days < 1) return 'Today'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}yr ago`
}

// Side panel — shows on hover (transient) or on click (pinned)
interface PlanetPanelProps {
  lang: LanguageData
  pinned: boolean
  onClose: () => void
}

function PlanetPanel({ lang, pinned, onClose }: PlanetPanelProps) {
  return (
    <motion.div
      key={lang.name}
      className="absolute top-1/2 right-4 -translate-y-1/2 hud-panel rounded overflow-hidden w-72"
      style={{ zIndex: 20 }}
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.2 }}
    >
      {/* Colour accent bar */}
      <div className="h-0.5 w-full" style={{ background: lang.color, boxShadow: `0 0 8px ${lang.color}` }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-mono text-xs text-gray-600 tracking-widest">PLANET</p>
            <p className="font-orbitron font-bold text-lg leading-tight" style={{ color: lang.color }}>
              {lang.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {pinned && (
              <span className="font-mono text-xs text-gray-700 tracking-wider">PINNED</span>
            )}
            {pinned && (
              <button
                onClick={onClose}
                className="text-gray-700 hover:text-white transition-colors font-mono text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-xs mb-3">
          <span className="text-gray-600">Coverage</span>
          <span style={{ color: lang.color }}>{lang.percentage.toFixed(1)}%</span>

          <span className="text-gray-600">Repos</span>
          <span className="text-white">{lang.repos.length}</span>

          <span className="text-gray-600">Last active</span>
          <span className="text-white">{formatActivity(lang.daysSinceActivity)}</span>

          <span className="text-gray-600">Top stars</span>
          <span className="text-yellow-400">
            ★ {lang.repos[0]?.stargazers_count.toLocaleString() ?? '0'}
          </span>
        </div>

        {/* Orbit speed label */}
        <div
          className="flex items-center gap-2 px-2 py-1 rounded mb-3"
          style={{ background: `${lang.color}11`, border: `1px solid ${lang.color}22` }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: lang.color, animation: `pulse 1.5s infinite` }}
          />
          <span className="font-mono text-xs text-gray-500">
            Orbit:{' '}
            {lang.daysSinceActivity < 30  ? 'fast (active)' :
             lang.daysSinceActivity < 180 ? 'medium' :
             lang.daysSinceActivity < 365 ? 'slow' : 'nearly frozen'}
          </span>
        </div>

        {/* Fun fact */}
        <div
          className="px-2 py-2 rounded mb-3"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="font-mono text-xs text-gray-600 mb-0.5 tracking-widest">FUN FACT</p>
          <p className="font-mono text-xs text-gray-400 leading-relaxed">{getFact(lang.name)}</p>
        </div>

        {/* Repo list (top 4) */}
        {lang.repos.length > 0 && (
          <div>
            <p className="font-mono text-xs text-gray-700 tracking-widest mb-1.5">
              TOP REPOS {pinned ? '(click moon to open)' : ''}
            </p>
            <div className="space-y-1">
              {lang.repos.slice(0, 4).map(repo => (
                <a
                  key={repo.id}
                  href={repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex justify-between items-center px-2 py-1 rounded hover:bg-white/5 transition-colors group"
                >
                  <span
                    className="font-mono text-xs truncate max-w-40"
                    style={{ color: lang.color + 'cc' }}
                  >
                    {repo.name}
                  </span>
                  <span className="font-mono text-xs text-yellow-500 flex-shrink-0">
                    ★ {repo.stargazers_count}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {!pinned && (
          <p className="font-mono text-xs text-gray-800 mt-2 text-center">
            click to pin
          </p>
        )}
      </div>
    </motion.div>
  )
}

interface SolarSystemSceneProps {
  data: UniverseData
}

export function SolarSystemScene({ data }: SolarSystemSceneProps) {
  const { selectedPlanetIndex, setSelectedPlanetIndex } = useUniverseStore()
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageData | null>(null)
  const [hoveredLanguage, setHoveredLanguage]   = useState<LanguageData | null>(null)
  const [commitTooltip, setCommitTooltip]       = useState<CommitTooltipState | null>(null)

  const MIN_ORBIT = 8
  const ORBIT_STEP = 4.5

  const handlePlanetSelect = (lang: LanguageData | null, idx: number) => {
    if (lang === null) {
      setSelectedLanguage(null)
      setSelectedPlanetIndex(null)
    } else {
      setSelectedLanguage(lang)
      setSelectedPlanetIndex(idx)
    }
  }

  const asteroidInner = MIN_ORBIT + data.languages.length * ORBIT_STEP + 2
  const asteroidOuter = asteroidInner + 7
  const nebulaColor   = data.languages[0]?.color ?? '#00e5ff'
  const caOffset      = useMemo(() => new THREE.Vector2(0.0005, 0.0005), [])

  // Panel to show: pinned (selected) takes priority, else hovered
  const panelLang   = selectedLanguage ?? hoveredLanguage
  const panelPinned = selectedLanguage !== null

  return (
    <div className="w-full h-full relative">
      <Canvas
        camera={{ position: [0, 20, 60], fov: 60, near: 0.1, far: 2000 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        style={{ background: '#000008' }}
      >
        <AdaptiveDpr pixelated />
        <ambientLight intensity={0.05} />

        <Suspense fallback={null}>
          <BackgroundStars />
          <NebulaParticles color={nebulaColor} />

          <CentralStar
            user={data.user}
            totalStars={data.totalStars}
            totalRepos={data.repos.length}
            score={data.universeScore}
            onClick={() => {
              setSelectedLanguage(null)
              setSelectedPlanetIndex(null)
            }}
          />

          {data.languages.map((lang, i) => (
            <Planet
              key={lang.name}
              language={lang}
              orbitRadius={MIN_ORBIT + i * ORBIT_STEP}
              size={Math.max(0.3, Math.min(1.2, 0.3 + (lang.percentage / 100) * 2.8))}
              offset={(i / data.languages.length) * Math.PI * 2}
              index={i}
              onSelect={(l) => handlePlanetSelect(l, i)}
              onHover={(l) => {
                // Don't override a pinned selection
                if (!selectedLanguage) setHoveredLanguage(l)
              }}
              isSelected={selectedPlanetIndex === i}
            />
          ))}

          {/* Asteroid belt — always render, pass repos for categorisation */}
          <AsteroidBelt
            repos={data.repos}
            innerRadius={asteroidInner}
            outerRadius={asteroidOuter}
          />

          <ShootingStars
            commits={data.recentCommits}
            repos={data.repos.slice(0, 10).map(r => ({ name: r.name, html_url: r.html_url }))}
            onTooltip={setCommitTooltip}
          />

          <EffectComposer>
            <Bloom
              intensity={1.4}
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
          maxDistance={200}
          autoRotate={selectedPlanetIndex === null}
          autoRotateSpeed={0.15}
          makeDefault
        />
      </Canvas>

      {/* ─── Side planet panel ─── */}
      <AnimatePresence>
        {panelLang && (
          <PlanetPanel
            lang={panelLang}
            pinned={panelPinned}
            onClose={() => {
              setSelectedLanguage(null)
              setSelectedPlanetIndex(null)
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── Asteroid belt stats ─── */}
      <BeltStats repos={data.repos} />

      {/* ─── Commit tooltip — rendered as real DOM so it's always crisp ─── */}
      {commitTooltip && (
        <div
          style={{
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
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
            <span style={{ color: '#ff006e', fontWeight: 'bold', fontSize: 12 }}>
              ⚡ {commitTooltip.commit.repoName}
            </span>
            <span style={{
              fontSize: 8,
              padding: '1px 5px',
              borderRadius: 3,
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
