import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTournaments } from '../../hooks/useTournament';
import * as matchApi from '../../lib/api/matches';
import * as tournamentApi from '../../lib/api/tournaments'; // to get tournaments if hook not enough
import { useRealtimeMatchScore, useRealtimeMatchStatus } from '../../hooks/useRealtime';
import { useMatchScore } from '../../hooks/useMatch';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Skeleton } from '../../components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { useToast } from '../../components/ui/use-toast';
import { Search, Eye, Ban, Edit, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

// Helper component for Real-time Score in table
const LiveScoreCell = ({ matchId }: { matchId: string }) => {
    // using hook that polls or subscribes
    const { data: score } = useMatchScore(matchId);
    useRealtimeMatchScore(matchId); // Enable subscription updates

    if (!score) return <span className="text-muted-foreground">-</span>;
    // Assuming score is an array or object. API says getMatchScore returns scores. 
    // Usually one active score for current innings or multiple. 
    // Let's assume the API returns the current active score object or an array.
    const currentScore = Array.isArray(score) ? score[0] : score;

    if (!currentScore) return <span className="text-muted-foreground">0/0</span>;

    return (
        <div className="font-mono text-sm">
            {currentScore.total_runs}/{currentScore.total_wickets} <span className="text-muted-foreground">({currentScore.total_overs})</span>
        </div>
    );
};

const MatchMonitoring = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTournament, setSelectedTournament] = useState<string>('all');
    const [statusFilter, setStatusFilter] = useState('all'); // Main tab control
    const [actionMatch, setActionMatch] = useState<any>(null); // For dialogs

    const { data: tournaments } = useTournaments();

    // Determine query based on state
    // If 'all' tournament, we might want to fetch *all* matches (custom query needed) 
    // or just rely on 'getUpcoming' / 'getLive' for those tabs specifically.
    // For 'Completed', listing ALL is heavy. 
    // Let's rely on getMatchesByTournament if a tournament is selected.
    // If 'all' tournament is selected, we'll try to fetch all if possible (not standard in API) 
    // or guide user to select one.
    // However, for "Live" and "Scheduled", we have global getters (limit 10 for scheduled).
    // Let's try to be smart:
    // Tab "Live" -> use matchApi.getLiveMatches()
    // Tab "Scheduled" -> use matchApi.getUpcomingMatches() (maybe increase limit or add pagination support later)
    // Tab "Completed" -> Require Tournament Selection or show empty

    // Actually, creating a robust "useMatches" hook here that adapts:
    const { data: matches, isLoading } = useQuery({
        queryKey: ['matches', selectedTournament, statusFilter],
        queryFn: async () => {
            if (statusFilter === 'live') {
                return matchApi.getLiveMatches();
            }
            if (selectedTournament !== 'all') {
                let m = await matchApi.getMatchesByTournament(selectedTournament);
                if (statusFilter !== 'all') {
                    m = m.filter((x: any) => x.status === statusFilter);
                }
                return m;
            }
            if (statusFilter === 'scheduled') {
                return matchApi.getUpcomingMatches();
            }
            // Fallback for 'all' + 'all' or 'all' + 'completed' -> Return empty or warn?
            // For now return empty array to avoid massive fetch
            return [];
        },
        enabled: true
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ matchId, status }: { matchId: string; status: any }) =>
            matchApi.updateMatchStatus(matchId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            queryClient.invalidateQueries({ queryKey: ['liveMatches'] });
            queryClient.invalidateQueries({ queryKey: ['upcomingMatches'] });
            toast({ title: 'Updated', description: 'Match status updated.' });
            setActionMatch(null);
        },
        onError: () => toast({ title: 'Error', description: 'Failed to update status.', variant: 'destructive' })
    });

    const filteredMatches = matches?.filter((m: any) => {
        const teamA = m.team_a?.team_name?.toLowerCase() || '';
        const teamB = m.team_b?.team_name?.toLowerCase() || '';
        return teamA.includes(searchTerm.toLowerCase()) || teamB.includes(searchTerm.toLowerCase());
    }) || [];

    const handleStatusChange = (status: string) => {
        if (actionMatch) {
            updateStatusMutation.mutate({ matchId: actionMatch.id, status });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Match Monitoring</h1>
                    <p className="text-muted-foreground">Real-time oversight of all matches.</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search teams..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="w-full md:w-[250px]">
                    <Select value={selectedTournament} onValueChange={setSelectedTournament}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by Tournament" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Tournaments</SelectItem>
                            {tournaments?.map(t => (
                                <SelectItem key={t.id} value={t.id}>{t.tournament_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
                <TabsList>
                    <TabsTrigger value="live">Live Now</TabsTrigger>
                    <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    {selectedTournament !== 'all' && <TabsTrigger value="all">All (Tournament)</TabsTrigger>}
                </TabsList>

                {/* Shared Content Area since we filtered in data fetch */}
                <div className="mt-4 border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Teams</TableHead>
                                <TableHead>Tournament</TableHead>
                                <TableHead>Score</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">Loading matches...</TableCell>
                                </TableRow>
                            ) : filteredMatches.length > 0 ? (
                                filteredMatches.map((match: any) => (
                                    <TableRow key={match.id}>
                                        <TableCell className="text-sm">
                                            {format(new Date(match.match_date), 'MMM dd, p')}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {match.team_a?.team_name} <span className="text-muted-foreground">vs</span> {match.team_b?.team_name}
                                        </TableCell>
                                        <TableCell>
                                            {match.tournament?.tournament_name || '-'}
                                        </TableCell>
                                        <TableCell>
                                            {match.status === 'live' || match.status === 'completed' ? (
                                                <LiveScoreCell matchId={match.id} />
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={match.status === 'live' ? 'destructive' : match.status === 'completed' ? 'secondary' : 'outline'} className="uppercase text-xs">
                                                {match.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => navigate(`/matches/${match.id}`)}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => setActionMatch(match)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        {selectedTournament === 'all' && statusFilter === 'completed'
                                            ? "Please select a specific tournament to view completed matches."
                                            : "No matches found."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </Tabs>

            {/* Status Update Dialog */}
            <Dialog open={!!actionMatch} onOpenChange={(open) => !open && setActionMatch(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Update Match Status</DialogTitle>
                        <DialogDescription>
                            Change the status for {actionMatch?.team_a?.team_name} vs {actionMatch?.team_b?.team_name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <Button
                            variant="outline"
                            className="justify-start"
                            onClick={() => handleStatusChange('scheduled')}
                            disabled={actionMatch?.status === 'scheduled'}
                        >
                            Mark as Scheduled
                        </Button>
                        <Button
                            variant="default"
                            className="justify-start bg-red-600 hover:bg-red-700"
                            onClick={() => handleStatusChange('live')}
                            disabled={actionMatch?.status === 'live'}
                        >
                            <RefreshCw className="mr-2 h-4 w-4" /> Mark as Live
                        </Button>
                        <Button
                            variant="secondary"
                            className="justify-start"
                            onClick={() => handleStatusChange('completed')}
                            disabled={actionMatch?.status === 'completed'}
                        >
                            Mark as Completed
                        </Button>
                        <Button
                            variant="destructive"
                            className="justify-start"
                            onClick={() => handleStatusChange('abandoned')} // Assuming 'abandoned' is valid status or we use 'completed' with note
                        >
                            <Ban className="mr-2 h-4 w-4" /> Cancel Match
                        </Button>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setActionMatch(null)}>Cancel</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MatchMonitoring;
