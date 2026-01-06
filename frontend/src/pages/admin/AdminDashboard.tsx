import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { teamService } from '../../services/team.service';
import { matchService } from '../../services/match.service';
import { tournamentService } from '../../services/tournament.service';
import { userService } from '../../services/user.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Users, Shield, Trophy, Activity, Plus } from 'lucide-react';
import type { Team, Match, Tournament, User, PaginatedResponse } from '../../types/api.types';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAdminData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('🔍 Fetching admin dashboard data...');

                // Admin sees ALL data - fetch in parallel
                const [teamsRes, matchesRes, tournamentsRes, usersRes] = await Promise.all([
                    teamService.getAll({ page: 1, limit: 100 }),
                    matchService.getAll({ page: 1, limit: 100 }),
                    tournamentService.getAll({ page: 1, limit: 100 }),
                    userService.getAll({ page: 1, limit: 100 }),
                ]);

                console.log('✅ Raw API responses:', {
                    teamsRes,
                    matchesRes,
                    tournamentsRes,
                    usersRes,
                });

                // Handle paginated responses - backend returns { data: [...], pagination: {...} }
                // apiClient extracts responseData.data, which for paginated responses is the array
                // But we need to check if it's a full PaginatedResponse object or just the array
                const extractData = <T,>(response: any): T[] => {
                    if (Array.isArray(response)) {
                        return response;
                    }
                    // Check if it's a PaginatedResponse object
                    if (response && typeof response === 'object' && 'data' in response && 'pagination' in response) {
                        return Array.isArray(response.data) ? response.data : [];
                    }
                    // Check if it has a data property
                    if (response && typeof response === 'object' && 'data' in response) {
                        return Array.isArray(response.data) ? response.data : [];
                    }
                    return [];
                };

                const teamsData = extractData<Team>(teamsRes);
                const matchesData = extractData<Match>(matchesRes);
                const tournamentsData = extractData<Tournament>(tournamentsRes);
                const usersData = extractData<User>(usersRes);

                console.log('✅ Processed data:', {
                    teams: teamsData.length,
                    matches: matchesData.length,
                    tournaments: tournamentsData.length,
                    users: usersData.length,
                });

                console.log('📋 Tournaments sample:', tournamentsData.slice(0, 3));
                console.log('📋 Teams sample:', teamsData.slice(0, 3));

                setTeams(teamsData);
                setMatches(matchesData);
                setTournaments(tournamentsData);
                setUsers(usersData);

            } catch (err: any) {
                console.error('❌ Failed to load admin data:', err);
                setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchAdminData();
    }, []);

    // Log current state for debugging
    console.log('📊 Current dashboard state:', {
        totalUsers: users.length,
        totalTeams: teams.length,
        totalMatches: matches.length,
        totalTournaments: tournaments.length,
        loading,
        error,
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading admin dashboard...</p>
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

    // Filter live matches (status === 'LIVE')
    const liveMatches = matches.filter((m: Match) => m.status === 'LIVE');
    // Filter ongoing tournaments
    const ongoingTournaments = tournaments.filter((t: Tournament) => t.status === 'ONGOING');

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                    <p className="text-muted-foreground">System overview and management.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
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
                        <div className="text-2xl font-bold">{users.length}</div>
                        <p className="text-xs text-muted-foreground">Registered on platform</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{teams.length}</div>
                        <p className="text-xs text-muted-foreground">Active in league</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Tournaments</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{ongoingTournaments.length}</div>
                        <p className="text-xs text-muted-foreground">Currently running</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Live Matches</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{liveMatches.length}</div>
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
                        {tournaments.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                <p>No tournaments found.</p>
                                <Button asChild variant="outline" size="sm" className="mt-4">
                                    <Link to="/admin/tournaments/create">Create First Tournament</Link>
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tournaments
                                    .sort((a, b) => {
                                        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : new Date(a.startDate).getTime();
                                        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : new Date(b.startDate).getTime();
                                        return dateB - dateA; // Most recent first
                                    })
                                    .slice(0, 5)
                                    .map((t: Tournament) => (
                                        <Link key={t.id} to={`/admin/tournaments/${t.id}`} className="block">
                                            <div className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 cursor-pointer hover:bg-muted/50 p-2 rounded transition-colors">
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-medium truncate">{t.tournamentName || t.name || 'Unnamed Tournament'}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {t.startDate && t.endDate ? (
                                                            <>
                                                                {new Date(t.startDate).toLocaleDateString()} - {new Date(t.endDate).toLocaleDateString()}
                                                            </>
                                                        ) : (
                                                            'Date not set'
                                                        )}
                                                    </div>
                                                </div>
                                                <Badge 
                                                    variant={
                                                        t.status === 'ONGOING' ? 'default' : 
                                                        t.status === 'COMPLETED' ? 'secondary' : 
                                                        'outline'
                                                    } 
                                                    className="capitalize ml-2"
                                                >
                                                    {t.status?.toLowerCase() || 'unknown'}
                                                </Badge>
                                            </div>
                                        </Link>
                                    ))}
                            </div>
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
                        <Button variant="outline" className="justify-start" asChild>
                            <Link to="/admin/tournaments/create">
                                <Trophy className="mr-2 h-4 w-4" /> Create Tournament
                            </Link>
                        </Button>
                        <Button variant="outline" className="justify-start" asChild>
                            <Link to="/teams">
                                <Shield className="mr-2 h-4 w-4" /> Manage Teams
                            </Link>
                        </Button>
                        <Button variant="outline" className="justify-start" asChild>
                            <Link to="/admin/users">
                                <Users className="mr-2 h-4 w-4" /> Manage Users
                            </Link>
                        </Button>
                        <Button variant="outline" className="justify-start" asChild>
                            <Link to="/admin/matches">
                                <Activity className="mr-2 h-4 w-4" /> Monitor Matches
                            </Link>
                        </Button>
                        <Button variant="outline" className="justify-start" asChild>
                            <Link to="/admin/matches/schedule">
                                <Plus className="mr-2 h-4 w-4" /> Schedule Match
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminDashboard;
