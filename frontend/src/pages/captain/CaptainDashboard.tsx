import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { teamService } from '../../services/team.service';
import { matchService } from '../../services/match.service';
import { tournamentService } from '../../services/tournament.service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Shield, Users, Calendar, BarChart2, AlertCircle, ArrowRight } from 'lucide-react';
import type { Team, Match, Tournament, PaginatedResponse } from '../../types/api.types';

const CaptainDashboard = () => {
    const { user } = useAuth();
    const [teams, setTeams] = useState<Team[]>([]);
    const [matches, setMatches] = useState<Match[]>([]);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCaptainData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Captain sees their teams + relevant matches
                const [teamsRes, matchesRes, tournamentsRes] = await Promise.all([
                    teamService.getMyTeams(), // Only captain's teams
                    matchService.getAll({ page: 1, limit: 50 }),
                    tournamentService.getAll({ page: 1, limit: 10, status: 'ONGOING' }),
                ]);

                console.log('✅ Captain data loaded:', { teamsRes, matchesRes, tournamentsRes });

                // Handle different response formats
                const teamsData = Array.isArray(teamsRes) ? teamsRes : (teamsRes?.data || (teamsRes as PaginatedResponse<Team>)?.data || []);
                const matchesData = Array.isArray(matchesRes) ? matchesRes : (matchesRes?.data || (matchesRes as PaginatedResponse<Match>)?.data || []);
                const tournamentsData = Array.isArray(tournamentsRes) ? tournamentsRes : (tournamentsRes?.data || (tournamentsRes as PaginatedResponse<Tournament>)?.data || []);

                setTeams(teamsData);
                setMatches(matchesData);
                setTournaments(tournamentsData);

                // TODO: Fetch join requests - this might need a separate API endpoint
                // For now, set empty array
                setRequests([]);

            } catch (err: any) {
                console.error('❌ Failed to load captain data:', err);
                setError(err.response?.data?.message || err.message || 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchCaptainData();
        }
    }, [user?.id]);

    // Find captain's team (where captainId === user.id)
    const captainTeam = teams.find(t => t.captainId === user?.id);

    // Filter matches for captain's team
    const myMatches = captainTeam
        ? matches.filter(m => m.teamAId === captainTeam.id || m.teamBId === captainTeam.id)
        : [];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading captain dashboard...</p>
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

    if (!captainTeam) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <Shield className="h-16 w-16 text-muted-foreground" />
                <h2 className="text-2xl font-bold">No Team Found</h2>
                <p className="text-muted-foreground">You haven't created a team yet.</p>
                <Button asChild>
                    <Link to="/captain/team/create">Create Team</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Captain's Dashboard</h1>
                    <p className="text-muted-foreground">Manage {captainTeam.team_name} and lead your squad to victory.</p>
                </div>
                <Button asChild>
                    <Link to="/captain/match-control">Match Control</Link>
                </Button>
            </div>

            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card onClick={() => { }} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Join Requests</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-baseline gap-2">
                            <div className="text-2xl font-bold">{requests.length || 0}</div>
                            {requests.length > 0 && (
                                <Badge variant="destructive" className="ml-2">Action Required</Badge>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">Pending player approvals</p>
                        <Button variant="link" className="px-0 h-auto mt-2 text-xs" asChild>
                            <Link to="/captain/requests">View Requests <ArrowRight className="ml-1 h-3 w-3" /></Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Matches</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{myMatches.filter(m => m.status === 'SCHEDULED').length}</div>
                        <p className="text-xs text-muted-foreground">Scheduled for this season</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Form</CardTitle>
                        <BarChart2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">--</div>
                        <p className="text-xs text-muted-foreground">Win/Loss Ratio (Coming Soon)</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Captaincy</CardTitle>
                        <Shield className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">Active</div>
                        <p className="text-xs text-muted-foreground">Status</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Team Overview / Next Match */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Team Status</CardTitle>
                        <CardDescription>Overview of {captainTeam.teamName || captainTeam.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                {captainTeam.logoUrl && (
                                    <img src={captainTeam.logoUrl} alt="Logo" className="h-16 w-16 rounded-full border" />
                                )}
                                <div>
                                    <h3 className="text-xl font-bold">{captainTeam.teamName || captainTeam.name}</h3>
                                    <p className="text-sm text-muted-foreground">{captainTeam.description}</p>
                                </div>
                            </div>
                            {/* Add more stats or info here */}
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Requests List (Mini) */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Join Requests</CardTitle>
                        <CardDescription>Manage your squad roster.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {requests.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-muted-foreground text-sm">No pending requests.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {requests.slice(0, 3).map((req: any) => (
                                    <div key={req.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                                        <div>
                                            <p className="font-medium">{req.player?.fullName || req.player?.full_name}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{req.player?.playerType?.replace('_', ' ') || req.player?.player_type?.replace('-', ' ')}</p>
                                        </div>
                                        <Badge>Pending</Badge>
                                    </div>
                                ))}
                                {requests.length > 3 && (
                                    <Button variant="outline" className="w-full" size="sm" asChild>
                                        <Link to="/captain/requests">View All</Link>
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CaptainDashboard;
