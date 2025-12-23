import { useState, useRef, ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { usePlayerProfile, useUpdateProfile, usePlayerStats } from '../../hooks/usePlayer';
import * as authApi from '../../lib/api/auth';
import { profileFormSchema, ProfileFormData } from '../../types/forms.types';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from '../../components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/use-toast';
import { Loader2, Camera, User as UserIcon, Mail, Phone, Shield, Activity, Trophy, TrendingUp } from 'lucide-react';

const PlayerProfile = () => {
    const { user: authUser } = useAuth();
    const { data: profile, isLoading } = usePlayerProfile(authUser?.id);
    const { data: stats, isLoading: statsLoading } = usePlayerStats(authUser?.id);
    const { mutate: updateProfile, isPending: isUpdating } = useUpdateProfile();

    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const form = useForm<ProfileFormData>({
        resolver: zodResolver(profileFormSchema),
        values: {
            full_name: profile?.full_name || '',
            phone: profile?.phone || '',
            player_type: profile?.player_type || 'all-rounder',
            profile_picture: profile?.profile_picture || '',
        },
    });

    if (isLoading || !profile) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
        );
    }

    // Calculate Stats
    const totalRuns = stats?.reduce((acc, curr) => acc + (curr.runs_scored || 0), 0) || 0;
    const totalWickets = stats?.reduce((acc, curr) => acc + (curr.wickets_taken || 0), 0) || 0;
    const totalCatches = stats?.reduce((acc, curr) => acc + (curr.catches || 0), 0) || 0;
    const matchesPlayed = stats?.length || 0;

    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !authUser) return;

        setIsUploading(true);
        try {
            const publicUrl = await authApi.uploadProfilePicture(authUser.id, file);
            form.setValue('profile_picture', publicUrl);
            updateProfile({
                userId: authUser.id,
                data: { profile_picture: publicUrl }
            }, {
                onSuccess: () => {
                    toast({
                        title: "Profile picture updated",
                        description: "Looking good!",
                    });
                }
            });
        } catch (error) {
            console.error('Upload failed', error);
            toast({
                title: "Upload failed",
                description: "Could not upload image. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    const onSubmit = (data: ProfileFormData) => {
        if (!authUser) return;

        updateProfile({ userId: authUser.id, data }, {
            onSuccess: () => {
                setIsEditing(false);
                toast({
                    title: "Profile updated",
                    description: "Your details have been saved successfully.",
                });
            },
            onError: () => {
                toast({
                    title: "Update failed",
                    description: "Could not save changes. Please try again.",
                    variant: "destructive"
                });
            }
        });
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                    <p className="text-muted-foreground">Manage your personal information and settings.</p>
                </div>
                {!isEditing && (
                    <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column: Avatar & Status */}
                <Card className="md:col-span-1">
                    <CardHeader className="text-center">
                        <div className="relative mx-auto h-32 w-32 mb-4 group">
                            <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                                <AvatarImage src={profile.profile_picture || undefined} className="object-cover" />
                                <AvatarFallback className="text-4xl text-muted-foreground">
                                    {profile.full_name?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>

                            <div
                                className="absolute inset-0 flex items-center justify-center rounded-full bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {isUploading ? (
                                    <Loader2 className="h-8 w-8 text-white animate-spin" />
                                ) : (
                                    <Camera className="h-8 w-8 text-white" />
                                )}
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>

                        <CardTitle>{profile.full_name}</CardTitle>
                        <CardDescription className="capitalize">{profile.role}</CardDescription>
                        <div className="mt-4 flex flex-wrap gap-2 justify-center">
                            <Badge variant="secondary" className="capitalize">
                                {profile.player_type?.replace('-', ' ')}
                            </Badge>
                        </div>
                    </CardHeader>
                </Card>

                {/* Right Column: Details Form */}
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Details</CardTitle>
                        <CardDescription>
                            {isEditing ? "Update your information below." : "Your personal details."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isEditing ? (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField
                                        control={form.control}
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
                                                <Input value={profile.email} disabled className="bg-muted" />
                                            </FormControl>
                                            <FormDescription>Email cannot be changed.</FormDescription>
                                        </FormItem>

                                        <FormField
                                            control={form.control}
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

                                    {profile.role !== 'admin' && (
                                        <FormField
                                            control={form.control}
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

                                    <div className="flex justify-end gap-2 mt-6">
                                        <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={isUpdating}>
                                            {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium leading-none text-muted-foreground">Full Name</h4>
                                        <div className="flex items-center gap-2 text-base">
                                            <UserIcon className="h-4 w-4 opacity-70" />
                                            {profile.full_name}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium leading-none text-muted-foreground">Player Type</h4>
                                        <div className="flex items-center gap-2 text-base capitalize">
                                            <Shield className="h-4 w-4 opacity-70" />
                                            {profile.player_type?.replace('-', ' ') || 'N/A'}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium leading-none text-muted-foreground">Email</h4>
                                        <div className="flex items-center gap-2 text-base">
                                            <Mail className="h-4 w-4 opacity-70" />
                                            {profile.email}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-medium leading-none text-muted-foreground">Phone</h4>
                                        <div className="flex items-center gap-2 text-base">
                                            <Phone className="h-4 w-4 opacity-70" />
                                            {profile.phone || 'Not provided'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Stats Summary - Added in this step */}
            <Card>
                <CardHeader>
                    <CardTitle>Career Overview</CardTitle>
                    <CardDescription>A summary of your performance.</CardDescription>
                </CardHeader>
                <CardContent>
                    {statsLoading ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="flex flex-col items-center justify-center p-4 bg-secondary/20 rounded-lg">
                                <Activity className="h-6 w-6 mb-2 text-muted-foreground" />
                                <span className="text-2xl font-bold">{matchesPlayed}</span>
                                <span className="text-xs text-muted-foreground">Matches</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-secondary/20 rounded-lg">
                                <TrendingUp className="h-6 w-6 mb-2 text-muted-foreground" />
                                <span className="text-2xl font-bold">{totalRuns}</span>
                                <span className="text-xs text-muted-foreground">Runs</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-secondary/20 rounded-lg">
                                <Trophy className="h-6 w-6 mb-2 text-muted-foreground" />
                                <span className="text-2xl font-bold">{totalWickets}</span>
                                <span className="text-xs text-muted-foreground">Wickets</span>
                            </div>
                            <div className="flex flex-col items-center justify-center p-4 bg-secondary/20 rounded-lg">
                                <Shield className="h-6 w-6 mb-2 text-muted-foreground" />
                                <span className="text-2xl font-bold">{totalCatches}</span>
                                <span className="text-xs text-muted-foreground">Catches</span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default PlayerProfile;
