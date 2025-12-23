import { create } from 'zustand';
import { Team, TeamMember } from '../types/database.types';

// JoinRequest is essentially a TeamMember with status 'pending'
type JoinRequest = TeamMember;

interface TeamStore {
    myTeams: Team[];
    currentTeam: Team | null;
    teamMembers: TeamMember[];
    joinRequests: JoinRequest[];
    availableTeams: Team[];
    isLoading: boolean;

    setMyTeams: (teams: Team[]) => void;
    setCurrentTeam: (team: Team | null) => void;
    setTeamMembers: (members: TeamMember[]) => void;
    setJoinRequests: (requests: JoinRequest[]) => void;
    setAvailableTeams: (teams: Team[]) => void;
    addTeam: (team: Team) => void;
    removeTeam: (teamId: string) => void;
    setLoading: (isLoading: boolean) => void;
}

export const useTeamStore = create<TeamStore>((set) => ({
    myTeams: [],
    currentTeam: null,
    teamMembers: [],
    joinRequests: [],
    availableTeams: [],
    isLoading: false,

    setMyTeams: (teams) => set({ myTeams: teams }),
    setCurrentTeam: (team) => set({ currentTeam: team }),
    setTeamMembers: (members) => set({ teamMembers: members }),
    setJoinRequests: (requests) => set({ joinRequests: requests }),
    setAvailableTeams: (teams) => set({ availableTeams: teams }),

    addTeam: (team) => set((state) => ({
        myTeams: [team, ...state.myTeams]
    })),

    removeTeam: (teamId) => set((state) => ({
        myTeams: state.myTeams.filter((t) => t.id !== teamId)
    })),

    setLoading: (isLoading) => set({ isLoading }),
}));
