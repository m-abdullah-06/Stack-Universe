'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useUniverseStore } from '@/store'
import { getLanguageColor } from '@/lib/language-colors'

export function RepoSummaryHUD() {
  const { hoveredRepo, hoveredRepoSummary } = useUniverseStore()

  return (
    <AnimatePresence>
      {hoveredRepo && (
        <motion.div
          className="fixed bottom-20 md:bottom-28 left-4 right-4 md:left-1/2 md:-translate-x-1/2 z-[110] md:w-[400px] pointer-events-none"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
        >
          <div className="bg-black/80 backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            {/* Top accent bar */}
            <div 
              className="h-1 w-full" 
              style={{ 
                backgroundColor: getLanguageColor(hoveredRepo.language || ''),
                boxShadow: `0 0 15px ${getLanguageColor(hoveredRepo.language || '')}cc`
              }} 
            />
            
            <div className="p-5 flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[9px] text-gray-500 uppercase tracking-[0.3em]">System Scan</span>
                <div className="w-1 h-1 rounded-full bg-space-cyan animate-pulse" />
              </div>
              
              <h3 className="font-orbitron font-black text-xl text-white tracking-wider mb-2">
                {hoveredRepo.name.toUpperCase()}
              </h3>
              
              <div className="relative py-4 px-6 mb-2">
                {/* Decorative brackets */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/10" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/10" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/10" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/10" />
                
                <AnimatePresence mode="wait">
                  {hoveredRepoSummary ? (
                    <motion.p
                      key="summary"
                      className="font-mono text-xs text-space-cyan leading-relaxed italic"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      "{hoveredRepoSummary}"
                    </motion.p>
                  ) : (
                    <motion.div
                      key="loading"
                      className="flex items-center justify-center gap-3 py-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex gap-1">
                        {[0, 1, 2].map(i => (
                          <motion.div
                            key={i}
                            className="w-1 h-1 rounded-full bg-space-cyan/40"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                      <span className="font-mono text-[10px] text-gray-500 uppercase tracking-widest">Decoding core...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <div className="flex gap-4 mt-2">
                <div className="flex flex-col">
                  <span className="text-[8px] font-mono text-gray-600 uppercase">Influence</span>
                  <span className="text-xs font-orbitron text-space-gold">★ {hoveredRepo.stargazers_count}</span>
                </div>
                <div className="w-px h-6 bg-white/5 mx-1" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-mono text-gray-600 uppercase">Language</span>
                  <span className="text-xs font-orbitron" style={{ color: getLanguageColor(hoveredRepo.language || '') }}>
                    {hoveredRepo.language || 'Plain'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
