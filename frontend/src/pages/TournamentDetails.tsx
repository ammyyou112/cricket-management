import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Calendar, MapPin, Users, ArrowLeft, Target } from 'lucide-react';

export const TournamentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Mock tournament data - in production, fetch based on ID
  const tournaments: Record<string, any> = {
    '1': {
      name: 'Karachi Premier League 2025',
      status: 'Ongoing',
      startDate: '2025-10-01',
      endDate: '2025-11-15',
      location: 'Karachi',
      teams: 12,
      format: 'T20',
      description: 'The most exciting T20 cricket tournament in Karachi featuring top local teams competing for the championship trophy.',
      venue: 'National Stadium Complex',
      prizePool: 'Rs 500,000',
    },
    '2': {
      name: 'Lahore Corporate Cup',
      status: 'Registration Open',
      startDate: '2025-11-01',
      endDate: '2025-11-30',
      location: 'Lahore',
      teams: 8,
      format: 'One Day',
      description: 'Corporate cricket tournament bringing together the best office teams from across Lahore.',
      venue: 'Gaddafi Stadium',
      prizePool: 'Rs 300,000',
    },
    '3': {
      name: 'Islamabad Champions Trophy',
      status: 'Upcoming',
      startDate: '2025-12-01',
      endDate: '2025-12-20',
      location: 'Islamabad',
      teams: 16,
      format: 'T20',
      description: 'Premier T20 tournament featuring 16 elite teams from Islamabad and surrounding areas.',
      venue: 'Rawalpindi Cricket Stadium',
      prizePool: 'Rs 750,000',
    },
    '4': {
      name: 'Punjab Zone Championship',
      status: 'Registration Open',
      startDate: '2025-11-15',
      endDate: '2025-12-31',
      location: 'Faisalabad',
      teams: 10,
      format: 'T20',
      description: 'Regional championship showcasing the best cricket talent from Punjab.',
      venue: 'Iqbal Stadium',
      prizePool: 'Rs 600,000',
    },
  };

  const tournament = tournaments[id || '1'];

  const participatingTeams = [
    { name: 'Karachi Strikers', wins: 5, losses: 1, points: 10 },
    { name: 'Clifton Warriors', wins: 4, losses: 2, points: 8 },
    { name: 'Gulshan Blasters', wins: 4, losses: 2, points: 8 },
    { name: 'Defence Panthers', wins: 3, losses: 3, points: 6 },
    { name: 'Malir Tigers', wins: 3, losses: 3, points: 6 },
    { name: 'Saddar Mavericks', wins: 2, losses: 4, points: 4 },
  ];

  const upcomingMatches = [
    {
      id: 1,
      team1: 'Karachi Strikers',
      team2: 'Clifton Warriors',
      date: '2025-10-25',
      time: '15:00',
      venue: 'Ground A',
    },
    {
      id: 2,
      team1: 'Gulshan Blasters',
      team2: 'Defence Panthers',
      date: '2025-10-25',
      time: '18:00',
      venue: 'Ground B',
    },
    {
      id: 3,
      team1: 'Malir Tigers',
      team2: 'Saddar Mavericks',
      date: '2025-10-26',
      time: '15:00',
      venue: 'Ground A',
    },
  ];

  const recentResults = [
    {
      id: 1,
      team1: 'Karachi Strikers',
      team1Score: '178/6',
      team2: 'Defence Panthers',
      team2Score: '165/8',
      winner: 'Karachi Strikers',
      date: '2025-10-20',
    },
    {
      id: 2,
      team1: 'Clifton Warriors',
      team1Score: '195/4',
      team2: 'Malir Tigers',
      team2Score: '192/7',
      winner: 'Clifton Warriors',
      date: '2025-10-20',
    },
    {
      id: 3,
      team1: 'Gulshan Blasters',
      team1Score: '156/9',
      team2: 'Saddar Mavericks',
      team2Score: '142/10',
      winner: 'Gulshan Blasters',
      date: '2025-10-19',
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

  if (!tournament) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <Card className="shadow-card">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground text-lg">Tournament not found</p>
              <Button onClick={() => navigate('/tournaments')} className="mt-4">
                Back to Tournaments
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/tournaments')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tournaments
        </Button>

        {/* Tournament Header */}
        <Card className="mb-8 shadow-card-hover bg-gradient-card">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-hero rounded-xl">
                  <Trophy className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-3xl text-foreground">
                      {tournament.name}
                    </CardTitle>
                    <Badge variant="outline" className={getStatusColor(tournament.status)}>
                      {tournament.status}
                    </Badge>
                  </div>
                  <CardDescription className="text-base">
                    {tournament.description}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium text-foreground">
                    {new Date(tournament.startDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    -{' '}
                    {new Date(tournament.endDate).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Venue</p>
                  <p className="font-medium text-foreground">{tournament.venue}</p>
                  <p className="text-sm text-muted-foreground">{tournament.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Teams</p>
                  <p className="font-medium text-foreground">{tournament.teams} Teams</p>
                  <p className="text-sm text-muted-foreground">{tournament.format} Format</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm text-muted-foreground">Prize Pool</p>
                  <p className="font-medium text-foreground">{tournament.prizePool}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="standings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="standings">Standings</TabsTrigger>
            <TabsTrigger value="fixtures">Fixtures</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>

          {/* Standings Tab */}
          <TabsContent value="standings">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Points Table
                </CardTitle>
                <CardDescription>Current tournament standings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Rank
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                          Team
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                          Wins
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                          Losses
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-muted-foreground">
                          Points
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {participatingTeams.map((team, index) => (
                        <tr
                          key={index}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                index === 0
                                  ? 'bg-secondary text-secondary-foreground'
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {index + 1}
                            </div>
                          </td>
                          <td className="py-4 px-4 font-medium text-foreground">{team.name}</td>
                          <td className="py-4 px-4 text-center text-foreground">{team.wins}</td>
                          <td className="py-4 px-4 text-center text-foreground">{team.losses}</td>
                          <td className="py-4 px-4 text-center">
                            <span className="font-bold text-primary">{team.points}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fixtures Tab */}
          <TabsContent value="fixtures">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Matches
                </CardTitle>
                <CardDescription>Scheduled fixtures for the tournament</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingMatches.map((match) => (
                    <div
                      key={match.id}
                      className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <p className="font-semibold text-foreground">{match.team1}</p>
                            <span className="text-muted-foreground text-sm">vs</span>
                            <p className="font-semibold text-foreground">{match.team2}</p>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(match.date).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <span>{match.time}</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {match.venue}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                          Scheduled
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Recent Results
                </CardTitle>
                <CardDescription>Latest match outcomes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentResults.map((result) => (
                    <div
                      key={result.id}
                      className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex-1">
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div>
                              <p
                                className={`font-semibold mb-1 ${
                                  result.winner === result.team1 ? 'text-primary' : 'text-foreground'
                                }`}
                              >
                                {result.team1}
                              </p>
                              <p className="font-mono text-lg text-foreground">{result.team1Score}</p>
                            </div>
                            <div>
                              <p
                                className={`font-semibold mb-1 ${
                                  result.winner === result.team2 ? 'text-primary' : 'text-foreground'
                                }`}
                              >
                                {result.team2}
                              </p>
                              <p className="font-mono text-lg text-foreground">{result.team2Score}</p>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(result.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground mb-1">Winner</p>
                          <p className="font-semibold text-primary">{result.winner}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
