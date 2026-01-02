import { useState, useRef, ChangeEvent, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { useMyTeams } from '../hooks/useTeam';
import * as authApi from '../lib/api/auth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '../components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Skeleton } from '../components/ui/skeleton';
import { useToast } from '../components/ui/use-toast';
import { Loader2, Camera, User, Mail, Phone, Shield, Lock, Image as ImageIcon } from 'lucide-react';

// Profile form schema
const profileFormSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: z.string().optional(),
    player_type: z.enum(['batsman', 'bowler', 'all-rounder', 'wicket-keeper']).optional(),
});

// Password form schema
const passwordFormSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileFormSchema>;
type PasswordFormData = z.infer<typeof passwordFormSchema>;

const Settings = () => {
    const { user, updateProfile } = useAuth();
    const queryClient = useQueryClient();
    const { data: myTeams } = useMyTeams(user?.id);
    const { toast } = useToast();
    
    const [isUploadingProfile, setIsUploadingProfile] = useState(false);
    const [isUploadingTeamLogo, setIsUploadingTeamLogo] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(user?.profile_picture || null);
    const [teamLogoUrl, setTeamLogoUrl] = useState<string | null>(null);
    const profileFileInputRef = useRef<HTMLInputElement>(null);
    const teamLogoFileInputRef = useRef<HTMLInputElement>(null);

    // Get captain's team (if user is captain)
    const captainTeam = myTeams?.find(t => t.captain_id === user?.id);
    
    // Sync profile picture URL with user state
    useEffect(() => {
        if (user?.profile_picture) {
            setProfilePictureUrl(user.profile_picture);
        }
    }, [user?.profile_picture]);
    
    // Sync team logo URL with captainTeam state
    useEffect(() => {
        if (captainTeam?.logo_url) {
            setTeamLogoUrl(captainTeam.logo_url);
        }
    }, [captainTeam?.logo_url]);

    const profileForm = useForm<ProfileFormData>({
        resolver: zodResolver(profileFormSchema),
        values: {
            full_name: user?.full_name || '',
            phone: user?.phone || '',
            player_type: user?.player_type as any || undefined,
        },
    });

    const passwordForm = useForm<PasswordFormData>({
        resolver: zodResolver(passwordFormSchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    // Handle profile picture upload
    const handleProfilePictureUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        setIsUploadingProfile(true);
        try {
            // Upload the file
            const publicUrl = await authApi.uploadProfilePicture(user.id, file);
            
            // Update local state immediately for instant UI update
            setProfilePictureUrl(publicUrl);
            
            // Update profile in backend and auth store
            await updateProfile({ profile_picture: publicUrl });
            
            toast({
                title: "Profile picture updated",
                description: "Your profile picture has been updated successfully.",
            });
        } catch (error: any) {
            // Revert on error
            setProfilePictureUrl(user.profile_picture || null);
            toast({
                title: "Upload failed",
                description: error.message || "Could not upload image. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsUploadingProfile(false);
        }
    };

    // Handle team logo upload (captain only)
    const handleTeamLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !captainTeam) return;

        setIsUploadingTeamLogo(true);
        try {
            // Upload the file
            const publicUrl = await authApi.uploadTeamLogo(captainTeam.id, file);
            
            // Update local state immediately for instant UI update
            setTeamLogoUrl(publicUrl);
            
            // Invalidate and refetch team queries to update all team data
            await queryClient.invalidateQueries({ queryKey: ['myTeams', user?.id] });
            await queryClient.invalidateQueries({ queryKey: ['team', captainTeam.id] });
            
            toast({
                title: "Team logo updated",
                description: "Your team logo has been updated successfully.",
            });
        } catch (error: any) {
            // Revert on error
            setTeamLogoUrl(captainTeam.logo_url || null);
            toast({
                title: "Upload failed",
                description: error.message || "Could not upload logo. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsUploadingTeamLogo(false);
        }
    };

    // Handle profile update
    const onProfileSubmit = async (data: ProfileFormData) => {
        if (!user) return;

        try {
            await updateProfile({
                full_name: data.full_name,
                phone: data.phone,
                player_type: data.player_type,
            });
            toast({
                title: "Profile updated",
                description: "Your profile has been updated successfully.",
            });
        } catch (error: any) {
            toast({
                title: "Update failed",
                description: error.message || "Could not save changes. Please try again.",
                variant: "destructive"
            });
        }
    };

    // Handle password change
    const onPasswordSubmit = async (data: PasswordFormData) => {
        setIsChangingPassword(true);
        try {
            await authApi.changePassword(data.currentPassword, data.newPassword);
            toast({
                title: "Password changed",
                description: "Your password has been changed successfully.",
            });
            passwordForm.reset();
        } catch (error: any) {
            toast({
                title: "Password change failed",
                description: error.message || "Could not change password. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (!user) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <Skeleton className="h-96 w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            <Tabs defaultValue="profile" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="password">Password</TabsTrigger>
                    {captainTeam && <TabsTrigger value="team">Team</TabsTrigger>}
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Picture</CardTitle>
                            <CardDescription>Update your profile picture</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6">
                                <div className="relative group">
                                    <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                        <AvatarImage src={profilePictureUrl || user.profile_picture || undefined} className="object-cover" />
                                        <AvatarFallback className="text-2xl text-muted-foreground">
                                            {user.full_name?.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div
                                        className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                        onClick={() => profileFileInputRef.current?.click()}
                                    >
                                        {isUploadingProfile ? (
                                            <Loader2 className="h-6 w-6 text-white animate-spin" />
                                        ) : (
                                            <Camera className="h-6 w-6 text-white" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={profileFileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleProfilePictureUpload}
                                    />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Click on the avatar to upload a new profile picture.
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Recommended: Square image, max 5MB
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Information</CardTitle>
                            <CardDescription>Update your personal details</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...profileForm}>
                                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                                    <FormField
                                        control={profileForm.control}
                                        name="full_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Your name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input value={user.email} disabled className="bg-muted" />
                                            </FormControl>
                                            <FormDescription>Email cannot be changed.</FormDescription>
                                        </FormItem>

                                        <FormField
                                            control={profileForm.control}
                                            name="phone"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Phone</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="+1234567890" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {user.role !== 'admin' && (
                                        <FormField
                                            control={profileForm.control}
                                            name="player_type"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Player Type</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue placeholder="Select type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="batsman">Batsman</SelectItem>
                                                            <SelectItem value="bowler">Bowler</SelectItem>
                                                            <SelectItem value="all-rounder">All-Rounder</SelectItem>
                                                            <SelectItem value="wicket-keeper">Wicket-Keeper</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )}

                                    <div className="flex justify-end">
                                        <Button type="submit">Save Changes</Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Password Tab */}
                <TabsContent value="password" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Change Password</CardTitle>
                            <CardDescription>Update your password to keep your account secure</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...passwordForm}>
                                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                                    <FormField
                                        control={passwordForm.control}
                                        name="currentPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Current Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="••••••" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={passwordForm.control}
                                        name="newPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>New Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="••••••" {...field} />
                                                </FormControl>
                                                <FormDescription>
                                                    Must be at least 8 characters with uppercase, lowercase, and a number.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={passwordForm.control}
                                        name="confirmPassword"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Confirm New Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="••••••" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="flex justify-end">
                                        <Button type="submit" disabled={isChangingPassword}>
                                            {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Change Password
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Team Tab (Captain only) */}
                {captainTeam && (
                    <TabsContent value="team" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Team Logo</CardTitle>
                                <CardDescription>Update your team logo</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-6">
                                    <div className="relative group">
                                        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                                            <AvatarImage src={teamLogoUrl || captainTeam.logo_url || undefined} className="object-cover" />
                                            <AvatarFallback className="text-2xl text-muted-foreground">
                                                <ImageIcon className="h-8 w-8" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div
                                            className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                            onClick={() => teamLogoFileInputRef.current?.click()}
                                        >
                                            {isUploadingTeamLogo ? (
                                                <Loader2 className="h-6 w-6 text-white animate-spin" />
                                            ) : (
                                                <Camera className="h-6 w-6 text-white" />
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            ref={teamLogoFileInputRef}
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleTeamLogoUpload}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{captainTeam.team_name}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Click on the logo to upload a new team logo.
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Recommended: Square image, max 5MB
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default Settings;

