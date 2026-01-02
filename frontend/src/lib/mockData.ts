/**
 * Mock Data for Frontend Testing
 * All data is generated for testing purposes without backend
 */

import { User, UserRole, PlayerType, Team, TeamMember, Tournament, Match, MatchScore, PlayerStats, TournamentStatus, MatchStatus } from '../types/database.types';

// Enable mock mode for frontend testing
export const MOCK_MODE = true; // Set to false to use real API calls

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'player@test.com',
    full_name: 'John Player',
    role: 'player',
    player_type: 'batsman',
    phone: '+1234567890',
    profile_picture: undefined,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'captain@test.com',
    full_name: 'Mike Captain',
    role: 'captain',
    phone: '+1234567891',
    profile_picture: undefined,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'admin@test.com',
    full_name: 'Admin User',
    role: 'admin',
    phone: '+1234567892',
    profile_picture: undefined,
    created_at: new Date().toISOString(),
  },
  {
    id: '4',
    email: 'player2@test.com',
    full_name: 'Sarah Batter',
    role: 'player',
    player_type: 'all-rounder',
    phone: '+1234567893',
    profile_picture: undefined,
    created_at: new Date().toISOString(),
  },
];

// Mock Teams
export const mockTeams: Team[] = [
  {
    id: '1',
    team_name: 'Lions Cricket Club',
    description: 'A competitive cricket team with a rich history',
    logo_url: null,
    captain_id: '2',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    team_name: 'Eagles United',
    description: 'Rising stars of local cricket',
    logo_url: null,
    captain_id: '2',
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    team_name: 'Thunder Bolts',
    description: 'Fast and fierce on the field',
    logo_url: null,
    captain_id: '2',
    created_at: new Date().toISOString(),
  },
];

// Mock Tournaments
export const mockTournaments: Tournament[] = [
  {
    id: '1',
    tournament_name: 'Summer Championship 2024',
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ongoing',
    created_by: '3',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    tournament_name: 'Winter League',
    start_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'upcoming',
    created_by: '3',
    created_at: new Date().toISOString(),
  },
];

// Mock Matches
export const mockMatches: Match[] = [
  {
    id: '1',
    tournament_id: '1',
    team_a_id: '1',
    team_b_id: '2',
    match_date: new Date().toISOString(),
    venue: 'Central Cricket Ground',
    status: 'live',
    winner_team_id: undefined,
    scoring_captain_id: '2',
    approved_by_captain_id: undefined,
  },
  {
    id: '2',
    tournament_id: '1',
    team_a_id: '1',
    team_b_id: '3',
    match_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Stadium Park',
    status: 'scheduled',
    winner_team_id: undefined,
    scoring_captain_id: '2',
    approved_by_captain_id: undefined,
  },
  {
    id: '3',
    tournament_id: '1',
    team_a_id: '2',
    team_b_id: '3',
    match_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    venue: 'Old Ground',
    status: 'completed',
    winner_team_id: '2',
    scoring_captain_id: '2',
    approved_by_captain_id: '2',
  },
];

// Mock Match Scores
export const mockMatchScores: MatchScore[] = [
  {
    id: '1',
    match_id: '1',
    batting_team_id: '1',
    total_runs: 150,
    total_wickets: 3,
    total_overs: 15.2,
    extras: 10,
  },
  {
    id: '2',
    match_id: '1',
    batting_team_id: '2',
    total_runs: 120,
    total_wickets: 5,
    total_overs: 14.0,
    extras: 8,
  },
];

// Mock Player Stats
export const mockPlayerStats: PlayerStats[] = [
  {
    id: '1',
    player_id: '1',
    match_id: '3',
    runs_scored: 45,
    wickets_taken: 2,
    catches: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    player_id: '1',
    match_id: '1',
    runs_scored: 32,
    wickets_taken: 1,
    catches: 0,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    player_id: '4',
    match_id: '3',
    runs_scored: 67,
    wickets_taken: 0,
    catches: 2,
    created_at: new Date().toISOString(),
  },
];

// Mock Team Members
export const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    team_id: '1',
    player_id: '1',
    status: 'active',
    joined_at: new Date().toISOString(),
    is_temporary: false,
  },
  {
    id: '2',
    team_id: '1',
    player_id: '4',
    status: 'active',
    joined_at: new Date().toISOString(),
    is_temporary: false,
  },
  {
    id: '3',
    team_id: '1',
    player_id: '2',
    status: 'active',
    joined_at: new Date().toISOString(),
    is_temporary: false,
  },
];

// Helper to get mock user by role
export const getMockUserByRole = (role: UserRole): User => {
  const user = mockUsers.find(u => u.role === role);
  return user || mockUsers[0];
};

// Helper to delay responses (simulate network)
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

