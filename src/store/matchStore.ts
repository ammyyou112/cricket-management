import { create } from 'zustand';
import { Match, MatchScore } from '../types/database.types';

interface MatchStore {
    upcomingMatches: Match[];
    liveMatches: Match[];
    currentMatch: Match | null;
    liveScore: MatchScore | null;
    isLoading: boolean;

    setUpcomingMatches: (matches: Match[]) => void;
    setLiveMatches: (matches: Match[]) => void;
    setCurrentMatch: (match: Match | null) => void;
    setLiveScore: (score: MatchScore | null) => void;
    updateLiveScore: (scoreUpdate: Partial<MatchScore>) => void;
    setLoading: (isLoading: boolean) => void;
}

export const useMatchStore = create<MatchStore>((set) => ({
    upcomingMatches: [],
    liveMatches: [],
    currentMatch: null,
    liveScore: null,
    isLoading: false,

    setUpcomingMatches: (matches) => set({ upcomingMatches: matches }),
    setLiveMatches: (matches) => set({ liveMatches: matches }),
    setCurrentMatch: (match) => set({ currentMatch: match }),
    setLiveScore: (score) => set({ liveScore: score }),

    updateLiveScore: (scoreUpdate) =>
        set((state) => ({
            liveScore: state.liveScore
                ? { ...state.liveScore, ...scoreUpdate }
                : null,
        })),

    setLoading: (isLoading) => set({ isLoading }),
}));
