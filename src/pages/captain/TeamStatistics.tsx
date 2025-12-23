import { useAuth } from '../../hooks/useAuth';
import { useMyTeams, useTeamStats } from '../../hooks/useTeam'; // Assuming useTeamStats is available or we create it
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Trophy, TrendingUp, Users, Target } from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell
} from 'recharts';

const TeamStatistics = () => {
    const { user } = useAuth();
    const { data: myTeams } = useMyTeams(user?.id);
    const captainTeam = myTeams?.find(t => t.captain_id === user?.id);

    // Note: useTeamStats in `api/stats.ts` returns 'match_scores' array.
    // We need to fetch and process this data.
    // Assuming the hook returns array of MatchScore objects joined with match details if possible.
    const { data: teamStats, isLoading } = useTeamStats(captainTeam?.id);

    if (!captainTeam) return <div className="p-8">No team found.</div>;
    if (isLoading) return <Skeleton className="h-[500px] w-full" />;

    // --- Data Processing (Mock logic for missing backend aggregations) ---
    // In a real app, these should come from a view or specific API endpoint

    const matchesPlayed = teamStats?.length || 0;
    // Mocking wins/losses based on 'winner_team_id' which should be in match object
    // Since api/stats.ts currently returns raw MatchScore, we might miss the 'match' detail with winner_team_id
    // For this UI demo, I will simulate some aggregations or basic counts from score data

    const totalRuns = teamStats?.reduce((acc: number, curr: any) => acc + (curr.total_runs || 0), 0) || 0;
    const totalWickets = teamStats?.reduce((acc: number, curr: any) => acc + (curr.total_wickets || 0), 0) || 0;

    // Chart Data Preparation
    const performanceData = teamStats?.map((score: any, index: number) => ({
        match: `M${index + 1}`,
        runs: score.total_runs || 0,
        wickets: score.total_wickets || 0
    })) || [];

    const pieData = [
        { name: 'Wins', value: 0 },
        { name: 'Losses', value: 0 },
        { name: 'Draws', value: 0 },
    ]; // Placeholder as we can't determine Result from just MatchScore without Match entity join

    const COLORS = ['#10b981', '#ef4444', '#f59e0b'];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Team Analytics</h1>
                <p className="text-muted-foreground">Performance metrics for {captainTeam.team_name}.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Matches Played</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{matchesPlayed}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalRuns}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Wickets</CardTitle>
                        <Target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalWickets}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
                        {/* Placeholder */}
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--%</div>
                        <p className="text-xs text-muted-foreground">Requires Match Result Data</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Score Trend Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Score Progression</CardTitle>
                        <CardDescription>Runs scored per match this season.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="match" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <RechartsTooltip />
                                    <Line type="monotone" dataKey="runs" stroke="hsl(var(--primary))" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Match Outcomes Pie Chart (Static Placeholder until data join) */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Match Results</CardTitle>
                        <CardDescription>Win/Loss distribution.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <div className="h-[300px] w-full flex items-center justify-center text-muted-foreground bg-muted/20 rounded-lg">
                            Chart requires match outcomes
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Top Performers (Mock data structure as player performance aggregation is complex on client side) */}
            <Card>
                <CardHeader>
                    <CardTitle>Top Performers</CardTitle>
                    <CardDescription>Leading run scorers and wicket takers.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="batting">
                        <TabsList>
                            <TabsTrigger value="batting">Batting</TabsTrigger>
                            <TabsTrigger value="bowling">Bowling</TabsTrigger>
                        </TabsList>
                        <TabsContent value="batting">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Player</TableHead>
                                        <TableHead className="text-right">Matches</TableHead>
                                        <TableHead className="text-right">Runs</TableHead>
                                        <TableHead className="text-right">Avg</TableHead>
                                        <TableHead className="text-right">SR</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {/* Placeholder Rows */}
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            Player stats aggregation pending backend support.
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TabsContent>
                        <TabsContent value="bowling">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Player</TableHead>
                                        <TableHead className="text-right">Matches</TableHead>
                                        <TableHead className="text-right">Wickets</TableHead>
                                        <TableHead className="text-right">Avg</TableHead>
                                        <TableHead className="text-right">Econ</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                            Player stats aggregation pending backend support.
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
};

export default TeamStatistics;
