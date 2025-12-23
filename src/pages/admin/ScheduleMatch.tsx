import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useTournaments } from '../../hooks/useTournament';
import { useAvailableTeams } from '../../hooks/useTeam';
import * as matchApi from '../../lib/api/matches';
import { matchFormSchema, MatchFormData } from '../../types/forms.types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { useToast } from '../../components/ui/use-toast';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { useState } from 'react';

const ScheduleMatch = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: tournaments } = useTournaments();
    const { data: teams } = useAvailableTeams();

    const createMatchMutation = useMutation({
        mutationFn: (data: MatchFormData) => matchApi.createMatch(data, user!.id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['upcomingMatches'] });
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            toast({ title: 'Scheduled', description: 'Match has been successfully scheduled.' });
            navigate('/admin/matches'); // Assuming a match list page exists or back to dashboard
        },
        onError: (err: any) => {
            toast({ title: 'Error', description: err.message || 'Failed to schedule match.', variant: 'destructive' });
        }
    });

    const form = useForm<MatchFormData>({
        resolver: zodResolver(matchFormSchema),
        defaultValues: {
            tournament_id: '',
            team_a_id: '',
            team_b_id: '',
            venue: '',
            status: 'scheduled'
            // Date undefined initially
        }
    });

    const [time, setTime] = useState("10:00"); // Default Time

    const onSubmit = (data: MatchFormData) => {
        // Validation refinement: Teams shouldn't be same is handled by Schema, but double check logic if needed

        // Merge date and time
        const datePart = data.match_date;
        const [hours, minutes] = time.split(':').map(Number);
        datePart.setHours(hours);
        datePart.setMinutes(minutes);

        createMatchMutation.mutate({ ...data, match_date: datePart });
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Schedule Match</h1>
                <p className="text-muted-foreground">Set up fixtures for upcoming tournaments.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Match Details</CardTitle>
                    <CardDescription>Select teams and venue.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                            <FormField
                                control={form.control}
                                name="tournament_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tournament</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select Tournament" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {tournaments?.map(t => (
                                                    <SelectItem key={t.id} value={t.id}>{t.tournament_name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="team_a_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Home Team</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Team A" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {teams?.map(t => (
                                                        <SelectItem key={t.id} value={t.id} disabled={t.id === form.getValues('team_b_id')}>
                                                            {t.team_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="team_b_id"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Away Team</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select Team B" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {teams?.map(t => (
                                                        <SelectItem key={t.id} value={t.id} disabled={t.id === form.getValues('team_a_id')}>
                                                            {t.team_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="match_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date & Time</FormLabel>
                                        <div className="flex gap-2">
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
                                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={field.onChange}
                                                        disabled={(date) => date < new Date()}
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <Input
                                                type="time"
                                                className="w-32"
                                                value={time}
                                                onChange={(e) => setTime(e.target.value)}
                                            />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="venue"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Venue</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Stadium Name, City" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={createMatchMutation.isPending}>
                                {createMatchMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Scheduling...
                                    </>
                                ) : (
                                    'Schedule Match'
                                )}
                            </Button>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};

export default ScheduleMatch;
