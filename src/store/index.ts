import { create } from 'zustand'
import type { UniverseData, StoredUniverse, LeaderboardEntry, ViewMode, GitHubRepo, ClaimData } from '@/types'

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

  activePanel: 'narrator' | 'roast' | 'horoscope' | 'identity' | 'dna' | 'giants' | 'share' | 'customise' | null
  setActivePanel: (panel: 'narrator' | 'roast' | 'horoscope' | 'identity' | 'dna' | 'giants' | 'share' | 'customise' | null) => void



  claimData: ClaimData | null
  setClaimData: (data: ClaimData | null) => void

  showClaimPulse: boolean
  setShowClaimPulse: (v: boolean) => void
  
  hoveredRepo: GitHubRepo | null
  setHoveredRepo: (repo: GitHubRepo | null) => void
  hoveredRepoSummary: string | null
  setHoveredRepoSummary: (summary: string | null) => void

  queriedPlanetNames: string[]
  setQueriedPlanetNames: (names: string[]) => void

  identityObservations: string[]
  setIdentityObservations: (obs: string[]) => void

  closeAllPanels: () => void
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

  activePanel: null,
  setActivePanel: (panel) => set({ activePanel: panel }),
  closeAllPanels: () => set({ activePanel: null }),



  claimData: null,
  setClaimData: (data) => set({ claimData: data }),
  showClaimPulse: false,
  setShowClaimPulse: (v) => set({ showClaimPulse: v }),
  hoveredRepo: null,
  setHoveredRepo: (repo) => set({ hoveredRepo: repo }),
  hoveredRepoSummary: null,
  setHoveredRepoSummary: (summary) => set({ hoveredRepoSummary: summary }),

  queriedPlanetNames: [],
  setQueriedPlanetNames: (names: string[]) => set({ queriedPlanetNames: names }),

  identityObservations: [],
  setIdentityObservations: (obs) => set({ identityObservations: obs }),
}))

export const useIsAnyPanelOpen = () => {
  return useUniverseStore((s) => s.activePanel !== null)
}
