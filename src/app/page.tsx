"use client";

import { useEffect, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
} from "framer-motion";
import Link from 'next/link';
import { MultiverseScene } from "@/components/multiverse/MultiverseScene";
import { SearchBar } from "@/components/multiverse/SearchBar";
import { RandomUniverseButton } from "@/components/ui/RandomUniverseButton";
import { LoginButton } from "@/components/ui/LoginButton";
import { AmbientAudio } from "@/components/ui/AmbientAudio";
import { DiscoveryTicker } from "@/components/ui/DiscoveryTicker";
import type { StoredUniverse, LeaderboardEntry } from "@/types";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CockpitOverlay } from "@/components/ui/CockpitOverlay";
import { AuthGate } from "@/components/ui/AuthGate";
import { WelcomeAuthPopup } from "@/components/ui/WelcomeAuthPopup";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useShipAudio } from "@/hooks/useShipAudio";
import { useUniverseStore } from "@/store";

export default function Home() {
  const [universes, setUniverses] = useState<StoredUniverse[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [isWarping, setIsWarping] = useState(false);
  const [cockpitMode, setCockpitMode] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [proximityTarget, setProximityTarget] = useState<string | null>(null);

  const { data: session, status } = useSession();
  const router = useRouter();
  
  const showAuthGate = useUniverseStore(s => s.showAuthGate);
  const setShowAuthGate = useUniverseStore(s => s.setShowAuthGate);

  const loggedInUser = session?.user
    ? (session.user as any).login || session.user.name
    : null;

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Ship Flight & Audio Systems
  const keys = useKeyboard();
  const thrustAmount = keys.forward || keys.up || keys.down ? 1 : 0;
  useShipAudio(cockpitMode, thrustAmount, !!proximityTarget);

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

  const handleSearch = (username: string) => {
    if (status === 'unauthenticated') {
      setShowAuthGate(true)
    } else {
      setIsWarping(true)
      router.push(`/universe/${username}`)
    }
  }

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-[#0a0a0f] selection:bg-space-cyan/30"
      onMouseMove={handleMouseMove}
    >
      <WelcomeAuthPopup />
      
      {/* 3D Background */}
      <MultiverseScene
        universes={universes}
        leaderboard={leaderboard}
        isWarping={isWarping}
        onWarpStart={() => setIsWarping(true)}
        cockpitMode={cockpitMode}
        selectedTarget={selectedTarget}
        onTargetSelect={handleSearch}
        onProximityChange={setProximityTarget}
      />

      {/* Cockpit HUD Overlay */}
      <AnimatePresence>
        {cockpitMode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CockpitOverlay 
              proximityTarget={proximityTarget} 
              onExit={() => setCockpitMode(false)}
              isWarping={isWarping}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Gate (Uncloseable Login) */}
      <AnimatePresence>
        {showAuthGate && status === 'unauthenticated' && (
          <AuthGate />
        )}
      </AnimatePresence>

      {/* Cockpit Toggle Button (Landing Page) */}
      {!showAuthGate && !cockpitMode && (
        <div className="fixed top-20 right-6 md:right-10 z-[101] pointer-events-auto">
          <button
            onClick={() => setCockpitMode(!cockpitMode)}
            className={`w-12 h-12 flex items-center justify-center rounded-full transition-all duration-500 border ${
              cockpitMode 
                ? 'bg-space-magenta border-white/20 text-white shadow-[0_0_20px_rgba(255,0,110,0.6)]' 
                : 'bg-black/80 border-white/10 text-gray-400 hover:text-white hover:border-space-cyan/50'
            }`}
            title="Enter Starship Cockpit"
          >
            <span className="text-xl">🚀</span>
          </button>
        </div>
      )}

      {/* Live Discovery Feed */}
      <DiscoveryTicker />

      {/* ── Foreground UI Layer ── */}
      <AnimatePresence>
        {!cockpitMode && (
          <motion.div 
            className="absolute inset-0 z-10 flex flex-col pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* ── Header ── */}
            <header className="flex-shrink-0 w-full px-4 md:px-8 py-3 md:py-4 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-center border-b border-white/5 bg-black/50 backdrop-blur-xl pointer-events-auto">
              <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto justify-center sm:justify-start">
                <h1 className="font-orbitron font-black text-lg md:text-xl text-white tracking-widest">
                  STACK<span className="text-space-cyan">UNIVERSE</span>
                </h1>
                <span className="font-mono text-[7px] md:text-[8px] text-gray-600 tracking-[0.2em] uppercase hidden sm:inline">
                  v1.0.5
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 md:gap-3 w-full sm:w-auto">
                <AmbientAudio />
                <LoginButton />
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
                <SearchBar onSearch={handleSearch} />

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

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
                  <Link 
                    href="/multiverse"
                    className="px-8 py-4 bg-transparent border border-white/20 text-white font-bold rounded-full hover:bg-white/5 hover:border-space-cyan/50 hover:shadow-[0_0_20px_rgba(0,229,255,0.2)] transition-all duration-300 flex items-center gap-2"
                  >
                    <span className="text-space-cyan opacity-70">🧭</span>
                    <span>Multiverse Map</span>
                  </Link>
                </div>

                <motion.div
                  className="flex justify-center flex-col items-center gap-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                >
                  <div className="flex gap-4">
                    {loggedInUser && (
                      <button
                        onClick={() => router.push(`/universe/${loggedInUser}`)}
                        className="px-4 py-2 font-mono text-[9px] tracking-[0.2em] bg-space-gold/5 text-space-gold border border-space-gold/20 rounded-lg hover:bg-space-gold/10 transition-all uppercase"
                      >
                        MY UNIVERSE
                      </button>
                    )}
                    <RandomUniverseButton
                      label="RANDOM SECTOR"
                      className="px-4 py-2 !text-[9px] tracking-[0.2em]"
                    />
                  </div>

                  {/* Hall of Giants Toggle */}
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
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Leaderboard Overlay ── */}
      <AnimatePresence>
        {showLeaderboard && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end md:items-center md:justify-end pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div
              className="absolute inset-0 bg-black/40 pointer-events-auto"
              onClick={() => setShowLeaderboard(false)}
            />
            <motion.div
              className="relative w-full md:w-[420px] md:mr-8 h-[80vh] pointer-events-auto bg-black/90 backdrop-blur-[50px] border border-white/10 rounded-t-3xl md:rounded-2xl p-6 md:p-8 flex flex-col shadow-[0_0_80px_rgba(0,0,0,0.6)]"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 200 }}
            >
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
                  <button
                    key={entry.username}
                    onClick={() => handleSearch(entry.username)}
                    className="w-full grid grid-cols-12 gap-2 items-center py-2.5 px-2 hover:bg-white/5 rounded-lg transition-all group pointer-events-auto text-left"
                  >
                    <span
                      className="col-span-1 font-orbitron text-xs"
                      style={{
                        color:
                          i === 0 ? "#ffd700" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "#4a6a7a",
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
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
