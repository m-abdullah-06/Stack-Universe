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

function FunFactsTicker() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % FACTS.length);
        setVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fact = FACTS[idx];

  return (
    <div className="flex items-center gap-3 max-w-lg">
      <div className="w-px h-6 bg-space-cyan/20 flex-shrink-0" />
      <AnimatePresence mode="wait">
        {visible && (
          <motion.div
            key={idx}
            className="flex items-start gap-2"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
          >
            <span className="text-sm flex-shrink-0">{fact.icon}</span>
            <p className="font-mono text-xs text-gray-600 leading-relaxed">
              {fact.text}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
// ── System Manual Component ──────────────────────────────────────────────────
function SystemManual() {
  const [open, setOpen] = useState(false);
  return (
    <div className="fixed bottom-2 right-2 z-[100] md:bottom-8 md:right-8">
      <motion.button
        onClick={() => setOpen(!open)}
        className="bg-black/40 backdrop-blur-xl px-4 py-2 rounded-lg font-mono text-[10px] tracking-widest text-gray-500 hover:text-white transition-all border border-white/5 shadow-xl"
        whileHover={{ scale: 1.05, backgroundColor: "rgba(0,0,0,0.6)" }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? "✕ CLOSE" : "⌨ SYSTEM MANUAL"}
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-14 right-0 w-72 md:w-88 bg-[#05050f]/95 backdrop-blur-3xl p-6 rounded-2xl border border-white/10 shadow-2xl space-y-4 overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-space-cyan to-transparent opacity-50" />

            <section>
              <h4 className="font-orbitron font-bold text-xs text-space-cyan mb-2 tracking-widest uppercase">
                The Universe Score
              </h4>
              <p className="font-mono text-[10px] text-gray-400 leading-relaxed">
                Your primary gravitational constant. Computed from total
                commits, stargazers, and repository velocity across your entire
                GitHub profile.
              </p>
            </section>

            <section>
              <h4 className="font-orbitron font-bold text-xs text-space-purple mb-2 tracking-widest uppercase">
                Node Health
              </h4>
              <ul className="space-y-2 font-mono text-[9px] text-gray-400">
                <li className="flex gap-2 text-[10px]">
                  <span className="text-[#00e5a0] font-bold">THRIVING:</span>{" "}
                  High activity, well-documented, community growth.
                </li>
                <li className="flex gap-2 text-[10px]">
                  <span className="text-[#00e5ff] font-bold">HEALTHY:</span>{" "}
                  Steady pulse, maintained recently.
                </li>
                <li className="flex gap-2 text-[10px]">
                  <span className="text-[#ff8844] font-bold">STRUGGLING:</span>{" "}
                  Low data sync, missing descriptions.
                </li>
                <li className="flex gap-2 text-[10px]">
                  <span className="text-[#556677] font-bold">ARCHIVED:</span>{" "}
                  Deep space nodes with no signals for years.
                </li>
              </ul>
            </section>

            <section className="pt-2 border-t border-white/5">
              <p className="font-mono text-[9px] text-gray-600 italic">
                Connect your GitHub to generate your unique technical
                constellation.
              </p>
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

  // Mouse parallax for ghosting
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const ghostX = useTransform(mouseX, [0, 2000], [-10, 10]);
  const ghostY = useTransform(mouseY, [0, 1200], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  };

  useEffect(() => {
    // Fetch stored universes + leaderboard in parallel
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
      <MultiverseScene
        universes={universes}
        leaderboard={leaderboard}
        isWarping={isWarping}
        onWarpStart={() => setIsWarping(true)}
      />

      <SystemManual />

      {/* Technical Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,_transparent_0%,_#05050a_100%)]" />

      {/* 2. Scanner Beam */}
      <motion.div
        className="absolute w-full h-px bg-gradient-to-r from-transparent via-space-cyan/20 to-transparent z-10 pointer-events-none"
        animate={{ top: ["0%", "100%", "0%"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

      {/* 3. Corner Blueprints (Simulated Telemetry) — Offset from top-right controls */}
      <div className="absolute top-24 right-10 z-10 pointer-events-none flex flex-col items-end gap-1 font-mono text-[9px] text-gray-600 uppercase tracking-widest opacity-50">
        <div className="flex gap-4">
          <span>Active Nodes: 12,402</span>
          <span>Latency: 42ms</span>
        </div>
        <div className="flex gap-4">
          <span>Buffer: Optimized</span>
          <span>Feed: Syncing...</span>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 pointer-events-none font-mono text-[8px] text-gray-700 tracking-[0.4em] uppercase opacity-40 text-center hidden md:block">
        System Protocol v4.0 // Zen Universe Overhaul // All signals nominal
      </div>

      {/* Interactive Title Ghosting (Behind) */}
      <motion.div
        className="absolute top-10 left-10 z-10 pointer-events-none opacity-[0.08] blur-[2px] select-none"
        style={{
          x: ghostX,
          y: ghostY,
        }}
      >
        <h1 className="font-orbitron font-black text-5xl text-white tracking-tighter leading-none">
          STACK
          <br />
          UNIVERSE
        </h1>
      </motion.div>

      {/* Header & Logo */}
      <motion.div
        className="absolute top-10 left-10 z-20 pointer-events-none"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-[2px] bg-space-cyan shadow-[0_0_10px_rgba(0,229,255,0.5)]" />
          <span className="font-mono text-[10px] text-space-cyan tracking-[0.4em] uppercase">
            Deep Space Network
          </span>
        </div>
        <h1 className="font-orbitron font-black text-5xl text-white tracking-tighter leading-none">
          STACK
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-space-cyan to-blue-500 text-glow-cyan">
            UNIVERSE
          </span>
        </h1>
        <p className="font-mono text-[10px] text-gray-500 mt-4 tracking-[0.3em] uppercase opacity-60">
          Visualizing the GitHub Multiverse
        </p>
      </motion.div>

      {/* Top-right: Controls & Audio */}
      <motion.div
        className="absolute top-10 right-10 z-50 flex items-center gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <AmbientAudio />
      </motion.div>

      {/* Main interaction zone */}
      <motion.div
        className="absolute inset-0 flex flex-col items-center justify-center z-10 gap-12 pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 1 }}
      >
        <div className="pointer-events-auto scale-110">
          <SearchBar />
        </div>

        {/* Fun facts ticker with glassmorphism */}
        <motion.div
          className="bg-black/20 backdrop-blur-md border border-white/5 px-6 py-3 rounded-full pointer-events-auto shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <FunFactsTicker />
        </motion.div>

        {/* Stats Display */}
        {universes.length > 0 && (
          <motion.div
            className="flex gap-12 pointer-events-auto bg-black/30 backdrop-blur-xl border border-white/5 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5 }}
          >
            <div className="text-center group">
              <p className="font-orbitron font-bold text-space-cyan text-3xl group-hover:scale-110 transition-transform duration-500">
                {universes.length}
              </p>
              <p className="font-mono text-[9px] text-gray-500 tracking-widest mt-1 uppercase">
                Discoveries
              </p>
            </div>
            <div className="w-px h-12 bg-white/10 self-center" />
            <div className="text-center group">
              <p className="font-orbitron font-bold text-space-magenta text-3xl group-hover:scale-110 transition-transform duration-500">
                {leaderboard[0]?.universe_score.toLocaleString() ?? "—"}
              </p>
              <p className="font-mono text-[9px] text-gray-500 tracking-widest mt-1 uppercase">
                Peak Score
              </p>
            </div>
          </motion.div>
        )}

        {/* Random drift action */}
        {universes.length > 0 && (
          <motion.div
            className="pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
          >
            <RandomUniverseButton label="EXPLORE RANDOM SECTOR" />
          </motion.div>
        )}
      </motion.div>

      {/* Bottom: Hall of Giants Toggle */}
      <motion.div
        className="absolute bottom-10 left-10 z-30"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <button
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          className="group flex items-center gap-4 bg-black/40 backdrop-blur-md border border-white/10 hover:border-space-gold/50 px-6 py-3 rounded-full transition-all duration-300"
        >
          <span className="font-orbitron text-xs text-space-gold tracking-widest">
            ★ HALL OF GIANTS
          </span>
          <div className="w-px h-4 bg-white/10" />
          <span className="font-mono text-[10px] text-gray-500 group-hover:text-white transition-colors">
            {showLeaderboard ? "CLOSE" : "EXPAND"}
          </span>
        </button>
      </motion.div>

      {/* Leaderboard Overlay */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            className="absolute inset-0 z-40 flex items-center justify-end pr-10 pointer-events-none"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ type: "spring", damping: 25 }}
          >
            <div className="hud-panel rounded-2xl p-8 w-[400px] pointer-events-auto shadow-[0_0_100px_rgba(0,0,0,0.8)] backdrop-blur-2xl border border-white/5 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-orbitron font-bold text-xl text-white tracking-wider">
                  TOP COMMANDERS
                </h3>
                <button
                  onClick={() => setShowLeaderboard(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-12 gap-2 font-mono text-[9px] text-gray-600 mb-4 pb-2 border-b border-white/5 uppercase tracking-widest">
                  <span className="col-span-1">#</span>
                  <span className="col-span-5">Commander</span>
                  <span className="col-span-3 text-right">Score</span>
                  <span className="col-span-3 text-right">Stars</span>
                </div>

                {leaderboard.map((entry, i) => (
                  <a
                    key={entry.username}
                    href={`/universe/${entry.username}`}
                    className="grid grid-cols-12 gap-2 items-center py-3 px-3 hover:bg-white/5 rounded-lg transition-all group border-b border-white/3"
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
                    <span className="col-span-5 font-mono text-xs text-white group-hover:text-space-cyan transition-colors">
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corner Status Decorations */}
      <div className="absolute bottom-10 right-10 flex flex-col items-end gap-1 opacity-40 pointer-events-none">
        <p className="font-mono text-[9px] text-space-cyan tracking-[0.4em] uppercase">
          System Stable
        </p>
        <div className="flex gap-1">
          <div className="w-1 h-1 bg-space-cyan" />
          <div className="w-1 h-1 bg-space-cyan" />
          <div className="w-1 h-1 bg-space-cyan/20" />
        </div>
      </div>
    </main>
  );
}
