import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMyTeams } from '../../hooks/useTeam';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { LogOut, Eye, Shield } from 'lucide-react';

const MyTeams = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    // useMyTeams currently fetches all teams the user is part of (active status presumed by API logic)
    // If we want pending requests here, we might need a separate hook or the API should return status.
    // Assuming useMyTeams returns filtered active teams based on previous implementation. 
    // Let's assume for now it returns a list of Team objects. 
    // If we need status, the API should return { team: Team, status: string } ideally.
    // Based on current src/lib/api/teams.ts -> getMyTeams returns Team[] directly.
    // So we only show 'Active' teams here.
    const { data: teams, isLoading } = useMyTeams(user?.id);

    const handleLeaveTeam = (teamId: string) => {
        // Implement leave logic, likely a dialog confirmation first
        console.log("Leaving team", teamId);
    };

    if (isLoading) {
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
                <h1 className="text-3xl font-bold tracking-tight">My Teams</h1>
                <Button variant="outline" onClick={() => navigate('/player/teams/find')}>
                    Find New Team
                </Button>
            </div>

            <Tabs defaultValue="active" className="w-full">
                <TabsList>
                    <TabsTrigger value="active">Active Squads</TabsTrigger>
                    <TabsTrigger value="pending">Pending Requests</TabsTrigger>
                </TabsList>

                <TabsContent value="active" className="mt-6">
                    {teams && teams.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {teams.map((team) => (
                                <Card key={team.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                    <CardHeader className="flex flex-row items-center gap-4">
                                        <Avatar className="h-14 w-14 border">
                                            <AvatarImage src={team.logo_url || undefined} />
                                            <AvatarFallback>{team.team_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1">
                                            <CardTitle>{team.team_name}</CardTitle>
                                            <Badge variant="default" className="bg-green-600 hover:bg-green-700">Active Player</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {/* We'd likely want to show Captain name here if available in the data */}
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {team.description || "A competitive cricket team."}
                                        </p>
                                    </CardContent>
                                    <CardFooter className="flex justify-between gap-2">
                                        <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate(`/player/teams/${team.id}`)}>
                                            <Eye className="mr-2 h-4 w-4" />
                                            View
                                        </Button>
                                        <Button variant="ghost" size="sm" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleLeaveTeam(team.id); }}>
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
                            <Button onClick={() => navigate('/player/teams/find')}>Find a Team</Button>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="pending">
                    <div className="py-12 text-center text-muted-foreground">
                        Feature coming soon. (Requires API update to fetch pending requests)
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default MyTeams;
