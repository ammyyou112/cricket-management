import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { teamService } from '../../services/team.service';
import { matchService } from '../../services/match.service';
import { tournamentService } from '../../services/tournament.service';
import * as playerApi from '../../lib/api/players';
import { RecentForm } from '../../components/player/RecentForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Activity, Calendar, Trophy, Users, TrendingUp } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';
import type { Team, Match, Tournament, PaginatedResponse } from '../../types/api.types';

const PlayerDashboard = () => {
    const { user } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPlayerData = async () => {
            try {
                setLoading(true);
                setError(null);

                if (!user?.id) return;

                // Player sees their teams + upcoming matches
                const [teamsRes, matchesRes, tournamentsRes, statsRes] = await Promise.all([
                    teamService.getMyTeams(), // Player's teams
                    matchService.getAll({ page: 1, limit: 50, status: 'SCHEDULED' }), // Upcoming
                    tournamentService.getAll({ page: 1, limit: 10, status: 'ONGOING' }),
                    playerApi.getPlayerStats(user.id),
                ]);

                console.log('✅ Player data loaded:', { teamsRes, matchesRes, tournamentsRes, statsRes });

                // Handle different response formats
                const teamsData = Array.isArray(teamsRes) ? teamsRes : (teamsRes?.data || (teamsRes as PaginatedResponse<Team>)?.data || []);
                const matchesData = Array.isArray(matchesRes) ? matchesRes : (matchesRes?.data || (matchesRes as PaginatedResponse<Match>)?.data || []);
                const tournamentsData = Array.isArray(tournamentsRes) ? tournamentsRes : (tournamentsRes?.data || (tournamentsRes as PaginatedResponse<Tournament>)?.data || []);

                setTeams(teamsData);
                setMatches(matchesData);
                setTournaments(tournamentsData);

                if (statsRes.error) {
                    console.warn('Stats fetch error:', statsRes.error);
                    setStats([]);
                } else {
                    setStats(statsRes.data || []);
                }

            } catch (err: any) {
                console.error('❌ Failed to load player data:', err);
                setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchPlayerData();
    }, [user?.id]);

    if (!user) return null;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading player dashboard...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center max-w-md">
                    <div className="text-red-600 text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">Failed to Load Dashboard</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Simple aggregation for dashboard stats
    const totalRuns = stats?.reduce((acc, curr) => acc + (curr.runs_scored || curr.runsScored || 0), 0) || 0;
    const totalWickets = stats?.reduce((acc, curr) => acc + (curr.wickets_taken || curr.wicketsTaken || 0), 0) || 0;
    const matchesPlayed = stats?.length || 0;

    // Prepare chart data from recent 5 stats entries
    const chartData = stats?.slice(0, 5).map((s, i) => ({
        name: `Match ${i + 1}`, // In real app, date or opponent name
        runs: s.runs_scored || s.runsScored || 0,
        wickets: s.wickets_taken || s.wicketsTaken || 0
    })) || [];

    // Filter upcoming matches - get matches where user's teams are involved
    const userTeamIds = teams.map(t => t.id);
    const upcomingMatches = matches
      .filter(m => 
        m.status === 'SCHEDULED' && 
        (userTeamIds.includes(m.teamAId) || userTeamIds.includes(m.teamBId))
      )
      .sort((a, b) => new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime());

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back, {user.full_name}. Here's what's happening.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button asChild>
                        <Link to="/player/matches">View Schedule</Link>
                    </Button>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Quick Stats Cards */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Matches Played</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{matchesPlayed}</div>
                        <p className="text-xs text-muted-foreground">Lifetime career stats</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRuns}</div>
                        <p className="text-xs text-muted-foreground">Across all formats</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Wickets</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalWickets}</div>
                        <p className="text-xs text-muted-foreground">Stumps are flying</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Teams</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{teams.length}</div>
                        <p className="text-xs text-muted-foreground">Current active squads</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Form Section */}
            {stats && stats.length > 0 && (
                <RecentForm recentMatches={stats} limit={5} />
            )}

            {/* Secondary Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Performance Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Performance</CardTitle>
                        <CardDescription>
                            Runs scored in your last {chartData.length} matches.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        {chartData.length === 0 ? (
                            <div className="flex items-center justify-center h-[240px] text-muted-foreground">
                                <p>No match data available</p>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={240}>
                                <BarChart data={chartData}>
                                    <XAxis
                                        dataKey="name"
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#888888"
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value: number) => `${value}`}
                                    />
                                    <Bar
                                        dataKey="runs"
                                        fill="currentColor"
                                        radius={[4, 4, 0, 0]}
                                        className="fill-primary"
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Upcoming Matches & Teams List */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Upcoming Matches</CardTitle>
                        <CardDescription>
                            Your schedule for the season.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {upcomingMatches.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No upcoming matches scheduled.</p>
                        ) : (
                            <div className="space-y-6">
                                {upcomingMatches.slice(0, 3).map((match: Match) => (
                                    <Link 
                                        key={match.id} 
                                        to={`/matches/${match.id}`}
                                        className="block"
                                    >
                                        <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-colors cursor-pointer">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none">
                                                    {match.teamA?.teamName || match.teamA?.name || 'Team A'} vs {match.teamB?.teamName || match.teamB?.name || 'Team B'}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {match.venue} • {new Date(match.matchDate).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge variant="secondary">{match.status}</Badge>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PlayerDashboard;
