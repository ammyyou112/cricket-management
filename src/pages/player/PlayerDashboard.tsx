import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerStats, useMyTeams } from '../../hooks/usePlayer';
import { useUpcomingMatches } from '../../hooks/useMatch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { Activity, Calendar, Trophy, Users, TrendingUp } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const PlayerDashboard = () => {
    const { user } = useAuth();
    const { data: stats, isLoading: statsLoading } = usePlayerStats(user?.id);
    const { data: teams, isLoading: teamsLoading } = useMyTeams(user?.id);
    const { data: upcomingMatches, isLoading: matchesLoading } = useUpcomingMatches();

    if (!user) return null;

    // Simple aggregation for dashboard stats (mocking real aggregation logic)
    const totalRuns = stats?.reduce((acc, curr) => acc + (curr.runs_scored || 0), 0) || 0;
    const totalWickets = stats?.reduce((acc, curr) => acc + (curr.wickets_taken || 0), 0) || 0;
    const matchesPlayed = stats?.length || 0;

    // Prepare chart data from recent 5 stats entries
    const chartData = stats?.slice(0, 5).map((s, i) => ({
        name: `Match ${i + 1}`, // In real app, date or opponent name
        runs: s.runs_scored || 0,
        wickets: s.wickets_taken || 0
    })) || [];

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
                        {statsLoading ? (
                            <Skeleton className="h-8 w-1/2" />
                        ) : (
                            <div className="text-2xl font-bold">{matchesPlayed}</div>
                        )}
                        <p className="text-xs text-muted-foreground">Lifetime career stats</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-1/2" />
                        ) : (
                            <div className="text-2xl font-bold">{totalRuns}</div>
                        )}
                        <p className="text-xs text-muted-foreground">Across all formats</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Wickets</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {statsLoading ? (
                            <Skeleton className="h-8 w-1/2" />
                        ) : (
                            <div className="text-2xl font-bold">{totalWickets}</div>
                        )}
                        <p className="text-xs text-muted-foreground">Stumps are flying</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">My Teams</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {teamsLoading ? (
                            <Skeleton className="h-8 w-full" />
                        ) : (
                            <div className="text-2xl font-bold">{teams?.length || 0}</div>
                        )}
                        <p className="text-xs text-muted-foreground">Current active squads</p>
                    </CardContent>
                </Card>
            </div>

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
                        {statsLoading ? (
                            <Skeleton className="h-[240px] w-full" />
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
                        {matchesLoading ? (
                            <div className="space-y-4">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : upcomingMatches && upcomingMatches.length > 0 ? (
                            <div className="space-y-6">
                                {upcomingMatches.slice(0, 3).map((match: any) => (
                                    <div key={match.id} className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium leading-none">
                                                {match.team_a?.team_name} vs {match.team_b?.team_name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {match.venue} • {new Date(match.match_date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Badge variant="secondary">{match.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No upcoming matches scheduled.</p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PlayerDashboard;
