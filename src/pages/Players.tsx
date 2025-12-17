import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Trophy } from 'lucide-react';

export const Players = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const players = [
    {
      id: 1,
      name: 'Ahmed Khan',
      role: 'Batsman',
      city: 'Karachi',
      matches: 45,
      average: 42.5,
      rating: 4.5,
    },
    {
      id: 2,
      name: 'Hassan Ali',
      role: 'Bowler',
      city: 'Lahore',
      matches: 38,
      wickets: 52,
      rating: 4.2,
    },
    {
      id: 3,
      name: 'Imran Malik',
      role: 'All-rounder',
      city: 'Islamabad',
      matches: 50,
      average: 35.8,
      rating: 4.7,
    },
    {
      id: 4,
      name: 'Shahid Raza',
      role: 'Wicket Keeper',
      city: 'Multan',
      matches: 42,
      average: 38.2,
      rating: 4.3,
    },
    {
      id: 5,
      name: 'Bilal Azam',
      role: 'Batsman',
      city: 'Peshawar',
      matches: 35,
      average: 45.6,
      rating: 4.6,
    },
    {
      id: 6,
      name: 'Usman Tariq',
      role: 'Bowler',
      city: 'Quetta',
      matches: 40,
      wickets: 48,
      rating: 4.1,
    },
  ];

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || player.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'Batsman': 'bg-primary/10 text-primary border-primary/20',
      'Bowler': 'bg-secondary/10 text-secondary-foreground border-secondary/20',
      'All-rounder': 'bg-accent/10 text-accent-foreground border-accent/20',
      'Wicket Keeper': 'bg-muted text-muted-foreground border-border',
    };
    return colors[role] || 'bg-muted text-muted-foreground border-border';
  };

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Player Directory</h1>
          <p className="text-muted-foreground text-lg">
            Discover talented cricket players in your area
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-card">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search players by name or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-[200px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="Batsman">Batsman</SelectItem>
                  <SelectItem value="Bowler">Bowler</SelectItem>
                  <SelectItem value="All-rounder">All-rounder</SelectItem>
                  <SelectItem value="Wicket Keeper">Wicket Keeper</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((player) => (
            <Card key={player.id} className="shadow-card hover:shadow-card-hover transition-all hover:-translate-y-1 bg-gradient-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-foreground">{player.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {player.city}
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className={getRoleColor(player.role)}>
                    {player.role}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Matches Played</span>
                  <span className="font-semibold text-foreground">{player.matches}</span>
                </div>
                {player.average && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Batting Average</span>
                    <span className="font-semibold text-foreground">{player.average}</span>
                  </div>
                )}
                {player.wickets && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Wickets Taken</span>
                    <span className="font-semibold text-foreground">{player.wickets}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-medium text-foreground">Rating: {player.rating}/5</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-2 rounded-full ${
                          i < Math.floor(player.rating) ? 'bg-secondary' : 'bg-border'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPlayers.length === 0 && (
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg">
                No players found matching your criteria.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
