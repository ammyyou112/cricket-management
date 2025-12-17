import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Users, MapPin, Shield } from 'lucide-react';
import { toast } from 'sonner';

export const Teams = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');

  const teams = [
    {
      id: 1,
      name: 'Karachi Strikers',
      city: 'Karachi',
      players: 18,
      logo: '🏏',
      skill: 'Professional',
      status: 'Active',
    },
    {
      id: 2,
      name: 'Lahore Warriors',
      city: 'Lahore',
      players: 15,
      logo: '⚡',
      skill: 'Intermediate',
      status: 'Active',
    },
    {
      id: 3,
      name: 'Islamabad Panthers',
      city: 'Islamabad',
      players: 20,
      logo: '🐆',
      skill: 'Professional',
      status: 'Active',
    },
    {
      id: 4,
      name: 'Peshawar Blasters',
      city: 'Peshawar',
      players: 16,
      logo: '💥',
      skill: 'Amateur',
      status: 'Recruiting',
    },
    {
      id: 5,
      name: 'Multan Champions',
      city: 'Multan',
      players: 19,
      logo: '👑',
      skill: 'Professional',
      status: 'Active',
    },
    {
      id: 6,
      name: 'Quetta Knights',
      city: 'Quetta',
      players: 17,
      logo: '🛡️',
      skill: 'Intermediate',
      status: 'Active',
    },
  ];

  const filteredTeams = teams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         team.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = cityFilter === 'all' || team.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  const handleJoinRequest = (teamName: string) => {
    toast.success(`Join request sent to ${teamName}!`);
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Browse Teams</h1>
          <p className="text-muted-foreground text-lg">
            Find and join local cricket teams in your area
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search teams by name or city..."
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
                  <SelectItem value="Karachi">Karachi</SelectItem>
                  <SelectItem value="Lahore">Lahore</SelectItem>
                  <SelectItem value="Islamabad">Islamabad</SelectItem>
                  <SelectItem value="Peshawar">Peshawar</SelectItem>
                  <SelectItem value="Multan">Multan</SelectItem>
                  <SelectItem value="Quetta">Quetta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1 bg-gradient-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{team.logo}</div>
                    <div>
                      <CardTitle className="text-foreground">{team.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" />
                        {team.city}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{team.players} Players</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4 text-primary" />
                    <span>{team.skill}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    team.status === 'Active' 
                      ? 'bg-primary/10 text-primary' 
                      : 'bg-secondary/10 text-secondary-foreground'
                  }`}>
                    {team.status}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleJoinRequest(team.name)}
                    className="bg-gradient-hero hover:opacity-90"
                  >
                    Request to Join
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg">
                No teams found matching your criteria.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
