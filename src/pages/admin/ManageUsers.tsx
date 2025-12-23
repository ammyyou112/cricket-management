import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as playerApi from '../../lib/api/players'; // Assuming generic user management is similar or we expand this
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { useToast } from '../../components/ui/use-toast';
import { Search, MoreHorizontal, Shield, User, Trophy, Eye, Ban, Trash } from 'lucide-react';

const ManageUsers = () => {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [selectedUser, setSelectedUser] = useState<any>(null); // For viewing details
    const [userToDelete, setUserToDelete] = useState<string | null>(null);

    // Fetch all users - Ideally use paginated API for production
    const { data: users, isLoading } = useQuery({
        queryKey: ['allUsers'],
        // For now using getAllPlayers but ideally should be getAllUsers (admin functionality)
        // Since we don't have a dedicated getAllUsers in api/players.ts that returns ALL roles, 
        // let's assume getAllPlayers returns a mix or we need to update the API.
        // Assuming getAllPlayers currently filters by role='player'. 
        // We will stick to what we have or generic search logic.
        queryFn: playerApi.getAllPlayers
    });

    const filteredUsers = users?.filter((u: any) => {
        const matchesSearch =
            u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || u.role === roleFilter;
        return matchesSearch && matchesRole;
    }) || [];

    // Mock deletion logic - API needs implementation for hard delete or soft delete
    const deleteUserMutation = useMutation({
        mutationFn: async (userId: string) => {
            // await api.deleteUser(userId);
            return Promise.resolve();
        },
        onSuccess: () => {
            // Invalidate list
            toast({ title: 'User Deleted', description: 'User has been removed from the system.' });
            setUserToDelete(null);
        },
        onError: () => {
            toast({ title: 'Error', description: 'Could not delete user.', variant: 'destructive' });
        }
    });

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'admin': return <Trophy className="h-3 w-3 mr-1" />;
            case 'captain': return <Shield className="h-3 w-3 mr-1" />;
            default: return <User className="h-3 w-3 mr-1" />;
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Manage Users</h1>
                <p className="text-muted-foreground">Administration of all registered accounts.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search users..."
                        className="pl-8 bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter Role" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="player">Player</SelectItem>
                        <SelectItem value="captain">Captain</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Loading users...</TableCell>
                            </TableRow>
                        ) : filteredUsers.length > 0 ? (
                            filteredUsers.map((user: any) => (
                                <TableRow key={user.id}>
                                    <TableCell className="flex items-center gap-3 font-medium">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.profile_picture} />
                                            <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span>{user.full_name}</span>
                                            <span className="text-xs text-muted-foreground">{user.email}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="capitalize flex w-fit items-center">
                                            {getRoleIcon(user.role)}
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="capitalize text-muted-foreground text-sm">
                                        {user.player_type?.replace('-', ' ') || '-'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(user.created_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => setSelectedUser(user)}>
                                                    <Eye className="mr-2 h-4 w-4" /> View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-destructive" onClick={() => setUserToDelete(user.id)}>
                                                    <Trash className="mr-2 h-4 w-4" /> Delete User
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                                    No users found matching filters.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* View Details Dialog */}
            <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>User Profile</DialogTitle>
                    </DialogHeader>
                    {selectedUser && (
                        <div className="space-y-4">
                            <div className="flex flex-col items-center p-4 bg-muted/20 rounded-lg">
                                <Avatar className="h-24 w-24 mb-4">
                                    <AvatarImage src={selectedUser.profile_picture} />
                                    <AvatarFallback>{selectedUser.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <h2 className="text-xl font-bold">{selectedUser.full_name}</h2>
                                <p className="text-muted-foreground">{selectedUser.email}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Role</span>
                                    <p className="capitalize font-medium flex items-center gap-2">
                                        {getRoleIcon(selectedUser.role)} {selectedUser.role}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Player Type</span>
                                    <p className="capitalize font-medium">{selectedUser.player_type?.replace('-', ' ') || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Joined</span>
                                    <p className="font-medium">{new Date(selectedUser.created_at).toDateString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-medium text-muted-foreground uppercase">Phone</span>
                                    <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setUserToDelete(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={() => userToDelete && deleteUserMutation.mutate(userToDelete)}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ManageUsers;
