import { useState } from 'react';
import { format } from 'date-fns';
import { useAuth } from '../../hooks/useAuth';
import { useMatchHistory } from '../../hooks/usePlayer';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Download, Search, Filter, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MatchHistory = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { data: matches, isLoading } = useMatchHistory(user?.id);
    const [searchTerm, setSearchTerm] = useState('');

    // Note: API currently returns flat stats objects which contain the match object nested.
    // We need to type this properly or inspect the returned data structure.
    // Based on players.ts -> getPlayerMatchHistory, it returns { matches: {...}, runs_scored, wickets_taken ... }

    const filteredMatches = matches?.filter((item: any) => {
        // Assuming item.matches contains the match details
        const match = item.matches;
        if (!match) return false;

        // Simple search implementation
        const searchString = `${match.venue} ${match.status}`.toLowerCase();
        return searchString.includes(searchTerm.toLowerCase());
    }) || [];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Match History</h1>
                    <p className="text-muted-foreground">Detailed record of your past performances.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search venue..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Match</TableHead>
                            <TableHead>Venue</TableHead>
                            <TableHead>Result</TableHead>
                            <TableHead className="text-right">Runs</TableHead>
                            <TableHead className="text-right">Wickets</TableHead>
                            <TableHead className="text-right">Catches</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredMatches.length > 0 ? (
                            filteredMatches.map((item: any) => {
                                const match = item.matches;
                                return (
                                    <TableRow
                                        key={match.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => navigate(`/matches/${match.id}`)}
                                    >
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                                {format(new Date(match.match_date), 'MMM dd, yyyy')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {/* Ideally fetch team names too, for now simplistic display */}
                                            Match #{match.id.substring(0, 4)}
                                        </TableCell>
                                        <TableCell>{match.venue}</TableCell>
                                        <TableCell>
                                            <Badge variant={match.status === 'completed' ? 'secondary' : 'outline'}>
                                                {match.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-bold">{item.runs_scored}</TableCell>
                                        <TableCell className="text-right">{item.wickets_taken}</TableCell>
                                        <TableCell className="text-right">{item.catches}</TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No matches found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button variant="outline" size="sm" disabled>Previous</Button>
                <Button variant="outline" size="sm" disabled>Next</Button>
            </div>
        </div>
    );
};

export default MatchHistory;
