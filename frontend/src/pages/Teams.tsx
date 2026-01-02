import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { teamService } from '../services/team.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Search, Users, MapPin, Shield, Plus } from 'lucide-react';
import type { Team } from '../types/api.types';

export const Teams = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔍 Fetching teams...');
        const teamsRes = await teamService.getAll({ page: 1, limit: 100 });

        console.log('✅ Teams response:', teamsRes);

        // Handle different response formats - backend returns paginated response
        const extractTeamsData = (response: any): Team[] => {
          if (Array.isArray(response)) {
            return response;
          }
          // Check if it's a PaginatedResponse object
          if (response && typeof response === 'object' && 'data' in response && 'pagination' in response) {
            return Array.isArray(response.data) ? response.data : [];
          }
          // Check if it has a data property
          if (response && typeof response === 'object' && 'data' in response) {
            return Array.isArray(response.data) ? response.data : [];
          }
          return [];
        };

        const teamsData = extractTeamsData(teamsRes);
        console.log('✅ Extracted teams:', teamsData.length, teamsData);

        setTeams(teamsData);
      } catch (err: any) {
        console.error('❌ Failed to load teams:', err);
        setError(err.message || 'Failed to load teams');
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  // Filter teams based on search and city
  const filteredTeams = teams.filter(team => {
    const teamName = team.teamName || team.name || '';
    const city = team.city || '';
    const description = team.description || '';
    
    const matchesSearch = 
      teamName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCity = cityFilter === 'all' || city === cityFilter;
    
    return matchesSearch && matchesCity;
  });

  // Get unique cities from teams
  const cities = Array.from(new Set(teams.map(t => t.city).filter(Boolean))).sort();

  // Check if user can create teams (Captain or Admin)
  const canCreateTeam = user?.role === 'CAPTAIN' || user?.role === 'ADMIN' || user?.role === 'captain' || user?.role === 'admin';

  const handleCreateTeam = () => {
    // Admin can create teams, navigate to team creation
    if (user?.role === 'ADMIN' || user?.role === 'admin') {
      navigate('/captain/team/create');
    } else if (user?.role === 'CAPTAIN' || user?.role === 'captain') {
      navigate('/captain/team/create');
    } else {
      navigate('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-4 w-24 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load teams: {error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-foreground">Browse Teams</h1>
            <p className="text-muted-foreground text-lg">
              Find and join local cricket teams in your area
            </p>
          </div>
          {canCreateTeam && (
            <Button onClick={handleCreateTeam} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams by name, city, or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <Link 
              key={team.id} 
              to={`/player/teams/${team.id}`}
              className="block"
            >
              <Card className="shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1 bg-gradient-card cursor-pointer">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {team.logoUrl ? (
                        <img 
                          src={team.logoUrl} 
                          alt={team.teamName || team.name || 'Team logo'} 
                          className="h-12 w-12 rounded-full object-cover border-2"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-2xl">
                          🏏
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-foreground truncate">
                          {team.teamName || team.name || 'Unnamed Team'}
                        </CardTitle>
                        {team.city && (
                          <CardDescription className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {team.city}
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {team.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {team.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4 text-primary" />
                      <span>{team._count?.members || team.members?.length || 0} Members</span>
                    </div>
                    {team.captain && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Shield className="h-4 w-4 text-primary" />
                        <span className="truncate max-w-[100px]">
                          {team.captain.fullName || team.captain.full_name}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-primary/10 text-primary">
                      Active
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate(`/teams/${team.id}`);
                      }}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg">
                {searchQuery || cityFilter !== 'all' 
                  ? 'No teams found matching your criteria.'
                  : 'No teams available yet.'}
              </p>
              {canCreateTeam && (
                <Button onClick={handleCreateTeam} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Create the First Team
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Teams;
