import { z } from 'zod';

// Team Form
export const teamFormSchema = z.object({
    team_name: z.string().min(3, 'Team name must be at least 3 characters'),
    logo_url: z.string().url('Invalid URL').optional().or(z.literal('')),
    description: z.string().optional(),
});

export type TeamFormData = z.infer<typeof teamFormSchema>;

// Tournament Form
export const tournamentFormSchema = z.object({
    tournament_name: z.string().min(5, 'Tournament name must be at least 5 characters'),
    start_date: z.string(),
    end_date: z.string(),
    status: z.enum(['upcoming', 'ongoing', 'completed']),
}).refine((data) => new Date(data.start_date) <= new Date(data.end_date), {
    message: "End date must be after start date",
    path: ["end_date"],
});

export type TournamentFormData = z.infer<typeof tournamentFormSchema>;

// Match Form
export const matchFormSchema = z.object({
    tournament_id: z.string().min(1, 'Tournament is required'),
    team_a_id: z.string().min(1, 'Team A is required'),
    team_b_id: z.string().min(1, 'Team B is required'),
    venue: z.string().min(3, 'Venue is required'),
    match_date: z.string(),
    status: z.enum(['scheduled', 'live', 'completed']),
}).refine((data) => data.team_a_id !== data.team_b_id, {
    message: "Teams must be different",
    path: ["team_b_id"],
});

export type MatchFormData = z.infer<typeof matchFormSchema>;

// Profile Form
export const profileFormSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    player_type: z.enum(['batsman', 'bowler', 'all-rounder', 'wicket-keeper']).optional(),
    profile_picture: z.string().url().optional().or(z.literal('')),
});

export type ProfileFormData = z.infer<typeof profileFormSchema>;

// Scoring Form
export const scoringFormSchema = z.object({
    batting_team_id: z.string().min(1, 'Batting team is required'),
    total_runs: z.coerce.number().min(0),
    total_wickets: z.coerce.number().min(0).max(10),
    total_overs: z.coerce.number().min(0),
    extras: z.coerce.number().min(0),
});

export type ScoringFormData = z.infer<typeof scoringFormSchema>;
