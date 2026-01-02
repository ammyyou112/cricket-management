import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { teamService } from '../../services/team.service';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { useToast } from '../../components/ui/use-toast';
import { Search, Loader2, Users, UserPlus, MapPin, Eye } from 'lucide-react';
import { NearbyTeams } from '../../components/player/NearbyTeams';
import type { Team } from '../../types/api.types';

const AvailableTeams = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [requestingTeamId, setRequestingTeamId] = useState<string | null>(null);

    useEffect(() => {
        const loadTeams = async () => {
            try {
                setLoading(true);
                console.log('🔍 Player: Loading available teams...');
                
                const data = await teamService.getAll({ page: 1, limit: 100 });
                
                // Handle different response formats
                const extractTeamsData = (response: any): Team[] => {
                    if (Array.isArray(response)) {
                        return response;
                    }
                    if (response && typeof response === 'object' && 'data' in response && 'pagination' in response) {
                        return Array.isArray(response.data) ? response.data : [];
                    }
                    if (response && typeof response === 'object' && 'data' in response) {
                        return Array.isArray(response.data) ? response.data : [];
                    }
                    return [];
                };

                const teamsData = extractTeamsData(data);
                console.log('✅ Available teams loaded:', teamsData.length);
                setTeams(teamsData);
            } catch (err: any) {
                console.error('❌ Failed to load teams:', err);
                toast({
                    title: 'Error',
                    description: err.message || 'Failed to load teams',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };

        loadTeams();
    }, [toast]);

    const filteredTeams = teams.filter((team) => {
        const teamName = team.teamName || team.name || '';
        return teamName.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const handleJoinRequest = async (teamId: string, teamName: string) => {
        if (!user?.id) {
            toast({
                title: 'Error',
                description: 'Please login to join a team',
                variant: 'destructive',
            });
            return;
        }

        try {
            setRequestingTeamId(teamId);
            console.log('🔵 Sending join request for team:', teamId);
            
            // Call the join request API
            await teamService.requestToJoin(teamId);
            
            console.log('✅ Join request sent successfully');
            toast({
                title: "Join Request Sent",
                description: `Your join request has been sent to "${teamName}". The captain will review your request.`,
            });
            
        } catch (err: any) {
            console.error('❌ Failed to send join request:', err);
            toast({
                title: "Error",
                description: err.message || "Could not send join request.",
                variant: "destructive"
            });
        } finally {
            setRequestingTeamId(null);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Available Teams</h1>
                    <p className="text-muted-foreground">Find a squad to join and start playing.</p>
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <TabsList>
                        <TabsTrigger value="all">All Teams</TabsTrigger>
                        <TabsTrigger value="nearby">
                            <MapPin className="h-4 w-4 mr-2" />
                            Nearby Teams
                        </TabsTrigger>
                    </TabsList>
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

                <TabsContent value="all" className="space-y-6">
                    {loading ? (
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
                    ) : filteredTeams.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredTeams.map((team) => (
                                <Card key={team.id} className="flex flex-col hover:shadow-md transition-shadow">
                                    <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                                        <Avatar className="h-12 w-12 border">
                                            <AvatarImage src={team.logoUrl || undefined} alt={team.teamName || team.name || 'Team'} />
                                            <AvatarFallback>
                                                {(team.teamName || team.name || 'TM').substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                            <CardTitle className="text-lg">{team.teamName || team.name || 'Unnamed Team'}</CardTitle>
                                            <CardDescription className="text-xs">
                                                Created {new Date(team.createdAt).toLocaleDateString()}
                                            </CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-4">
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {team.description || "No description provided."}
                                        </p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Users className="h-4 w-4" />
                                            <span>Members: {team._count?.members || team.members?.length || 0}</span>
                                        </div>
                                        {team.captain && (
                                            <div className="text-xs text-muted-foreground">
                                                Captain: {team.captain.fullName || team.captain.full_name}
                                            </div>
                                        )}
                                    </CardContent>
                                    <CardFooter className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => navigate(`/teams/${team.id}`)}
                                            className="flex-1"
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            View
                                        </Button>
                                        <Button
                                            className="flex-1"
                                            variant="secondary"
                                            onClick={() => handleJoinRequest(team.id)}
                                            disabled={requestingTeamId === team.id}
                                        >
                                            {requestingTeamId === team.id ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Sending...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="mr-2 h-4 w-4" />
                                                    Join
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
                </TabsContent>

                <TabsContent value="nearby" className="space-y-6">
                    {loading ? (
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
                    ) : teams && teams.length > 0 ? (
                        <NearbyTeams 
                            teams={teams}
                            onJoinRequest={handleJoinRequest}
                            isRequesting={requestingTeamId !== null}
                            requestingTeamId={requestingTeamId}
                        />
                    ) : (
                        <div className="text-center py-12">
                            <h3 className="text-lg font-medium text-muted-foreground">No teams available</h3>
                            <p className="text-sm text-muted-foreground mt-1">Check back later for new teams.</p>
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default AvailableTeams;
