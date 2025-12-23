import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTournaments } from '../../hooks/useTournament'; // Assuming exists or create
import { useAvailableTeams } from '../../hooks/useTeam';
import { useLiveMatches } from '../../hooks/useMatch';
import { useQuery } from '@tanstack/react-query';
import * as playerApi from '../../lib/api/players';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Users, Shield, Trophy, Activity, Plus } from 'lucide-react';

const AdminDashboard = () => {
    const { user } = useAuth();

    // Data Fetching for Stats
    // 1. Total Users
    const { data: allPlayers, isLoading: playersLoading } = useQuery({
        queryKey: ['allPlayers'],
        queryFn: playerApi.getAllPlayers
    });

    // 2. Total Teams
    const { data: teams, isLoading: teamsLoading } = useAvailableTeams();

    // 3. Tournaments (Need to import/create hook if not present in summary)
    // Assuming useTournaments returns array of tournaments
    const { data: tournaments, isLoading: tournamentsLoading } = useTournaments(); // Will implement or use generic if missing

    // 4. Live Matches
    const { data: liveMatches, isLoading: matchesLoading } = useLiveMatches();

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">System overview and management.</p>
                </div>
                <div className="flex gap-2">
                    <Button asChild>
                        <Link to="/admin/tournaments/create">
                            <Plus className="mr-2 h-4 w-4" /> New Tournament
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link to="/admin/matches/schedule">
                            <Plus className="mr-2 h-4 w-4" /> Schedule Match
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {playersLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{allPlayers?.length || 0}</div>}
                        <p className="text-xs text-muted-foreground">Registered on platform</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {teamsLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{teams?.length || 0}</div>}
                        <p className="text-xs text-muted-foreground">Active in league</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tournaments</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {tournamentsLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{tournaments?.filter((t: any) => t.status === 'ongoing')?.length || 0}</div>}
                        <p className="text-xs text-muted-foreground">Currently running</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Live Matches</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        {matchesLoading ? <Skeleton className="h-8 w-1/2" /> : <div className="text-2xl font-bold">{liveMatches?.length || 0}</div>}
                        <p className="text-xs text-muted-foreground">Happening now</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Activity / Tournaments List */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Tournaments</CardTitle>
                        <CardDescription>Latest events created.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {tournamentsLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ) : tournaments && tournaments.length > 0 ? (
                            <div className="space-y-4">
                                {tournaments.slice(0, 5).map((t: any) => (
                                    <div key={t.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                        <div>
                                            <div className="font-medium">{t.tournament_name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(t.start_date).toLocaleDateString()} - {new Date(t.end_date).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <Badge>{t.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-muted-foreground">No tournaments found.</div>
                        )}
                    </CardContent>
                    <CardFooter className="border-t p-4 flex justify-end">
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/admin/tournaments">View All</Link>
                        </Button>
                    </CardFooter>
                </Card>

                {/* Quick Actions / System Status */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Admin Actions</CardTitle>
                        <CardDescription>Common tasks.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <Button variant="outline" className="justify-start">
                            <Plus className="mr-2 h-4 w-4" /> Create Announcement
                        </Button>
                        <Button variant="outline" className="justify-start">
                            <Users className="mr-2 h-4 w-4" /> Manage Users
                        </Button>
                        <Button variant="outline" className="justify-start">
                            <Shield className="mr-2 h-4 w-4" /> Manage Teams
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
