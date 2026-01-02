import { useState, useEffect } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useJoinRequests } from '../../hooks/useTeam';
import { teamService } from '../../services/team.service';
import { Card, CardContent, CardFooter, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { useToast } from '../../components/ui/use-toast';
import { Check, X, User as UserIcon, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';
import type { TeamMember } from '../../types/api.types';

const PlayerRequests = () => {
    const { user } = useAuth();
    const [captainTeam, setCaptainTeam] = useState<any>(null);
    const [loadingTeams, setLoadingTeams] = useState(true);
    
    // Load captain's teams using teamService
    useEffect(() => {
        const loadCaptainTeams = async () => {
            if (!user?.id) return;
            try {
                setLoadingTeams(true);
                console.log('🔍 Loading captain teams for user:', user.id);
                const data = await teamService.getMyTeams();
                const teamsData = Array.isArray(data) ? data : (data?.data || []);
                console.log('✅ All teams loaded:', teamsData);
                
                // Find teams where user is captain
                const myCaptainTeams = teamsData.filter(t => {
                    const isCaptain = t.captainId === user.id || t.captain_id === user.id;
                    console.log(`Team ${t.id}: captainId=${t.captainId || t.captain_id}, user.id=${user.id}, isCaptain=${isCaptain}`);
                    return isCaptain;
                });
                
                console.log('✅ Captain teams found:', myCaptainTeams.length, myCaptainTeams);
                
                if (myCaptainTeams.length > 0) {
                    setCaptainTeam(myCaptainTeams[0]);
                } else {
                    setCaptainTeam(null);
                }
            } catch (err: any) {
                console.error('❌ Failed to load captain teams:', err);
            } finally {
                setLoadingTeams(false);
            }
        };
        
        loadCaptainTeams();
    }, [user?.id]);
    
    const { data: requests, isLoading } = useJoinRequests(captainTeam?.id);
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [selectedPlayer, setSelectedPlayer] = useState<any>(null); // For viewing profile preview

    // Debug logging
    useEffect(() => {
        console.log('📊 PlayerRequests State:', {
            captainTeam: captainTeam,
            captainTeamId: captainTeam?.id,
            requests: requests,
            requestsCount: requests?.length,
            isLoading: isLoading,
            loadingTeams: loadingTeams,
            userId: user?.id,
        });
    }, [captainTeam, requests, isLoading, loadingTeams, user?.id]);

    // Reject join request
    const rejectRequestMutation = useMutation({
        mutationFn: async ({ teamId, playerId }: { teamId: string; playerId: string }) => {
            console.log('🔴 Rejecting join request:', { teamId, playerId });
            // Update status to REJECTED instead of deleting
            const updatedMember = await teamService.updateMemberStatus(teamId, playerId, 'REJECTED');
            return updatedMember;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teamRequests'] });
            queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
            toast({ title: 'Request Rejected', description: 'The player request has been removed.' });
        },
        onError: (err: any) => {
            console.error('❌ Failed to reject request:', err);
            toast({ title: 'Error', description: err.message || 'Failed to reject request.', variant: 'destructive' });
        },
    });

    // Approve join request
    const approveRequestMutation = useMutation({
        mutationFn: async ({ teamId, playerId }: { teamId: string; playerId: string }) => {
            console.log('✅ Approving join request:', { teamId, playerId });
            // Update member status to ACTIVE
            const updatedMember = await teamService.updateMemberStatus(teamId, playerId, 'ACTIVE');
            return updatedMember;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
            queryClient.invalidateQueries({ queryKey: ['teamRequests'] });
            queryClient.invalidateQueries({ queryKey: ['myTeams'] });
            toast({ title: 'Player Added', description: 'Player successfully added to the squad. Refresh the Team Management page to see them.' });
        },
        onError: (err: any) => {
            console.error('❌ Failed to approve request:', err);
            toast({ title: 'Error', description: err.message || 'Failed to approve request.', variant: 'destructive' });
        },
    });

    const handleAction = (request: TeamMember, action: 'approve' | 'reject') => {
        if (!user || !captainTeam) return;
        const teamId = captainTeam.id;
        const playerId = request.playerId || (request.player as any)?.id;
        
        if (!playerId) {
            toast({ title: 'Error', description: 'Invalid request data', variant: 'destructive' });
            return;
        }
        
        if (action === 'approve') {
            approveRequestMutation.mutate({ teamId, playerId });
        } else {
            rejectRequestMutation.mutate({ teamId, playerId });
        }
    };

    if (isLoading || loadingTeams) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pending Requests</h1>
                    <p className="text-muted-foreground">Manage incoming join requests.</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Pending Requests</h1>
                    <p className="text-muted-foreground">
                        {captainTeam 
                            ? `Manage incoming join requests for ${captainTeam.teamName || captainTeam.team_name || captainTeam.name || 'your team'}.`
                            : 'No team found. You need to be a captain to view join requests.'}
                    </p>
                    {captainTeam && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Team ID: {captainTeam.id} | Captain ID: {captainTeam.captainId || captainTeam.captain_id}
                        </p>
                    )}
                </div>
                <Badge variant="secondary" className="mt-2 md:mt-0 text-base py-1 px-3">
                    {requests?.length || 0} Pending
                </Badge>
            </div>

            {requests && requests.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {requests.map((req: any) => (
                        <Card key={req.id} className="overflow-hidden border-l-4 border-l-primary">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={req.player?.profilePictureUrl || req.player?.profile_picture} />
                                    <AvatarFallback>
                                        {(req.player?.fullName || req.player?.full_name || 'P')?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-lg">
                                        {req.player?.fullName || req.player?.full_name || 'Unknown Player'}
                                    </h3>
                                    <Badge variant="outline" className="capitalize text-xs">
                                        {(req.player?.playerType || req.player?.player_type || 'Player')?.replace('_', ' ')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Requested {
                                            (() => {
                                                const dateStr = req.createdAt || req.joined_at;
                                                if (!dateStr) return 'Recently';
                                                try {
                                                    const date = new Date(dateStr);
                                                    if (isNaN(date.getTime())) return 'Recently';
                                                    return format(date, 'MMM dd, yyyy');
                                                } catch {
                                                    return 'Recently';
                                                }
                                            })()
                                        }
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4" />
                                        {req.player?.email || (req.player as any)?.email}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between gap-2 pt-2 bg-muted/40">
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="w-full"
                                    onClick={() => setSelectedPlayer(req.player)}
                                >
                                    <Eye className="h-4 w-4 mr-1" /> View
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => handleAction(req, 'reject')}
                                    disabled={rejectRequestMutation.isPending}
                                >
                                    <X className="h-4 w-4 mr-1" /> Reject
                                </Button>
                                <Button
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handleAction(req, 'approve')}
                                    disabled={approveRequestMutation.isPending}
                                >
                                    <Check className="h-4 w-4 mr-1" /> Approve
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg bg-slate-50 border-dashed">
                    <UserIcon className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">No pending requests</h3>
                    <p className="text-muted-foreground max-w-sm">
                        All clear! Invite players to grow your squad.
                    </p>
                </div>
            )}

            {/* Simple Profile View Dialog */}
            <Dialog open={!!selectedPlayer} onOpenChange={(open) => !open && setSelectedPlayer(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Player Profile</DialogTitle>
                        <DialogDescription>Quick view of the applicant.</DialogDescription>
                    </DialogHeader>
                    {selectedPlayer && (
                        <div className="flex flex-col items-center space-y-4 py-4">
                            <Avatar className="h-24 w-24">
                                <AvatarImage src={selectedPlayer.profile_picture} />
                                <AvatarFallback className="text-2xl">{selectedPlayer.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="text-center">
                                <h2 className="text-xl font-bold">{selectedPlayer.full_name}</h2>
                                <p className="text-muted-foreground">{selectedPlayer.email}</p>
                                <Badge className="mt-2 capitalize">{selectedPlayer.player_type?.replace('-', ' ')}</Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-8 w-full text-center border-t pt-4">
                                <div>
                                    <p className="text-2xl font-bold">--</p>
                                    <p className="text-xs text-muted-foreground">Matches</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">--</p>
                                    <p className="text-xs text-muted-foreground">Runs</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setSelectedPlayer(null)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PlayerRequests;
