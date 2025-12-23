import { useParams } from 'react-router-dom';
import { usePlayerProfile, usePlayerStats, useMatchHistory } from '../../hooks/usePlayer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Skeleton } from '../../components/ui/skeleton';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { Trophy, TrendingUp, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const PlayerProfileView = () => {
    const { playerId } = useParams<{ playerId: string }>();

    // Fetch data using hooks with the specific playerId
    const { data: profile, isLoading: profileLoading } = usePlayerProfile(playerId);
    const { data: stats, isLoading: statsLoading } = usePlayerStats(playerId);
    const { data: matches, isLoading: matchesLoading } = useMatchHistory(playerId);

    if (profileLoading || statsLoading) {
        return (
            <div className="space-y-8 max-w-5xl mx-auto">
                <div className="flex items-center space-x-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-32" />
                    </div>
                </div>
                <Skeleton className="h-96 w-full" />
            </div>
        );
    }

    if (!profile) {
        return <div className="text-center py-10">Player not found.</div>;
    }

    // Process stats for visualization
    const chartData = matches?.slice(0, 10).reverse().map((match, index) => ({
        match: `M${index + 1}`,
        runs: match.runs_scored || 0,
        wickets: match.wickets_taken || 0,
        date: format(new Date(match.match_date), 'MMM dd')
    })) || [];

    // Aggregate summary stats if not provided directly by usePlayerStats
    // Assuming usePlayerStats returns an object with aggregated fields, or we calculate from stats array
    // Based on previous files, stats might be an array of match scores. Let's handle both.
    const totalRuns = Array.isArray(stats)
        ? stats.reduce((acc: number, curr: any) => acc + (curr.runs_scored || 0), 0)
        : stats?.total_runs || 0;

    const totalWickets = Array.isArray(stats)
        ? stats.reduce((acc: number, curr: any) => acc + (curr.wickets_taken || 0), 0)
        : stats?.total_wickets || 0;

    const matchesPlayed = Array.isArray(stats) ? stats.length : stats?.matches_played || matches?.length || 0;

    return (
        <div className="space-y-8 max-w-5xl mx-auto pb-10">
            {/* Profile Header */}
            <Card className="border-none bg-muted/30">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                            <AvatarImage src={profile.profile_picture} />
                            <AvatarFallback className="text-4xl">{profile.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="text-center md:text-left space-y-2">
                            <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                                <Badge variant="secondary" className="text-sm px-3 py-1 capitalize">
                                    {profile.player_type?.replace('-', ' ') || 'Player'}
                                </Badge>
                                <Badge variant="outline" className="text-sm px-3 py-1 capitalize">
                                    {profile.role || 'Member'}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground max-w-lg">
                                {profile.bio || `Passionate cricketer playing as a ${profile.player_type?.replace('-', ' ')}.`}
                            </p>
                        </div>

                        {/* Quick Stats Summary */}
                        <div className="md:ml-auto grid grid-cols-3 gap-6 text-center">
                            <div>
                                <div className="text-2xl font-bold">{matchesPlayed}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Matches</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{totalRuns}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Runs</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{totalWickets}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-wider">Wickets</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="stats">Analytics</TabsTrigger>
                    <TabsTrigger value="teams">Teams</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Recent Performance Chart */}
                        <Card className="col-span-2 md:col-span-1">
                            <CardHeader>
                                <CardTitle>Recent Form</CardTitle>
                                <CardDescription>Run scoring in last 10 matches.</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-0">
                                <div className="h-[250px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis
                                                dataKey="match"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#6b7280', fontSize: 12 }}
                                            />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="runs"
                                                stroke="hsl(var(--primary))"
                                                strokeWidth={3}
                                                dot={{ r: 4, fill: 'hsl(var(--primary))' }}
                                                activeDot={{ r: 6 }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Matches List */}
                        <Card className="col-span-2 md:col-span-1">
                            <CardHeader>
                                <CardTitle>Recent Matches</CardTitle>
                                <CardDescription>Latest match results.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {matchesLoading ? (
                                    <Skeleton className="h-40 w-full" />
                                ) : matches && matches.length > 0 ? (
                                    <div className="space-y-4">
                                        {matches.slice(0, 5).map((match: any) => (
                                            <div key={match.id} className="flex items-center justify-between border-b last:border-0 pb-3 last:pb-0">
                                                <div>
                                                    <div className="font-medium text-sm">vs {match.opponent_team_name || 'Opponent'}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {format(new Date(match.match_date), 'MMM dd, yyyy')}
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-sm font-bold">
                                                        {match.runs_scored} runs / {match.wickets_taken} wkt
                                                    </div>
                                                    <Badge variant={match.result === 'won' ? 'default' : 'secondary'} className="text-[10px] h-5">
                                                        {match.result || 'Played'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground">No matches played yet.</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Stats Tab */}
                <TabsContent value="stats" className="space-y-6 mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Batting vs Bowling</CardTitle>
                            <CardDescription>Performance breakdown per match.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="match" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                                        <YAxis yAxisId="left" orientation="left" stroke="#8884d8" axisLine={false} tickLine={false} />
                                        <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" axisLine={false} tickLine={false} />
                                        <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Bar yAxisId="left" dataKey="runs" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Runs" />
                                        <Bar yAxisId="right" dataKey="wickets" fill="#82ca9d" radius={[4, 4, 0, 0]} name="Wickets" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Teams Tab */}
                <TabsContent value="teams" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Placeholder as current API might not return teams for arbitrary player ID easily without backend support */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Current Teams</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/10">
                                    <div className="h-10 w-10 rounded bg-primary/20 flex items-center justify-center font-bold text-primary">
                                        T
                                    </div>
                                    <div>
                                        <div className="font-medium">Team Info Unavailable</div>
                                        <div className="text-sm text-muted-foreground">
                                            This feature requires updating public API permissions.
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PlayerProfileView;
