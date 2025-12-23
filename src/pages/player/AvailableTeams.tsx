import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAvailableTeams, useSendJoinRequest } from '../../hooks/useTeam';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/use-toast';
import { Search, Loader2, Users, UserPlus } from 'lucide-react';

const AvailableTeams = () => {
    const { user } = useAuth();
    const { data: teams, isLoading } = useAvailableTeams();
    const { mutate: joinTeam, isPending } = useSendJoinRequest();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [requestingTeamId, setRequestingTeamId] = useState<string | null>(null);

    const filteredTeams = teams?.filter((team) =>
        team.team_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleJoinRequest = (teamId: string) => {
        if (!user) return;

        setRequestingTeamId(teamId);
        joinTeam({ playerId: user.id, teamId }, {
            onSuccess: () => {
                toast({
                    title: "Request Sent",
                    description: "Ideally, this button should now be disabled or show 'Pending'.",
                });
                setRequestingTeamId(null);
            },
            onError: (error) => {
                toast({
                    title: "Error",
                    description: "Could not send join request.",
                    variant: "destructive"
                });
                setRequestingTeamId(null);
            }
        });
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Available Teams</h1>
                    <p className="text-muted-foreground">Find a squad to join and start playing.</p>
                </div>
                <div className="relative w-full md:w-72">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search teams..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <Card key={i} className="flex flex-col overflow-hidden">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-[150px]" />
                                    <Skeleton className="h-3 w-[100px]" />
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <Skeleton className="h-4 w-full mb-2" />
                                <Skeleton className="h-4 w-2/3" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : filteredTeams && filteredTeams.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTeams.map((team) => (
                        <Card key={team.id} className="flex flex-col hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                                <Avatar className="h-12 w-12 border">
                                    <AvatarImage src={team.logo_url || undefined} alt={team.team_name} />
                                    <AvatarFallback>{team.team_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <CardTitle className="text-lg">{team.team_name}</CardTitle>
                                    <CardDescription className="text-xs">
                                        Created {new Date(team.created_at).toLocaleDateString()}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {team.description || "No description provided."}
                                </p>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>Members: --</span> {/* Assuming we fetch count separately or add to view */}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button
                                    className="w-full"
                                    variant="secondary"
                                    onClick={() => handleJoinRequest(team.id)}
                                    disabled={requestingTeamId === team.id || isPending}
                                >
                                    {requestingTeamId === team.id ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Join Team
                                        </>
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <h3 className="text-lg font-medium text-muted-foreground">No teams found</h3>
                    <p className="text-sm text-muted-foreground mt-1">Try adjusting your search query.</p>
                </div>
            )}
        </div>
    );
};

export default AvailableTeams;
