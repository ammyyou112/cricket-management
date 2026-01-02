import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMyTeams, useTeamMembers } from '../../hooks/useTeam';
import { teamService } from '../../services/team.service';
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
import { Settings, UserMinus, Plus, Shield, Mail, Loader2, Camera, Users, BarChart3 } from 'lucide-react';
import type { Team } from '../../types/api.types';

// Schema for editing team
const teamSchema = z.object({
    team_name: z.string().min(3, 'Name must be at least 3 characters'),
    description: z.string().optional(),
    logo_url: z.string().optional(),
});

type TeamFormValues = z.infer<typeof teamSchema>;

const TeamManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load captain's teams
    useEffect(() => {
        const loadMyTeams = async () => {
            try {
                setLoading(true);
                console.log('🔍 Captain: Loading teams...');
                
                const data = await teamService.getMyTeams();
                const teamsData = Array.isArray(data) ? data : (data?.data || []);
                
                // Filter to show only teams where user is captain
                const myTeams = teamsData.filter(t => t.captainId === user?.id);
                
                console.log('✅ Captain teams loaded:', myTeams.length);
                setTeams(myTeams);
                
                if (myTeams.length > 0) {
                    setSelectedTeam(myTeams[0]);
                }
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

        if (user?.id) {
            loadMyTeams();
        }
    }, [user?.id, toast]);

    // Get team members for selected team
    const { data: squad, isLoading: squadLoading, refetch: refetchSquad, error: squadError } = useTeamMembers(selectedTeam?.id);
    
    // Debug logging
    useEffect(() => {
        console.log('📊 TeamManagement Squad State:', {
            selectedTeamId: selectedTeam?.id,
            squad: squad,
            squadCount: squad?.length || 0,
            squadLoading: squadLoading,
            squadError: squadError,
        });
    }, [selectedTeam?.id, squad, squadLoading, squadError]);
    
    // Refetch squad when selectedTeam changes
    useEffect(() => {
        if (selectedTeam?.id) {
            console.log('🔄 Refetching squad for team:', selectedTeam.id);
            refetchSquad();
        }
    }, [selectedTeam?.id, refetchSquad]);

    const updateTeamMutation = useMutation({
        mutationFn: async (data: Partial<TeamFormValues> & { id: string }) => {
            console.log('🔵 Updating team:', data.id, data);
            const updatedTeam = await teamService.update(data.id, {
                name: data.team_name,
                description: data.description,
                logoUrl: data.logo_url,
            });
            return updatedTeam;
        },
        onSuccess: (updatedTeam) => {
            console.log('✅ Team updated:', updatedTeam);
            queryClient.invalidateQueries({ queryKey: ['myTeams'] });
            setIsEditDialogOpen(false);
            toast({ title: 'Success', description: 'Team details updated.' });
            // Update selected team
            if (selectedTeam) {
                setSelectedTeam({ ...selectedTeam, ...updatedTeam });
            }
        },
        onError: (err: any) => {
            console.error('❌ Failed to update team:', err);
            toast({ title: 'Error', description: err.message || 'Failed to update team.', variant: 'destructive' });
        },
    });

    const removePlayerMutation = useMutation({
        mutationFn: async ({ teamId, playerId }: { teamId: string; playerId: string }) => {
            console.log('🔵 Removing player:', playerId, 'from team:', teamId);
            await teamService.removeMember(teamId, playerId);
            return { teamId, playerId };
        },
        onSuccess: () => {
            console.log('✅ Player removed from team');
            queryClient.invalidateQueries({ queryKey: ['teamMembers'] });
            queryClient.invalidateQueries({ queryKey: ['myTeams'] });
            toast({ title: 'Success', description: 'Player removed from team.' });
        },
        onError: (err: any) => {
            console.error('❌ Failed to remove player:', err);
            toast({ title: 'Error', description: err.message || 'Failed to remove player.', variant: 'destructive' });
        },
    });

    const form = useForm<TeamFormValues>({
        resolver: zodResolver(teamSchema),
        defaultValues: {
            team_name: '',
            description: '',
            logo_url: '',
        },
    });

    // Update form when selectedTeam changes
    useEffect(() => {
        if (selectedTeam) {
            form.reset({
                team_name: selectedTeam.teamName || selectedTeam.name || '',
                description: selectedTeam.description || '',
                logo_url: selectedTeam.logoUrl || '',
            });
        }
    }, [selectedTeam, form]);

    // Handle Logo Upload
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedTeam) return;

        setLogoFile(file);
    };

    const handleUploadLogo = async () => {
        if (!selectedTeam || !logoFile) return;

        try {
            setIsUploading(true);
            console.log('📤 Uploading logo for team:', selectedTeam.id);
            
            const logoUrl = await teamService.uploadLogo(selectedTeam.id, logoFile);
            
            console.log('✅ Logo uploaded:', logoUrl);
            toast({
                title: 'Success',
                description: 'Team logo uploaded successfully!',
            });
            
            // Update selected team with new logo URL
            setSelectedTeam({ ...selectedTeam, logoUrl });
            
            // Update form
            form.setValue('logo_url', logoUrl);
            
            // Reload teams to get updated data
            const data = await teamService.getMyTeams();
            const teamsData = Array.isArray(data) ? data : [];
            const myTeams = teamsData.filter(t => t.captainId === user?.id);
            setTeams(myTeams);
            const updatedTeam = myTeams.find(t => t.id === selectedTeam.id);
            if (updatedTeam) {
                setSelectedTeam(updatedTeam);
            }
            
            setLogoFile(null);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err: any) {
            console.error('❌ Failed to upload logo:', err);
            toast({
                title: 'Error',
                description: err.message || 'Failed to upload logo',
                variant: 'destructive',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = (data: TeamFormValues) => {
        if (!selectedTeam) return;
        updateTeamMutation.mutate({ 
            id: selectedTeam.id, 
            team_name: data.team_name,
            description: data.description,
            logo_url: data.logo_url,
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading team management...</p>
                </div>
            </div>
        );
    }

    if (teams.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="text-6xl mb-4">🏏</div>
                    <h2 className="text-2xl font-bold mb-2">No Team Found</h2>
                    <p className="text-gray-600 mb-6">You haven't created a team yet.</p>
                    <Button onClick={() => navigate('/captain/team/create')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Team
                    </Button>
                </div>
            </div>
        );
    }

    if (!selectedTeam) {
        return null;
    }

    const captainTeam = selectedTeam;

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
                                    <AvatarImage src={captainTeam.logoUrl || undefined} />
                                    <AvatarFallback className="text-xl">
                                        {(captainTeam.teamName || captainTeam.name || 'TM').substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div
                                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {isUploading ? <Loader2 className="h-6 w-6 text-white animate-spin" /> : <Camera className="h-6 w-6 text-white" />}
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*" 
                                    onChange={handleFileChange} 
                                />
                                {logoFile && (
                                    <div className="mt-2">
                                        <Button
                                            onClick={handleUploadLogo}
                                            disabled={isUploading}
                                            size="sm"
                                            className="w-full"
                                        >
                                            {isUploading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Uploading...
                                                </>
                                            ) : (
                                                'Upload Logo'
                                            )}
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <CardTitle className="text-2xl">{captainTeam.teamName || captainTeam.name}</CardTitle>
                                <CardDescription>Created: {new Date(captainTeam.createdAt).toLocaleDateString()}</CardDescription>
                                <Badge variant="secondary">Captain: {user?.full_name || user?.fullName}</Badge>
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
                                                    <FormControl>
                                                        <Input 
                                                            {...field} 
                                                            value={field.value || ''}
                                                        />
                                                    </FormControl>
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
                <CardFooter className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => navigate('/captain/invite')}
                        className="flex-1"
                    >
                        <Users className="mr-2 h-4 w-4" />
                        Invite Players
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/captain/requests')}
                        className="flex-1"
                    >
                        <Mail className="mr-2 h-4 w-4" />
                        Join Requests
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/captain/stats')}
                        className="flex-1"
                    >
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Statistics
                    </Button>
                </CardFooter>
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
                                                    <AvatarImage src={member.player?.profilePictureUrl || member.player?.profile_picture} />
                                                    <AvatarFallback>
                                                        {(member.player?.fullName || member.player?.full_name || 'P')?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span>{member.player?.fullName || member.player?.full_name}</span>
                                                    <span className="text-xs text-muted-foreground">{member.player?.email}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {member.player?.id === user?.id ? (
                                                <Badge>Captain</Badge>
                                            ) : (
                                                <div className="capitalize text-sm text-muted-foreground">
                                                    {(member.player?.playerType || member.player?.player_type || 'Player')?.replace('_', ' ')}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {member.joinedAt || member.joined_at
                                                ? new Date(member.joinedAt || member.joined_at).toLocaleDateString()
                                                : 'Recently'}
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
