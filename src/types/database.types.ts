export type UserRole = 'player' | 'captain' | 'admin';
export type PlayerType = 'batsman' | 'bowler' | 'all-rounder' | 'wicket-keeper';
export type TeamMemberStatus = 'active' | 'pending' | 'invited';
export type TournamentStatus = 'upcoming' | 'ongoing' | 'completed';
export type MatchStatus = 'scheduled' | 'live' | 'completed';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  profile_picture?: string;
  phone?: string;
  player_type?: PlayerType;
  created_at: string;
}

export interface Team {
  id: string;
  team_name: string;
  captain_id: string;
  logo_url?: string;
  description?: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  player_id: string;
  status: TeamMemberStatus;
  is_temporary: boolean;
  joined_at: string;
}

export interface Tournament {
  id: string;
  tournament_name: string;
  start_date: string;
  end_date: string;
  created_by: string;
  status: TournamentStatus;
  created_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  team_a_id: string;
  team_b_id: string;
  venue: string;
  match_date: string;
  scoring_captain_id: string;
  approved_by_captain_id?: string;
  status: MatchStatus;
  winner_team_id?: string;
}

export interface MatchScore {
  id: string;
  match_id: string;
  batting_team_id: string;
  total_runs: number;
  total_wickets: number;
  total_overs: number;
  extras: number;
}

export interface PlayerStats {
  id: string;
  player_id: string;
  match_id: string;
  runs_scored: number;
  wickets_taken: number;
  catches: number;
  created_at: string;
}
