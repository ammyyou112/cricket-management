import { create } from 'zustand';
import { User, PlayerStats, Match } from '../types/database.types';

interface PlayerStore {
    currentPlayer: User | null;
    playerStats: PlayerStats[] | null;
    matchHistory: Match[];
    isLoading: boolean;

    setPlayer: (player: User | null) => void;
    setStats: (stats: PlayerStats[] | null) => void;
    setMatchHistory: (matches: Match[]) => void;
    updatePlayer: (data: Partial<User>) => void;
    setLoading: (isLoading: boolean) => void;
}

export const usePlayerStore = create<PlayerStore>((set) => ({
    currentPlayer: null,
    playerStats: null,
    matchHistory: [],
    isLoading: false,

    setPlayer: (player) => set({ currentPlayer: player }),
    setStats: (stats) => set({ playerStats: stats }),
    setMatchHistory: (matches) => set({ matchHistory: matches }),
    updatePlayer: (data) =>
        set((state) => ({
            currentPlayer: state.currentPlayer
                ? { ...state.currentPlayer, ...data }
                : null,
        })),
    setLoading: (isLoading) => set({ isLoading }),
}));
