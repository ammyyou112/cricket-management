import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useMyTeams } from '../../hooks/useTeam';
import * as teamApi from '../../lib/api/teams';
import * as playerApi from '../../lib/api/players';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useToast } from '../../components/ui/use-toast';
import { Search, Send, UserPlus, CheckCircle2 } from 'lucide-react';

const InvitePlayers = () => {
    const { user } = useAuth();
    const { data: myTeams } = useMyTeams(user?.id);
    const captainTeam = myTeams?.find(t => t.captain_id === user?.id);

    const { toast } = useToast();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [invitingId, setInvitingId] = useState<string | null>(null);

    // Hook for searching/getting players - using generic search for now, could be allPlayers with client filter
    const { data: searchResults, isLoading } = useQuery({
        queryKey: ['searchPlayers', searchTerm],
        queryFn: () => playerApi.searchPlayers(searchTerm),
        enabled: true // Always enabled, search term empty returns all or limit
    });

    const invitePlayerMutation = useMutation({
        mutationFn: ({ playerId, teamId }: { playerId: string; teamId: string; }) =>
            teamApi.invitePlayer(user!.id, playerId, teamId), // Assuming API supports this
        onSuccess: () => {
            setInvitingId(null);
            toast({ title: 'Invite Sent', description: 'Player has been invited to join your team.' });
            // Ideally invalidate a query that tracks invitations
        },
        onError: () => {
            setInvitingId(null);
            toast({ title: 'Error', description: 'Failed to send invite.', variant: 'destructive' });
        }
    });

    const handleInvite = (playerId: string) => {
        if (!captainTeam) return;
        setInvitingId(playerId);
        invitePlayerMutation.mutate({ playerId, teamId: captainTeam.id });
    };

    const filteredPlayers = searchResults?.filter((player: any) => {
        if (player.id === user?.id) return false; // Don't invite self
        if (typeFilter !== 'all' && player.player_type !== typeFilter) return false;
        return true;
    }) || [];

    if (!captainTeam) {
        return <div>You need a team to invite players.</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Invite Players</h1>
                <p className="text-muted-foreground">Search and build your dream team.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Filter by Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="batsman">Batsman</SelectItem>
                        <SelectItem value="bowler">Bowler</SelectItem>
                        <SelectItem value="all-rounder">All-Rounder</SelectItem>
                        <SelectItem value="wicket-keeper">Wicket-Keeper</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                        <Card key={i}><Skeleton className="h-48 w-full" /></Card>
                    ))
                ) : filteredPlayers.length > 0 ? (
                    filteredPlayers.map((player: any) => (
                        <Card key={player.id} className="flex flex-col">
                            <CardHeader className="flex flex-row items-center gap-4 pb-2">
                                <Avatar className="h-14 w-14 border">
                                    <AvatarImage src={player.profile_picture} />
                                    <AvatarFallback>{player.full_name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle className="text-base">{player.full_name}</CardTitle>
                                    <Badge variant="secondary" className="mt-1 capitalize">
                                        {player.player_type?.replace('-', ' ')}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 pb-4">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-muted p-2 rounded text-center">
                                        <span className="block font-bold">--</span>
                                        <span className="text-xs text-muted-foreground">Runs</span>
                                    </div>
                                    <div className="bg-muted p-2 rounded text-center">
                                        <span className="block font-bold">--</span>
                                        <span className="text-xs text-muted-foreground">Wickets</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    onClick={() => handleInvite(player.id)}
                                    disabled={invitingId === player.id}
                                >
                                    {invitingId === player.id ? (
                                        <>Sending...</>
                                    ) : (
                                        <><UserPlus className="mr-2 h-4 w-4" /> Invite to Team</>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-muted-foreground">
                        No players found matching your criteria.
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvitePlayers;
