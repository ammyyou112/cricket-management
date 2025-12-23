import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useMyTeams, useJoinRequests } from '../../hooks/useTeam';
import * as teamApi from '../../lib/api/teams';
import { Card, CardContent, CardFooter, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../../components/ui/dialog';
import { useToast } from '../../components/ui/use-toast';
import { Check, X, User as UserIcon, Calendar, Eye } from 'lucide-react';
import { format } from 'date-fns';

const PlayerRequests = () => {
    const { user } = useAuth();
    const { data: myTeams } = useMyTeams(user?.id);
    const captainTeam = myTeams?.find(t => t.captain_id === user?.id);
    const { data: requests, isLoading } = useJoinRequests(captainTeam?.id);
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [selectedPlayer, setSelectedPlayer] = useState<any>(null); // For viewing profile preview

    // Need to handle Reject manually as it's not exported in useTeam.ts yet
    const rejectRequestMutation = useMutation({
        mutationFn: ({ requestId, captainId }: { requestId: string; captainId: string }) =>
            teamApi.rejectJoinRequest(requestId, captainId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teamRequests'] });
            toast({ title: 'Request Rejected', description: 'The player request has been removed.' });
        },
    });

    const approveRequestMutation = useMutation({
        mutationFn: ({ requestId, captainId }: { requestId: string; captainId: string }) =>
            teamApi.approveJoinRequest(requestId, captainId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
            queryClient.invalidateQueries({ queryKey: ['teamRequests'] });
            toast({ title: 'Player Added', description: 'Player successfully added to the squad.' });
        },
    });

    const handleAction = (requestId: string, action: 'approve' | 'reject') => {
        if (!user) return;
        if (action === 'approve') {
            approveRequestMutation.mutate({ requestId, captainId: user.id });
        } else {
            rejectRequestMutation.mutate({ requestId, captainId: user.id });
        }
    };

    if (isLoading) {
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
                    <p className="text-muted-foreground">Manage incoming join requests for {captainTeam?.team_name}.</p>
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
                                    <AvatarImage src={req.player?.profile_picture} />
                                    <AvatarFallback>{req.player?.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="font-semibold text-lg">{req.player?.full_name}</h3>
                                    <Badge variant="outline" className="capitalize text-xs">
                                        {req.player?.player_type?.replace('-', ' ') || 'Player'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="pb-2">
                                <div className="space-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Requested {format(new Date(req.joined_at), 'MMM dd, yyyy')}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <UserIcon className="h-4 w-4" />
                                        {req.player?.email}
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
                                    onClick={() => handleAction(req.id, 'reject')}
                                >
                                    <X className="h-4 w-4 mr-1" /> Reject
                                </Button>
                                <Button
                                    size="sm"
                                    className="w-full"
                                    onClick={() => handleAction(req.id, 'approve')}
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
