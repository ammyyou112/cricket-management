import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Calendar, MapPin, Users, UserPlus, UserMinus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const Tournaments = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [registeredTournaments, setRegisteredTournaments] = useState<number[]>([]);
  const tournaments = [
    {
      id: 1,
      name: 'Karachi Premier League 2025',
      status: 'Ongoing',
      startDate: '2025-10-01',
      endDate: '2025-11-15',
      location: 'Karachi',
      teams: 12,
      format: 'T20',
    },
    {
      id: 2,
      name: 'Lahore Corporate Cup',
      status: 'Registration Open',
      startDate: '2025-11-01',
      endDate: '2025-11-30',
      location: 'Lahore',
      teams: 8,
      format: 'One Day',
    },
    {
      id: 3,
      name: 'Islamabad Champions Trophy',
      status: 'Upcoming',
      startDate: '2025-12-01',
      endDate: '2025-12-20',
      location: 'Islamabad',
      teams: 16,
      format: 'T20',
    },
    {
      id: 4,
      name: 'Punjab Zone Championship',
      status: 'Registration Open',
      startDate: '2025-11-15',
      endDate: '2025-12-31',
      location: 'Faisalabad',
      teams: 10,
      format: 'T20',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ongoing':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Registration Open':
        return 'bg-secondary/10 text-secondary-foreground border-secondary/20';
      case 'Upcoming':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const handleRegister = (tournamentId: number, tournamentName: string) => {
    if (registeredTournaments.includes(tournamentId)) {
      setRegisteredTournaments(registeredTournaments.filter(id => id !== tournamentId));
      toast({
        title: "Registration Cancelled",
        description: `You have unregistered from ${tournamentName}`,
      });
    } else {
      setRegisteredTournaments([...registeredTournaments, tournamentId]);
      toast({
        title: "Registration Successful",
        description: `You have successfully registered for ${tournamentName}`,
      });
    }
  };

  const isRegistered = (tournamentId: number) => registeredTournaments.includes(tournamentId);

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">Tournaments</h1>
          <p className="text-muted-foreground text-lg">
            Participate in exciting cricket tournaments across Pakistan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="shadow-card hover:shadow-card-hover transition-all bg-gradient-card">
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-hero rounded-lg">
                      <Trophy className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-foreground">{tournament.name}</CardTitle>
                    </div>
                  </div>
                  <Badge variant="outline" className={getStatusColor(tournament.status)}>
                    {tournament.status}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" />
                  {tournament.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Start Date
                    </p>
                    <p className="font-medium text-foreground">
                      {new Date(tournament.startDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      End Date
                    </p>
                    <p className="font-medium text-foreground">
                      {new Date(tournament.endDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4 text-primary" />
                      <span>{tournament.teams} Teams</span>
                    </div>
                    <div className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                      {tournament.format}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {tournament.status === 'Registration Open' && (
                      <Button 
                        variant={isRegistered(tournament.id) ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleRegister(tournament.id, tournament.name)}
                      >
                        {isRegistered(tournament.id) ? (
                          <>
                            <UserMinus className="h-4 w-4 mr-1" />
                            Unregister
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4 mr-1" />
                            Register
                          </>
                        )}
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/tournaments/${tournament.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
