"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUniverseStore } from "@/store";
import type { UniverseData } from "@/types";

interface IdentityPanelProps {
  data: UniverseData;
}

interface Personality {
  name: string;
  description: string;
}

export function IdentityPanel({ data }: IdentityPanelProps) {
  const {
    showIdentityPanel,
    setShowIdentityPanel,
    identityObservations,
    setIdentityObservations,
  } = useUniverseStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [personality, setPersonality] = useState<Personality | null>(null);

  const fetchIdentity = useCallback(async () => {
    setLoading(true);
    setError("");
    setPersonality(null);
    try {
      const res = await fetch("/api/ai/identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const json = await res.json();
      if (json.observations && Array.isArray(json.observations)) {
        setIdentityObservations(json.observations);
        if (json.personality) {
          setPersonality(json.personality);
        }
      } else {
        throw new Error("Neural sync failed to return diagnostic data.");
      }
    } catch (err) {
      console.error("Identity Error:", err);
      setError("System trace interrupted. Please recalibrate.");
    } finally {
      setLoading(false);
    }
  }, [data, setIdentityObservations]);

  useEffect(() => {
    if (showIdentityPanel && identityObservations.length === 0) {
      fetchIdentity();
    }
  }, [showIdentityPanel, identityObservations, fetchIdentity]);

  return (
    <AnimatePresence>
      {showIdentityPanel && (
        <motion.div
          className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-space-dark/40 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowIdentityPanel(false);
          }}
        >
          <motion.div
            className="w-full max-w-2xl bg-black/90 border border-space-cyan/30 rounded-2xl md:rounded-3xl overflow-hidden shadow-[0_0_100px_rgba(0,229,255,0.15)] relative"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div className="p-5 md:p-8 border-b border-white/5 relative bg-gradient-to-b from-space-cyan/5 to-transparent">
              <div className="flex items-center justify-between mb-6 md:mb-8">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-space-cyan/10 border border-space-cyan/30 flex items-center justify-center flex-shrink-0">
                    <svg
                      className="w-6 h-6 md:w-7 md:h-7 text-space-cyan"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-orbitron font-black text-lg md:text-xl text-white tracking-widest uppercase truncate">
                      Identity Decoder
                    </h2>
                    <p className="font-mono text-[8px] md:text-[9px] text-space-cyan/50 tracking-[0.2em] md:tracking-[0.4em] uppercase italic truncate">
                      Audit // {data.username}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIdentityPanel(false)}
                  className="p-2 md:p-3 text-gray-500 hover:text-white transition-colors"
                >
                  <svg
                    className="w-4 h-4 md:w-5 md:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {/* Progress bar */}
              <div className="flex gap-3 md:gap-4">
                <div className="flex-1 space-y-1.5 md:space-y-2">
                  <div className="flex justify-between items-center text-[7px] md:text-[8px] font-mono text-space-cyan uppercase tracking-tighter">
                    <span>Neural Sync</span>
                    <span>{loading ? "98.2%" : "100%"}</span>
                  </div>
                  <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-space-cyan shadow-[0_0_10px_#00e5ff]"
                      initial={{ width: 0 }}
                      animate={{ width: loading ? "98%" : "100%" }}
                      transition={{ duration: 2 }}
                    />
                  </div>
                </div>
                <div className="px-3 md:px-4 border-l border-white/10 flex flex-col justify-center">
                  <p className="font-mono text-[8px] md:text-[10px] text-space-cyan font-bold leading-none">
                    ALPHA
                  </p>
                  <p className="font-mono text-[7px] md:text-[8px] text-gray-600">VER</p>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 md:p-8 pb-8 md:pb-12 max-h-[65vh] md:max-h-[60vh] overflow-y-auto custom-scrollbar">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 md:py-12 gap-5 md:gap-6">
                  <div className="relative w-12 h-12 md:w-16 md:h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-space-cyan/10" />
                    <motion.div
                      className="absolute inset-0 rounded-full border-t-4 border-space-cyan"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    />
                  </div>
                  <p className="font-mono text-[10px] md:text-xs text-space-cyan/40 tracking-[0.2em] animate-pulse">
                    ANALYSING...
                  </p>
                </div>
              ) : error ? (
                <div className="py-10 md:py-12 border border-red-500/20 rounded-xl md:rounded-2xl flex flex-col items-center gap-4 bg-red-500/5">
                  <p className="font-mono text-xs md:text-sm text-red-400 text-center px-4">{error}</p>
                  <button
                    onClick={fetchIdentity}
                    className="px-5 py-1.5 rounded-full border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all font-mono text-[10px] uppercase"
                  >
                    Retry Neural Sync
                  </button>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-5">
                  {/* Observations */}
                  {identityObservations.map((obs, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-4 md:gap-6 items-start group"
                    >
                      <div className="mt-1.5 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-space-cyan shadow-[0_0_8px_#00e5ff] flex-shrink-0" />
                      <p className="font-orbitron font-medium text-sm md:text-lg text-white leading-tight tracking-tight">
                        {obs}
                      </p>
                    </motion.div>
                  ))}

                  {/* Personality */}
                  {personality && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-4 md:mt-6 p-4 md:p-5 rounded-xl md:rounded-2xl border border-space-cyan/20 bg-space-cyan/5"
                    >
                      <p className="font-mono text-[8px] md:text-[9px] text-space-cyan/40 uppercase tracking-widest mb-1.5 md:mb-2">
                        DEVELOPER PERSONALITY
                      </p>
                      <p className="font-orbitron text-base md:text-lg text-space-cyan font-bold mb-1.5 md:mb-2">
                        {personality.name}
                      </p>
                      <p className="font-mono text-xs md:text-sm text-white/70 leading-relaxed">
                        {personality.description}
                      </p>
                    </motion.div>
                  )}

                  {/* Diagnostic hash footer */}
                  {identityObservations.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="mt-4 md:mt-6 p-4 md:p-5 bg-white/[0.03] border border-white/5 rounded-xl md:rounded-2xl flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-[8px] text-gray-500 uppercase tracking-widest leading-none mb-1">
                          Hash
                        </p>
                        <p className="font-mono text-[9px] text-space-cyan truncate opacity-50 uppercase">
                          {Math.random().toString(36).substring(2, 10)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-mono text-[8px] text-gray-500 uppercase italic">
                          Status
                        </p>
                        <p className="font-mono text-[9px] text-green-400 uppercase font-bold tracking-widest">
                          VERIFIED
                        </p>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>

            {/* Footer dots */}
            <div className="px-5 md:px-8 py-3 md:py-4 bg-white/[0.02] border-t border-white/5 flex gap-1 items-center justify-center">
              {Array.from({ length: 24 }).map((_, i) => (
                <div
                  key={i}
                  className={`w-0.5 h-2 md:w-1 md:h-3 rounded-full ${i % 4 === 0 ? "bg-space-cyan/40" : "bg-white/5"}`}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
