import { create } from 'zustand'
import type { UniverseData, StoredUniverse, LeaderboardEntry, ViewMode, GitHubRepo } from '@/types'

interface UniverseStore {
  currentUniverse: UniverseData | null
  setCurrentUniverse: (data: UniverseData | null) => void

  multiverseUniverses: StoredUniverse[]
  setMultiverseUniverses: (universes: StoredUniverse[]) => void

  leaderboard: LeaderboardEntry[]
  setLeaderboard: (entries: LeaderboardEntry[]) => void

  cinematicState: 'idle' | 'warping' | 'arriving' | 'done'
  setCinematicState: (state: 'idle' | 'warping' | 'arriving' | 'done') => void
  cinematicTarget: string | null
  setCinematicTarget: (username: string | null) => void

  selectedPlanetIndex: number | null
  setSelectedPlanetIndex: (idx: number | null) => void

  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  showHallOfGiants: boolean
  toggleHallOfGiants: () => void
  showShareCard: boolean
  setShowShareCard: (v: boolean) => void

  claimData: any | null
  setClaimData: (data: any | null) => void

  showClaimPulse: boolean
  setShowClaimPulse: (v: boolean) => void
  
  hoveredRepo: GitHubRepo | null
  setHoveredRepo: (repo: GitHubRepo | null) => void
  hoveredRepoSummary: string | null
  setHoveredRepoSummary: (summary: string | null) => void

  showNarrator: boolean
  setShowNarrator: (v: boolean) => void

  showRoast: boolean
  setShowRoast: (v: boolean) => void

  showHoroscope: boolean
  setShowHoroscope: (v: boolean) => void

  queriedPlanetNames: string[]
  setQueriedPlanetNames: (names: string[]) => void

  showIdentityPanel: boolean
  setShowIdentityPanel: (v: boolean) => void
  identityObservations: string[]
  setIdentityObservations: (obs: string[]) => void

  showCustomisePanel: boolean
  setShowCustomisePanel: (v: boolean) => void
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

  viewMode: 'repos',
  setViewMode: (mode) => set({ viewMode: mode }),

  showHallOfGiants: false,
  toggleHallOfGiants: () => set((s) => ({ showHallOfGiants: !s.showHallOfGiants })),
  showShareCard: false,
  setShowShareCard: (v) => set({ showShareCard: v }),

  claimData: null,
  setClaimData: (data) => set({ claimData: data }),

  showClaimPulse: false,
  setShowClaimPulse: (v) => set({ showClaimPulse: v }),

  hoveredRepo: null,
  setHoveredRepo: (repo) => set({ hoveredRepo: repo }),
  hoveredRepoSummary: null,
  setHoveredRepoSummary: (summary) => set({ hoveredRepoSummary: summary }),

  showNarrator: false,
  setShowNarrator: (v) => set({ showNarrator: v }),

  showRoast: false,
  setShowRoast: (v) => set({ showRoast: v }),

  showHoroscope: false,
  setShowHoroscope: (v) => set({ showHoroscope: v }),

  queriedPlanetNames: [],
  setQueriedPlanetNames: (names: string[]) => set({ queriedPlanetNames: names }),

  showIdentityPanel: false,
  setShowIdentityPanel: (v: boolean) => set({ showIdentityPanel: v }),
  identityObservations: [],
  setIdentityObservations: (obs) => set({ identityObservations: obs }),

  showCustomisePanel: false,
  setShowCustomisePanel: (v) => set({ showCustomisePanel: v }),
}))

export const useIsAnyPanelOpen = () => {
  return useUniverseStore((s) => 
    s.showHallOfGiants || 
    s.showShareCard || 
    s.showNarrator || 
    s.showRoast || 
    s.showHoroscope || 
    s.showIdentityPanel ||
    s.showCustomisePanel
  )
}
