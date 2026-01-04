/**
 * Cricket 360 - API Types
 * TypeScript interfaces matching the backend API responses
 */

// Enums matching backend
export type UserRole = 'PLAYER' | 'CAPTAIN' | 'ADMIN';
export type PlayerType = 'BATSMAN' | 'BOWLER' | 'ALL_ROUNDER' | 'WICKET_KEEPER';
export type TeamMemberStatus = 'ACTIVE' | 'PENDING' | 'INVITED' | 'REJECTED';
export type TournamentStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
export type MatchType = 'LEAGUE' | 'KNOCKOUT' | 'FRIENDLY';

// Base API Response
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

// Paginated Response
export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth Response
export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

// User
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  playerType?: PlayerType;
  profilePictureUrl?: string;
  phone?: string;
  city?: string;
  locationLatitude?: number; // ✅ Added for location-based features
  locationLongitude?: number; // ✅ Added for location-based features
  createdAt: string;
  updatedAt: string;
}

// Team
export interface Team {
  id: string;
  name: string;
  teamName?: string; // Backend uses teamName
  captainId: string;
  logoUrl?: string;
  description?: string;
  city?: string;
  createdAt: string;
  updatedAt: string;
  captain?: User;
  members?: TeamMember[];
  _count?: {
    members: number;
  };
}

// Team Member
export interface TeamMember {
  id: string;
  teamId: string;
  playerId: string;
  status: TeamMemberStatus;
  isTemporary: boolean;
  roleInTeam?: string;
  joinedAt?: string;
  createdAt: string;
  user?: User;
  player?: User;
}

// Tournament
export interface Tournament {
  id: string;
  name?: string;
  tournamentName: string; // Backend uses tournamentName
  description?: string;
  startDate: string;
  endDate: string;
  status: TournamentStatus;
  createdBy: string;
  location?: string;
  createdAt: string;
  updatedAt: string;
  matches?: Match[];
  _count?: {
    matches: number;
  };
}

// Match
export interface Match {
  id: string;
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  venue: string;
  matchDate: string;
  matchType?: MatchType;
  status: MatchStatus;
  scoringCaptainId?: string;
  approvedByCaptainId?: string;
  winnerTeamId?: string;
  createdAt: string;
  updatedAt: string;
  teamA?: Team;
  teamB?: Team;
  tournament?: Tournament;
  scores?: MatchScore[];
  playerStats?: PlayerStat[];
}

// Match Score
export interface MatchScore {
  id: string;
  matchId: string;
  battingTeamId: string;
  totalRuns: number;
  totalWickets: number;
  totalOvers: number;
  extrasWide?: number;
  extrasNoball?: number;
  extrasBye?: number;
  extrasLegbye?: number;
  inningsNumber: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Player Stat
export interface PlayerStat {
  id: string;
  playerId: string;
  matchId: string;
  teamId: string;
  runsScored: number;
  ballsFaced: number;
  fours: number;
  sixes: number;
  wicketsTaken: number;
  oversBowled: number;
  runsConceded: number;
  catches: number;
  runOuts: number;
  stumpings: number;
  createdAt: string;
  player?: User;
}

// Create/Update DTOs
export interface CreateTeamInput {
  name: string;
  description?: string;
  city?: string;
  logoUrl?: string;
  locationLatitude?: number;
  locationLongitude?: number;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  logoUrl?: string;
}

export interface CreateMatchInput {
  tournamentId?: string;
  teamAId: string;
  teamBId: string;
  venue: string;
  matchDate: string;
  matchType: MatchType;
  status: MatchStatus; // ✅ REQUIRED - Backend validation requires this field
}

export interface UpdateMatchScoreInput {
  teamAScore?: {
    runs: number;
    wickets: number;
    overs: number;
    extrasWide?: number;
    extrasNoball?: number;
    extrasBye?: number;
    extrasLegbye?: number;
    inningsNumber?: number;
  };
  teamBScore?: {
    runs: number;
    wickets: number;
    overs: number;
    extrasWide?: number;
    extrasNoball?: number;
    extrasBye?: number;
    extrasLegbye?: number;
    inningsNumber?: number;
  };
}

export interface AddPlayerStatInput {
  playerId: string;
  runs?: number;
  ballsFaced?: number;
  fours?: number;
  sixes?: number;
  wickets?: number;
  oversBowled?: number;
  runsConceded?: number;
  catches?: number;
  runOuts?: number;
  stumpings?: number;
}

export interface CreateTournamentInput {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
}

export interface UpdateTournamentInput {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: TournamentStatus;
}

