import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { teamService } from '../../services/team.service';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useToast } from '../../components/ui/use-toast';
import { LogOut, Eye, Shield, Clock, X } from 'lucide-react';
import type { Team, TeamMember } from '../../types/api.types';
import { format } from 'date-fns';

const MyTeams = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [pendingRequests, setPendingRequests] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingPending, setLoadingPending] = useState(false);

    useEffect(() => {
        const loadMyTeams = async () => {
            try {
                setLoading(true);
                
                const data = await teamService.getMyTeams();
                const teamsData = Array.isArray(data) ? data : (data?.data || []);
                setTeams(teamsData);
            } catch (err: any) {
                toast({
                    title: 'Error',
                    description: err.message || 'Failed to load teams',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            loadMyTeams();
        }
    }, [user?.id, toast]);

    useEffect(() => {
        const loadPendingRequests = async () => {
            try {
                setLoadingPending(true);
                const requests = await teamService.getMyPendingRequests();
                setPendingRequests(requests || []);
            } catch (err: any) {
                toast({
                    title: 'Error',
                    description: err.message || 'Failed to load pending requests',
                    variant: 'destructive',
                });
            } finally {
                setLoadingPending(false);
            }
        };

        if (user?.id) {
            loadPendingRequests();
        }
    }, [user?.id, toast]);

    const handleLeaveTeam = async (teamId: string, teamName: string) => {
        if (!confirm(`Are you sure you want to leave "${teamName}"?`)) {
            return;
        }

        try {
            await teamService.leaveTeam(teamId);
            toast({
                title: 'Success',
                description: 'You have left the team',
            });
            // Remove from state
            setTeams(teams.filter(t => t.id !== teamId));
        } catch (err: any) {
            console.error('❌ Failed to leave team:', err);
            toast({
                title: 'Error',
                description: err.message || 'Failed to leave team',
                variant: 'destructive',
            });
        }
    };

    const handleCancelRequest = async (request: TeamMember) => {
        if (!confirm(`Are you sure you want to cancel your request to join "${request.team?.teamName || 'this team'}"?`)) {
            return;
        }

        try {
            // Update status to REJECTED (or delete the request)
            await teamService.updateMemberStatus(request.teamId, user!.id, 'REJECTED');
            toast({
                title: 'Success',
                description: 'Join request cancelled',
            });
            // Remove from state
            setPendingRequests(pendingRequests.filter(r => r.id !== request.id));
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.message || 'Failed to cancel request',
                variant: 'destructive',
            });
        }
    };

    if (loading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-10 w-48" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-48 w-full rounded-xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Teams</h1>
                    <p className="text-muted-foreground">Teams you're currently part of</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/player/teams')}>
                    Browse Teams
                </Button>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList>
                    <TabsTrigger value="active">Active Squads</TabsTrigger>
                    <TabsTrigger value="pending">Pending Requests</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-6">
                    {teams.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {teams.map((team) => (
                                <Card key={team.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <Avatar className="h-14 w-14 border">
                                            <AvatarImage src={team.logoUrl || undefined} />
                                            <AvatarFallback>
                                                {(team.teamName || team.name || 'TM').substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                            <CardTitle>{team.teamName || team.name || 'Unnamed Team'}</CardTitle>
                                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active Player</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {team.description || "A competitive cricket team."}
                                        </p>
                                        {team.captain && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Captain: {team.captain.fullName || team.captain.full_name}
                                            </p>
                                        )}
                                    </CardContent>
                                    <CardFooter className="flex justify-between gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="w-full" 
                                            onClick={() => navigate(`/teams/${team.id}`)}
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            View
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                handleLeaveTeam(team.id, team.teamName || team.name || 'Team'); 
                                            }}
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Leave
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-slate-50 border-dashed">
                            <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No teams yet</h3>
                            <p className="text-muted-foreground max-w-sm mb-6">
                                You haven't joined any teams. Search for teams to join and start your journey.
                            </p>
                            <Button onClick={() => navigate('/player/teams')}>Browse Teams</Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="pending" className="mt-6">
                    {loadingPending ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-48 w-full rounded-xl" />
                            ))}
                        </div>
                    ) : pendingRequests.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {pendingRequests.map((request) => (
                                <Card key={request.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <Avatar className="h-14 w-14 border">
                                            <AvatarImage src={request.team?.logoUrl || undefined} />
                                            <AvatarFallback>
                                                {(request.team?.teamName || 'TM').substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                            <CardTitle>{request.team?.teamName || 'Unnamed Team'}</CardTitle>
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
                                                <Clock className="mr-1 h-3 w-3" />
                                                Pending
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {request.team?.description || "A competitive cricket team."}
                                        </p>
                                        {request.team?.captain && (
                                            <p className="text-xs text-muted-foreground mt-2">
                                                Captain: {request.team.captain.fullName || request.team.captain.full_name}
                                            </p>
                                        )}
                                        {request.createdAt && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Requested: {format(new Date(request.createdAt), 'MMM dd, yyyy')}
                                            </p>
                                        )}
                                    </CardContent>
                                    <CardFooter className="flex justify-between gap-2">
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="w-full" 
                                            onClick={() => navigate(`/teams/${request.teamId}`)}
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            View Team
                                        </Button>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" 
                                            onClick={(e) => { 
                                                e.stopPropagation(); 
                                                handleCancelRequest(request); 
                                            }}
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Cancel
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-slate-50 border-dashed">
                            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">No pending requests</h3>
                            <p className="text-muted-foreground max-w-sm mb-6">
                                You don't have any pending join requests. Browse teams and send requests to join.
                            </p>
                            <Button onClick={() => navigate('/player/teams')}>Browse Teams</Button>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default MyTeams;
