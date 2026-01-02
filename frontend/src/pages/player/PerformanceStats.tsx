import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerStats } from '../../hooks/usePlayer';
import { useTournaments } from '../../hooks/useTournament';
import { useFilteredStats } from '../../hooks/useFilteredStats';
import { StatsFilters, StatsFilterCriteria } from '../../components/player/StatsFilters';
import { RecentForm } from '../../components/player/RecentForm';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Activity, Trophy, TrendingUp, BarChart2 } from 'lucide-react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer
} from 'recharts';

const PerformanceStats = () => {
    const { user } = useAuth();
    const { data: stats, isLoading } = usePlayerStats(user?.id);
    const { data: tournaments } = useTournaments();
    const [filters, setFilters] = useState<StatsFilterCriteria>({});
    
    // Use filtered stats hook
    const { filteredStats, aggregates } = useFilteredStats(stats, filters);
    
    const isFilterActive = Object.keys(filters).some(key => {
        const value = filters[key as keyof StatsFilterCriteria];
        return value !== undefined && value !== null && value !== '';
    });

    // Export to CSV function
    const handleExportCSV = () => {
        if (!filteredStats || filteredStats.length === 0) return;

        const headers = ['Match Date', 'Runs', 'Wickets', 'Catches', 'Venue'];
        const rows = filteredStats.map(stat => {
            const match = (stat as any).matches;
            return [
                match?.match_date ? new Date(match.match_date).toLocaleDateString() : 'N/A',
                stat.runs_scored || 0,
                stat.wickets_taken || 0,
                stat.catches || 0,
                match?.venue || 'N/A'
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `player-stats-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return <div className="space-y-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-96 w-full" />
        </div>;
    }

    // Use filtered aggregates
    const {
        totalRuns,
        totalWickets,
        matchCount: matchesPlayed,
        battingAverage,
        highestScore,
        bestBowling,
        fifties,
        hundreds,
        threePlusWickets
    } = aggregates;

    // Chart Data from filtered stats
    const chartData = filteredStats.map((s, i) => ({
        name: `M${i + 1}`,
        runs: s.runs_scored || 0,
        wickets: s.wickets_taken || 0,
    }));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Performance Stats</h1>
                <p className="text-muted-foreground">Detailed analytics of your cricketing journey.</p>
            </div>

            {/* Stats Filters */}
            <StatsFilters
                tournaments={tournaments || []}
                onFilterChange={setFilters}
                onExport={handleExportCSV}
                isFilterActive={isFilterActive}
            />

            {/* Filter Status */}
            {isFilterActive && (
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    Showing <span className="font-semibold text-foreground">{filteredStats.length}</span> of{' '}
                    <span className="font-semibold text-foreground">{stats?.length || 0}</span> matches
                </div>
            )}

            {/* Recent Form - Show for all-time or filtered stats */}
            {filteredStats.length > 0 && (
                <RecentForm recentMatches={filteredStats} limit={5} />
            )}

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Batting Average</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{battingAverage}</div>
                        <p className="text-xs text-muted-foreground">Runs per match</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Highest Score</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{highestScore}</div>
                        <p className="text-xs text-muted-foreground">Best batting inning</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Best Bowling</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{bestBowling} Wkts</div>
                        <p className="text-xs text-muted-foreground">Best bowling inning</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Matches</CardTitle>
                        <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{matchesPlayed}</div>
                        <p className="text-xs text-muted-foreground">Total appearances</p>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="batting" className="w-full">
                <TabsList>
                    <TabsTrigger value="batting">Batting Form</TabsTrigger>
                    <TabsTrigger value="bowling">Bowling Form</TabsTrigger>
                </TabsList>
                <TabsContent value="batting" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Run Scoring History</CardTitle>
                            <CardDescription>Runs scored in recent matches.</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <RechartsTooltip />
                                        <Line type="monotone" dataKey="runs" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="bowling" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Wicket Taking History</CardTitle>
                            <CardDescription>Wickets taken in recent matches.</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <div className="h-[350px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <RechartsTooltip />
                                        <Bar dataKey="wickets" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Career Best Table/List (Optional extra detail) */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Milestones</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">50s Scored</span>
                                <span className="font-bold">{fifties}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">100s Scored</span>
                                <span className="font-bold">{hundreds}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">3+ Wicket Hauls</span>
                                <span className="font-bold">{threePlusWickets}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default PerformanceStats;
