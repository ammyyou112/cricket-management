import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../hooks/useAuth';
import { useCreateTournament } from '../../hooks/useTournament'; // Assuming separate hook file or export
import * as tournamentApi from '../../lib/api/tournaments'; // Fallback if hook not exported
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentFormSchema, TournamentFormData } from '../../types/forms.types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '../../components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { useToast } from '../../components/ui/use-toast';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

// We might need to extend the Zod schema if we add 'format' or 'team_count' which aren't in base DB type
// For now, will stick to schema but maybe add UI fields that are stored in description or metadata if DB doesn't support them explicitly yet.
// Based on database.types.ts, Tournament has: id, tournament_name, start_date, end_date, created_by, status, created_at
// So 'format' and 'team_count' might need to go into a new column or just be descriptional for now.

const CreateTournament = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Use existing mutation logic pattern
    const createTournamentMutation = useMutation({
        mutationFn: (data: TournamentFormData) => tournamentApi.createTournament(data, user!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
            toast({ title: 'Success', description: 'Tournament created successfully.' });
            navigate('/admin/tournaments');
        },
        onError: (err: any) => {
            toast({ title: 'Error', description: err.message || 'Failed to create tournament.', variant: 'destructive' });
        }
    });

    const form = useForm<TournamentFormData>({
        resolver: zodResolver(tournamentFormSchema),
        defaultValues: {
            tournament_name: '',
            status: 'upcoming',
            // Dates are undefined by default, controlled by Calendar
        },
    });

    const onSubmit = (data: TournamentFormData) => {
        createTournamentMutation.mutate(data);
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Create Tournament</h1>
                <p className="text-muted-foreground">Set up a new league or cup event.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Tournament Details</CardTitle>
                    <CardDescription>Enter the core information for your tournament.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="tournament_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tournament Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Summer Cup 2025" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="start_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>Start Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date < new Date()
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="end_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>End Date</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full pl-3 text-left font-normal",
                                                                !field.value && "text-muted-foreground"
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(field.value, "PPP")
                                                            ) : (
                                                                <span>Pick a date</span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) =>
                                                            date < new Date()
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Extra UI fields not strictly in current Zod schema but useful for MVP expansion */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormItem>
                                    <FormLabel>Format</FormLabel>
                                    <Select>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Format" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="league">League</SelectItem>
                                            <SelectItem value="knockout">Knockout</SelectItem>
                                            <SelectItem value="groups">Group Stage + Knockout</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>Determines the schedule structure (Coming Soon).</FormDescription>
                                </FormItem>

                                <FormItem>
                                    <FormLabel>Max Teams</FormLabel>
                                    <Input type="number" placeholder="8" min={2} />
                                </FormItem>
                            </div>

                            <Button type="submit" className="w-full" disabled={createTournamentMutation.isPending}>
                                {createTournamentMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Tournament'
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateTournament;
