import { useState, useRef, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useMyTeams, useTeamMembers } from '../../hooks/useTeam';
import * as teamApi from '../../lib/api/teams';
import * as authApi from '../../lib/api/auth'; // Reusing upload logic or storage
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../../components/ui/form';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/use-toast';
import { Settings, UserMinus, Plus, Shield, Mail, Loader2, Camera } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// Schema for editing team
const teamSchema = z.object({
    team_name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().optional(),
    logo_url: z.string().optional(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

const TeamManagement = () => {
    const { user } = useAuth();
    const { data: myTeams, isLoading: teamsLoading } = useMyTeams(user?.id);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Identify the captain's team
    const captainTeam = myTeams?.find(t => t.captain_id === user?.id);

    // Create hooks manually since they weren't all exported in useTeam.ts
    const { data: squad, isLoading: squadLoading } = useTeamMembers(captainTeam?.id);

    const updateTeamMutation = useMutation({
        mutationFn: (data: Partial<TeamFormValues> & { id: string }) =>
            teamApi.updateTeam(data.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['myTeams'] });
            setIsEditDialogOpen(false);
            toast({ title: 'Success', description: 'Team details updated.' });
        },
        onError: () => toast({ title: 'Error', description: 'Failed to update team.', variant: 'destructive' }),
    });

    const removePlayerMutation = useMutation({
        mutationFn: ({ teamId, playerId }: { teamId: string; playerId: string }) =>
            teamApi.removePlayerFromTeam(teamId, playerId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
            toast({ title: 'Success', description: 'Player removed from team.' });
        },
        onError: () => toast({ title: 'Error', description: 'Failed to remove player.', variant: 'destructive' }),
    });

    const form = useForm<TeamFormValues>({
        resolver: zodResolver(teamSchema),
        values: {
            team_name: captainTeam?.team_name || '',
            description: captainTeam?.description || '',
            logo_url: captainTeam?.logo_url || '',
        },
    });

    // Handle Logo Upload (Simulated using existing buckets or similar logic)
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !captainTeam) return;

        setIsUploading(true);
        try {
            // Reusing logic: upload to a folder named 'teams' or similar in the 'avatars' bucket for simplicity
            // Or creating a new bucket. Assuming 'avatars' is public and available.
            const fileExt = file.name.split('.').pop();
            const fileName = `team_${captainTeam.id}_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
            const publicUrl = data.publicUrl;

            // Update form and immediately update team
            form.setValue('logo_url', publicUrl);
            updateTeamMutation.mutate({ id: captainTeam.id, logo_url: publicUrl });

        } catch (error) {
            console.error(error);
            toast({ title: 'Error', description: 'Logo upload failed', variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = (data: TeamFormValues) => {
        if (!captainTeam) return;
        updateTeamMutation.mutate({ id: captainTeam.id, ...data });
    };

    if (teamsLoading) return <Skeleton className="h-96 w-full" />;
    if (!captainTeam) return <div>No team found. Please create one.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                <Button onClick={() => { }}>
                    <Plus className="mr-2 h-4 w-4" /> Invite Player
                </Button>
            </div>

            {/* Team Details Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <Avatar className="h-20 w-20 border-2 border-primary/20">
                                    <AvatarImage src={captainTeam.logo_url || undefined} />
                                    <AvatarFallback className="text-xl">{captainTeam.team_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div
                                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {isUploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
                                </div>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-2xl">{captainTeam.team_name}</CardTitle>
                                <CardDescription>Created: {new Date(captainTeam.created_at).toLocaleDateString()}</CardDescription>
                                <Badge variant="secondary">Captain: {user?.full_name}</Badge>
                            </div>
                        </div>

                        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <Settings className="mr-2 h-4 w-4" /> Edit Details
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Edit Team Details</DialogTitle>
                                    <DialogDescription>Update your team's public information.</DialogDescription>
                                </DialogHeader>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="team_name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Team Name</FormLabel>
                                                    <FormControl><Input {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Description</FormLabel>
                                                    <FormControl><Textarea {...field} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <DialogFooter>
                                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
                                            <Button type="submit" disabled={updateTeamMutation.isPending}>Save Changes</Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{captainTeam.description || "No description provided."}</p>
                </CardContent>
            </Card>

            {/* Squad List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-xl font-semibold tracking-tight">Active Squad</h2>
                    <Badge variant="outline" className="text-base py-1 px-4">{squad?.length || 0} Members</Badge>
                </div>

                <Card>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Player</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {squadLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">Loading squad...</TableCell>
                                </TableRow>
                            ) : squad && squad.length > 0 ? (
                                squad.map((member: any) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={member.player?.profile_picture} />
                                                    <AvatarFallback>{member.player?.full_name?.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span>{member.player?.full_name}</span>
                                                    <span className="text-xs text-muted-foreground">{member.player?.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {member.player?.id === user?.id ? (
                                                <Badge>Captain</Badge>
                                            ) : (
                                                <div className="capitalize text-sm text-muted-foreground">
                                                    {member.player?.player_type?.replace('-', ' ') || 'Player'}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {new Date(member.joined_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {member.player?.id !== user?.id && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to remove this player?')) {
                                                            removePlayerMutation.mutate({ teamId: captainTeam.id, playerId: member.player?.id });
                                                        }
                                                    }}
                                                >
                                                    <UserMinus className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        No players in the squad yet. Invite some!
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    );
};

export default TeamManagement;
