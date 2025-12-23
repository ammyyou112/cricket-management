import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTournaments, useDeleteTournament } from '../../hooks/useTournament'; // Assuming useDeleteTournament created or imported via api
import { useQueryClient, useMutation } from '@tanstack/react-query';
import * as tournamentApi from '../../lib/api/tournaments';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/use-toast';
import { Search, Plus, MoreHorizontal, Trash2, Eye, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { format } from 'date-fns';

const ManageTournaments = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');

    const { data: tournaments, isLoading } = useTournaments(); // Needs to fetch all

    // Mutation for deletion
    const deleteMutation = useMutation({
        mutationFn: (id: string) => tournamentApi.deleteTournament(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
            toast({ title: 'Deleted', description: 'Tournament has been removed.' });
        },
        onError: () => {
            toast({ title: 'Error', description: 'Failed to delete tournament.', variant: 'destructive' });
        }
    });

    const handleDelete = (id: string) => {
        if (confirm('Are you sure? This will delete all matches associated with this tournament.')) {
            deleteMutation.mutate(id);
        }
    };

    const filteredTournaments = tournaments?.filter(t =>
        t.tournament_name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'ongoing': return 'default';
            case 'completed': return 'secondary';
            default: return 'outline';
        }
    };

    const TournamentTable = ({ statusFilter }: { statusFilter: string }) => {
        const data = statusFilter === 'all'
            ? filteredTournaments
            : filteredTournaments.filter(t => t.status === statusFilter);

        if (isLoading) return <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>;

        if (data.length === 0) return <div className="py-8 text-center text-muted-foreground">No tournaments found.</div>;

        return (
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Start Date</TableHead>
                            <TableHead>End Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((tournament) => (
                            <TableRow key={tournament.id} className="cursor-pointer" onClick={() => navigate(`/admin/tournaments/${tournament.id}`)}>
                                <TableCell className="font-medium">{tournament.tournament_name}</TableCell>
                                <TableCell>{format(new Date(tournament.start_date), 'MMM dd, yyyy')}</TableCell>
                                <TableCell>{format(new Date(tournament.end_date), 'MMM dd, yyyy')}</TableCell>
                                <TableCell>
                                    <Badge variant={getStatusVariant(tournament.status)} className="capitalize">
                                        {tournament.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => navigate(`/admin/tournaments/${tournament.id}`)}>
                                                <Eye className="mr-2 h-4 w-4" /> View Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => navigate(`/admin/tournaments/${tournament.id}/edit`)}>
                                                <Edit className="mr-2 h-4 w-4" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(tournament.id)}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        );
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Tournaments</h1>
                    <p className="text-muted-foreground">Organize and oversee all league events.</p>
                </div>
                <Button onClick={() => navigate('/admin/tournaments/create')}>
                    <Plus className="mr-2 h-4 w-4" /> Create New
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search tournaments..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="all" className="w-full">
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="ongoing">Ongoing</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4">
                    <TournamentTable statusFilter="all" />
                </TabsContent>
                <TabsContent value="upcoming" className="mt-4">
                    <TournamentTable statusFilter="upcoming" />
                </TabsContent>
                <TabsContent value="ongoing" className="mt-4">
                    <TournamentTable statusFilter="ongoing" />
                </TabsContent>
                <TabsContent value="completed" className="mt-4">
                    <TournamentTable statusFilter="completed" />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ManageTournaments;
