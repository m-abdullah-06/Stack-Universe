import { create } from 'zustand'
import type { UniverseData, StoredUniverse, LeaderboardEntry } from '@/types'

interface UniverseStore {
  // Current loaded universe
  currentUniverse: UniverseData | null
  setCurrentUniverse: (data: UniverseData | null) => void

  // Multiverse data (all visited universes)
  multiverseUniverses: StoredUniverse[]
  setMultiverseUniverses: (universes: StoredUniverse[]) => void

  // Leaderboard
  leaderboard: LeaderboardEntry[]
  setLeaderboard: (entries: LeaderboardEntry[]) => void

  // Cinematic state
  cinematicState: 'idle' | 'warping' | 'arriving' | 'done'
  setCinematicState: (state: 'idle' | 'warping' | 'arriving' | 'done') => void
  cinematicTarget: string | null
  setCinematicTarget: (username: string | null) => void

  // Selected planet (for zoom-in interaction)
  selectedPlanetIndex: number | null
  setSelectedPlanetIndex: (idx: number | null) => void

  // UI state
  showHallOfGiants: boolean
  toggleHallOfGiants: () => void
  showShareCard: boolean
  setShowShareCard: (v: boolean) => void
}

export const useUniverseStore = create<UniverseStore>((set) => ({
  currentUniverse: null,
  setCurrentUniverse: (data) => set({ currentUniverse: data }),

  multiverseUniverses: [],
  setMultiverseUniverses: (universes) => set({ multiverseUniverses: universes }),

  leaderboard: [],
  setLeaderboard: (entries) => set({ leaderboard: entries }),

  cinematicState: 'idle',
  setCinematicState: (state) => set({ cinematicState: state }),
  cinematicTarget: null,
  setCinematicTarget: (username) => set({ cinematicTarget: username }),

  selectedPlanetIndex: null,
  setSelectedPlanetIndex: (idx) => set({ selectedPlanetIndex: idx }),

  showHallOfGiants: false,
  toggleHallOfGiants: () =>
    set((s) => ({ showHallOfGiants: !s.showHallOfGiants })),
  showShareCard: false,
  setShowShareCard: (v) => set({ showShareCard: v }),
}))
