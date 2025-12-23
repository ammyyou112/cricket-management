import { useParams, useNavigate } from 'react-router-dom';
import { useTournamentDetails, useTournamentMatches, useTournamentStandings } from '../../hooks/useTournament';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Button } from '../../components/ui/button';
import { Trophy, Calendar, Users, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const TournamentView = () => {
    const { tournamentId } = useParams<{ tournamentId: string }>();
    const navigate = useNavigate();

    const { data: tournament, isLoading: loadingDetails } = useTournamentDetails(tournamentId!);
    const { data: matches, isLoading: loadingMatches } = useTournamentMatches(tournamentId!);
    // Standings hook currently returns finished matches (raw data). In a real app this would perform aggregation.
    // We will do a simple client-side points calculation for demo purposes if backend aggregation isn't ready.
    const { data: rawStandingsData, isLoading: loadingStandings } = useTournamentStandings(tournamentId!);

    // Client-side Points Table Calculation (Mock)
    const pointsTable = (() => {
        if (!rawStandingsData) return [];
        const teams: Record<string, any> = {};

        // Iterate matches to calc points (2 for win, 0 for loss/tie handling)
        // Note: rawStandings is actually matches list with winner_team_id
        rawStandingsData.forEach((m: any) => {
            if (m.status === 'completed' && m.winner_team_id) {
                // Winner
                if (!teams[m.winner_team_id]) teams[m.winner_team_id] = { played: 0, won: 0, points: 0, name: m.winner_team?.team_name || 'Team' };
                teams[m.winner_team_id].played++;
                teams[m.winner_team_id].won++;
                teams[m.winner_team_id].points += 2;

                // Loser (identify via team_a/b)
                const loserId = m.team_a_id === m.winner_team_id ? m.team_b_id : m.team_a_id;
                const loserName = m.team_a_id === m.winner_team_id ? m.team_b?.team_name : m.team_a?.team_name;
                if (!teams[loserId]) teams[loserId] = { played: 0, won: 0, points: 0, name: loserName || 'Team' };
                teams[loserId].played++;
            }
        });

        // Convert to array and sort
        return Object.entries(teams).map(([id, stats]) => ({ id, ...stats })).sort((a, b) => b.points - a.points);
    })();

    if (loadingDetails) return <Skeleton className="h-[400px] w-full" />;
    if (!tournament) return <div>Tournament not found</div>;

    return (
        <div className="space-y-8">
            {/* Header Card */}
            <Card className="bg-primary/5 border-none">
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-3xl">{tournament.tournament_name}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-2">
                                <Calendar className="h-4 w-4" />
                                {format(new Date(tournament.start_date), 'MMM d, yyyy')} - {format(new Date(tournament.end_date), 'MMM d, yyyy')}
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-lg bg-background px-4 py-1 capitalize">
                            {tournament.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-primary" />
                            <span className="font-medium">Format: League</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="font-medium">{matches ? new Set([...matches.map(m => m.team_a_id), ...matches.map(m => m.team_b_id)]).size : 0} Teams</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Tabs defaultValue="fixtures" className="w-full">
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="fixtures">Fixture List</TabsTrigger>
                    <TabsTrigger value="standings">Standings</TabsTrigger>
                    <TabsTrigger value="stats">Player Stats</TabsTrigger>
                </TabsList>

                {/* Fixtures Tab */}
                <TabsContent value="fixtures" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Matches</CardTitle>
                            <CardDescription>Full schedule and results.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loadingMatches ? (
                                <Skeleton className="h-40 w-full" />
                            ) : matches && matches.length > 0 ? (
                                <div className="space-y-4">
                                    {matches.map((match: any) => (
                                        <div key={match.id}
                                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                                            onClick={() => navigate(`/matches/${match.id}`)}
                                        >
                                            <div className="flex flex-col gap-1 w-1/3">
                                                <span className="font-bold text-right truncate">{match.team_a?.team_name}</span>
                                            </div>
                                            <div className="flex flex-col items-center justify-center w-1/3 text-center px-2">
                                                <Badge variant={match.status === 'live' ? 'destructive' : 'secondary'} className="mb-1 text-[10px] uppercase">
                                                    {match.status}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                    {format(new Date(match.match_date), 'MMM d, p')}
                                                </span>
                                                {match.venue && <span className="text-[10px] text-muted-foreground truncate max-w-full">{match.venue}</span>}
                                            </div>
                                            <div className="flex flex-col gap-1 w-1/3">
                                                <span className="font-bold text-left truncate">{match.team_b?.team_name}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-muted-foreground">No matches scheduled yet.</div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Standings Tab */}
                <TabsContent value="standings" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Points Table</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[10px]">#</TableHead>
                                        <TableHead>Team</TableHead>
                                        <TableHead className="text-center">P</TableHead>
                                        <TableHead className="text-center">W</TableHead>
                                        <TableHead className="text-center">L</TableHead>
                                        <TableHead className="text-center font-bold">Pts</TableHead>
                                        <TableHead className="text-center">NRR</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pointsTable.length > 0 ? (
                                        pointsTable.map((team, index) => (
                                            <TableRow key={team.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell className="font-medium">{team.name}</TableCell>
                                                <TableCell className="text-center">{team.played}</TableCell>
                                                <TableCell className="text-center">{team.won}</TableCell>
                                                <TableCell className="text-center">{team.played - team.won}</TableCell>
                                                <TableCell className="text-center font-bold">{team.points}</TableCell>
                                                <TableCell className="text-center text-muted-foreground">0.00</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                                No matches played yet.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Stats Tab (Placeholder) */}
                <TabsContent value="stats" className="mt-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Most Runs</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="py-8 text-center text-muted-foreground">Stats calculation requires match data.</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader>
                                <CardTitle>Most Wickets</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="py-8 text-center text-muted-foreground">Stats calculation requires match data.</div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default TournamentView;
