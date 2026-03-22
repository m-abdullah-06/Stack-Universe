"use client";

import { useEffect, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { MultiverseScene } from "@/components/multiverse/MultiverseScene";
import { SearchBar } from "@/components/multiverse/SearchBar";
import { RandomUniverseButton } from "@/components/ui/RandomUniverseButton";
import { AmbientAudio } from "@/components/ui/AmbientAudio";
import type { StoredUniverse, LeaderboardEntry } from "@/types";

const FACTS = [
  {
    icon: "🌌",
    text: "JavaScript was written in 10 days in 1995. It now runs everywhere.",
  },
  {
    icon: "⭐",
    text: "The most starred GitHub repo ever is freeCodeCamp with 400k+ stars.",
  },
  {
    icon: "🦀",
    text: 'Rust has been Stack Overflow\'s "most loved language" for 9 consecutive years.',
  },
  {
    icon: "🐍",
    text: "Python is now the most popular language on GitHub by repo count.",
  },
  { icon: "⚡", text: "The average GitHub user has 8.3 public repositories." },
  { icon: "🌍", text: "Over 100 million developers use GitHub worldwide." },
  { icon: "🔭", text: "The Linux kernel has over 30 million lines of C code." },
  { icon: "💫", text: "TypeScript adoption grew 400% between 2017 and 2023." },
  {
    icon: "🌙",
    text: 'Lua means "moon" in Portuguese — it was born in Brazil in 1993.',
  },
  {
    icon: "🔮",
    text: "Go was designed at Google in a single afternoon by Ken Thompson, Rob Pike, and Robert Griesemer.",
  },
  {
    icon: "🛸",
    text: "WebAssembly can run C, C++, Rust, and Go code in the browser at near-native speed.",
  },
  {
    icon: "🪐",
    text: 'The name "Kotlin" comes from Kotlin Island near St. Petersburg, Russia.',
  },
];

// ── System Manual ────────────────────────────────────────────────────────────
function SystemManual() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-6 right-6 z-[100] hidden md:block">
      <motion.button
        onClick={() => setOpen(!open)}
        className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-lg font-mono text-[10px] tracking-widest text-gray-500 hover:text-white transition-all border border-white/10"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? "✕ CLOSE" : "⌨ MANUAL"}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-14 right-0 w-72 bg-[#05050f]/98 backdrop-blur-3xl p-5 rounded-2xl border border-white/10 shadow-2xl space-y-3 z-[110]"
          >
            <section>
              <h4 className="font-orbitron font-bold text-xs text-space-cyan mb-1.5 tracking-widest uppercase">
                The Universe Score
              </h4>
              <p className="font-mono text-[10px] text-gray-400 leading-relaxed">
                Your primary gravitational constant. Computed from total
                commits, stargazers, and repository velocity.
              </p>
            </section>
            <section>
              <h4 className="font-orbitron font-bold text-xs text-space-purple mb-1.5 tracking-widest uppercase">
                Node Health
              </h4>
              <ul className="space-y-1.5 font-mono text-[10px] text-gray-400">
                <li>
                  <span className="text-[#00e5a0] font-bold">THRIVING:</span>{" "}
                  High activity, well-documented.
                </li>
                <li>
                  <span className="text-[#00e5ff] font-bold">HEALTHY:</span>{" "}
                  Steady pulse, maintained recently.
                </li>
                <li>
                  <span className="text-[#ff8844] font-bold">STRUGGLING:</span>{" "}
                  Low data sync, missing descriptions.
                </li>
                <li>
                  <span className="text-[#556677] font-bold">ARCHIVED:</span>{" "}
                  Deep space nodes, no signals for years.
                </li>
              </ul>
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Home() {
  const [universes, setUniverses] = useState<StoredUniverse[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isWarping, setIsWarping] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/universes")
        .then((r) => r.json())
        .catch(() => ({ universes: [] })),
      fetch("/api/leaderboard")
        .then((r) => r.json())
        .catch(() => ({ leaderboard: [] })),
    ]).then(([uData, lData]) => {
      setUniverses(uData.universes || []);
      setLeaderboard(lData.leaderboard || []);
    });
  }, []);

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f] selection:bg-space-cyan/30"
      onMouseMove={handleMouseMove}
    >
      {/* 3D Background */}
      <MultiverseScene
        universes={universes}
        leaderboard={leaderboard}
        isWarping={isWarping}
        onWarpStart={() => setIsWarping(true)}
      />

      {/* ── Foreground UI Layer ── */}
      <div className="absolute inset-0 z-10 flex flex-col pointer-events-none">
        {/* ── Header ── */}
        <header className="flex-shrink-0 w-full px-4 md:px-8 py-4 flex justify-between items-center border-b border-white/5 bg-black/50 backdrop-blur-xl pointer-events-auto">
          <div className="flex items-center gap-3">
            <h1 className="font-orbitron font-black text-base md:text-xl text-white tracking-widest">
              STACK<span className="text-space-cyan">UNIVERSE</span>
            </h1>
            <span className="font-mono text-[7px] md:text-[8px] text-gray-600 tracking-[0.2em] uppercase hidden sm:inline">
              v1.0.2
            </span>
          </div>
          <div className="flex items-center gap-3">
            <AmbientAudio />
          </div>
        </header>

        {/* ── Center Content ── */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-0 overflow-y-auto">
          <motion.div
            className="w-full max-w-xl space-y-6 md:space-y-10 pointer-events-auto py-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {/* Search Label */}
            <div className="flex items-center justify-between font-mono text-[10px] text-space-cyan tracking-widest opacity-50 px-1">
              <span>[ INIT_SCAN ]</span>
              <span className="animate-pulse">SCAN_ACTIVE_</span>
            </div>

            {/* Search */}
            <SearchBar />

            {/* Stats */}
            {universes.length > 0 && (
              <motion.div
                className="flex gap-8 justify-center bg-white/[0.02] backdrop-blur-xl border border-white/8 rounded-2xl p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
              >
                <div className="text-center">
                  <p className="font-mono text-[9px] text-gray-500 tracking-[0.2em] uppercase mb-1">
                    DISCOVERIES
                  </p>
                  <p className="font-orbitron font-bold text-space-cyan text-2xl md:text-3xl">
                    {universes.length}
                  </p>
                </div>
                <div className="w-px bg-white/10 self-stretch" />
                <div className="text-center">
                  <p className="font-mono text-[9px] text-gray-500 tracking-[0.2em] uppercase mb-1">
                    PEAK_SCORE
                  </p>
                  <p className="font-orbitron font-bold text-space-magenta text-2xl md:text-3xl">
                    {leaderboard[0]?.universe_score.toLocaleString() ?? "—"}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Random Button */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <RandomUniverseButton
                label="JUMP TO RANDOM SECTOR"
                className="px-6 py-3 !text-xs tracking-[0.2em]"
              />
            </motion.div>

            {/* Hall of Giants — Clean CTA */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="group flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/10 hover:border-space-gold/40 px-5 py-2.5 rounded-full transition-all"
              >
                <span className="font-orbitron text-[10px] text-space-gold tracking-widest">
                  ★ HALL OF GIANTS
                </span>
                <span className="font-mono text-[9px] text-gray-500 group-hover:text-white transition-colors uppercase">
                  {showLeaderboard ? "CLOSE" : "EXPAND"}
                </span>
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* ── System Manual (Desktop only) ── */}
      <SystemManual />

      {/* ── Leaderboard Overlay ── */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end md:items-center md:justify-end pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40 pointer-events-auto"
              onClick={() => setShowLeaderboard(false)}
            />

            {/* Panel */}
            <motion.div
              className="relative w-full md:w-[420px] md:mr-8 max-h-[80vh] pointer-events-auto bg-black/80 backdrop-blur-[50px] border border-white/10 rounded-t-3xl md:rounded-2xl p-6 md:p-8 flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.6)]"
              initial={{ y: "100%", x: 0 }}
              animate={{ y: 0, x: 0 }}
              exit={{ y: "100%", x: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
            >
              {/* Mobile drag handle */}
              <div className="md:hidden w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

              <div className="flex items-center justify-between mb-6">
                <h3 className="font-orbitron font-bold text-lg text-white tracking-wider">
                  TOP COMMANDERS
                </h3>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-gray-500 hover:text-white transition-colors p-1"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-12 gap-2 font-mono text-[9px] text-gray-600 mb-3 pb-2 border-b border-white/5 uppercase tracking-widest">
                  <span className="col-span-1">#</span>
                  <span className="col-span-5">Commander</span>
                  <span className="col-span-3 text-right">Score</span>
                  <span className="col-span-3 text-right">Stars</span>
                </div>

                {leaderboard.map((entry, i) => (
                  <a
                    key={entry.username}
                    href={`/universe/${entry.username}`}
                    className="grid grid-cols-12 gap-2 items-center py-2.5 px-2 hover:bg-white/5 rounded-lg transition-all group"
                  >
                    <span
                      className="col-span-1 font-orbitron text-xs"
                      style={{
                        color:
                          i === 0
                            ? "#ffd700"
                            : i === 1
                              ? "#c0c0c0"
                              : i === 2
                                ? "#cd7f32"
                                : "#4a6a7a",
                      }}
                    >
                      {i + 1}
                    </span>
                    <span className="col-span-5 font-mono text-xs text-white group-hover:text-space-cyan transition-colors truncate">
                      @{entry.username}
                    </span>
                    <span className="col-span-3 text-right font-orbitron text-[10px] text-space-cyan">
                      {entry.universe_score.toLocaleString()}
                    </span>
                    <span className="col-span-3 text-right font-mono text-[10px] text-yellow-500/80">
                      ★ {entry.total_stars.toLocaleString()}
                    </span>
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
