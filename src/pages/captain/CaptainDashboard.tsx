import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMyTeams, useJoinRequests } from '../../hooks/useTeam'; // Assuming captain has one primary team or we pick the first
import { useUpcomingMatches } from '../../hooks/useMatch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { Shield, Users, Calendar, BarChart2, AlertCircle, ArrowRight } from 'lucide-react';

const CaptainDashboard = () => {
    const { user } = useAuth();

    // Logic: Get the team where user is captain. 
    // API getMyTeams returns teams user is IN. 
    // We need to filter for teams where captain_id === user.id.
    const { data: myTeams, isLoading: teamsLoading } = useMyTeams(user?.id);

    const captainTeam = myTeams?.find(t => t.captain_id === user?.id);

    const { data: requests, isLoading: requestsLoading } = useJoinRequests(captainTeam?.id);
    const { data: upcomingMatches, isLoading: matchesLoading } = useUpcomingMatches(); // Needs filtering for specific team if API doesn't support it directly yet

    // Filter matches for captain's team
    const myMatches = captainTeam && upcomingMatches
        ? upcomingMatches.filter(m => m.team_a_id === captainTeam.id || m.team_b_id === captainTeam.id)
        : [];

    if (teamsLoading) {
        return <div className="space-y-6">
            <Skeleton className="h-20 w-1/3" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        </div>;
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
                        {requestsLoading ? (
                            <Skeleton className="h-8 w-1/2" />
                        ) : (
                            <div className="flex items-baseline gap-2">
                                <div className="text-2xl font-bold">{requests?.length || 0}</div>
                                {(requests?.length || 0) > 0 && (
                                    <Badge variant="destructive" className="ml-2">Action Required</Badge>
                                )}
                            </div>
                        )}
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
                        {matchesLoading ? (
                            <Skeleton className="h-8 w-1/2" />
                        ) : (
                            <div className="text-2xl font-bold">{myMatches.length}</div>
                        )}
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
                        <CardDescription>Overview of {captainTeam.team_name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                {captainTeam.logo_url && (
                                    <img src={captainTeam.logo_url} alt="Logo" className="h-16 w-16 rounded-full border" />
                                )}
                                <div>
                                    <h3 className="text-xl font-bold">{captainTeam.team_name}</h3>
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
                        {requestsLoading ? (
                            <div className="space-y-2">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        ) : requests && requests.length > 0 ? (
                            <div className="space-y-4">
                                {requests.slice(0, 3).map((req: any) => (
                                    <div key={req.id} className="flex items-center justify-between border-b last:border-0 pb-2 last:pb-0">
                                        <div>
                                            <p className="font-medium">{req.player?.full_name}</p>
                                            <p className="text-xs text-muted-foreground capitalize">{req.player?.player_type?.replace('-', ' ')}</p>
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
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center">
                                <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
                                <p className="text-muted-foreground text-sm">No pending requests.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CaptainDashboard;
