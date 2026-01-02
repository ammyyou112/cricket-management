import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { teamService } from '../../services/team.service';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useToast } from '../../components/ui/use-toast';
import { Search, Trash2, Eye, Plus, Shield } from 'lucide-react';
import type { Team } from '../../types/api.types';

export default function ManageTeams() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const loadTeams = async () => {
    try {
      setLoading(true);
      console.log('🔍 Admin: Loading all teams...');
      
      const data = await teamService.getAll({ page: 1, limit: 100 });
      
      // Handle different response formats
      const extractTeamsData = (response: any): Team[] => {
        if (Array.isArray(response)) {
          return response;
        }
        if (response && typeof response === 'object' && 'data' in response && 'pagination' in response) {
          return Array.isArray(response.data) ? response.data : [];
        }
        if (response && typeof response === 'object' && 'data' in response) {
          return Array.isArray(response.data) ? response.data : [];
        }
        return [];
      };

      const teamsData = extractTeamsData(data);
      console.log('✅ Admin: Loaded', teamsData.length, 'teams');
      setTeams(teamsData);
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

  useEffect(() => {
    loadTeams();
  }, []);

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting team:', teamId);
      await teamService.delete(teamId);
      console.log('✅ Team deleted:', teamId);
      
      toast({
        title: 'Success',
        description: 'Team deleted successfully',
      });
      
      // Remove from state
      setTeams(teams.filter(t => t.id !== teamId));
    } catch (err: any) {
      console.error('❌ Failed to delete team:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete team',
        variant: 'destructive',
      });
    }
  };

  const filteredTeams = teams.filter(team => {
    const teamName = team.teamName || team.name || '';
    return teamName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage All Teams</h1>
          <p className="text-gray-600">View and manage all cricket teams (Admin)</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search teams by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Teams Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Teams ({filteredTeams.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTeams.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No teams found</p>
              {searchTerm && (
                <p className="text-gray-400 text-sm mt-2">Try adjusting your search query</p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Team</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Captain</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((team) => (
                    <TableRow key={team.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {team.logoUrl ? (
                            <img 
                              src={team.logoUrl} 
                              alt={team.teamName || team.name || 'Team'} 
                              className="w-10 h-10 rounded-full object-cover border"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <Shield className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <div className="font-semibold">{team.teamName || team.name || 'Unnamed Team'}</div>
                            {team.description && (
                              <div className="text-sm text-muted-foreground line-clamp-1">
                                {team.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {team.captain ? (
                          <div className="text-sm">
                            {team.captain.fullName || team.captain.full_name || 'Unknown'}
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {team._count?.members || team.members?.length || 0} members
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(team.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/teams/${team.id}`)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTeam(team.id, team.teamName || team.name || 'Team')}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

