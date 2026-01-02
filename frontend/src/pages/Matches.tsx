import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Trophy, TrendingUp, TrendingDown } from 'lucide-react';

export const Matches = () => {
  const allMatches = [
    {
      id: 1,
      date: '2025-10-22',
      time: '14:00',
      homeTeam: 'Karachi Kings',
      awayTeam: 'Lahore Lions',
      venue: 'National Stadium, Karachi',
      status: 'Upcoming',
      tournament: 'Karachi Premier League'
    },
    {
      id: 2,
      date: '2025-10-20',
      time: '16:30',
      homeTeam: 'Islamabad United',
      awayTeam: 'Multan Sultans',
      venue: 'Gaddafi Stadium, Lahore',
      status: 'Upcoming',
      tournament: 'Pakistan Super League'
    },
    {
      id: 3,
      date: '2025-10-15',
      time: '15:00',
      homeTeam: 'Your Team',
      awayTeam: 'Karachi Strikers',
      venue: 'DHA Cricket Ground, Karachi',
      status: 'Completed',
      result: 'Won',
      homeScore: '165/6',
      awayScore: '142/8',
      tournament: 'Karachi Premier League'
    },
    {
      id: 4,
      date: '2025-10-08',
      time: '14:30',
      homeTeam: 'Lahore Warriors',
      awayTeam: 'Your Team',
      venue: 'Punjab Stadium, Lahore',
      status: 'Completed',
      result: 'Lost',
      homeScore: '178/5',
      awayScore: '142/8',
      tournament: 'Lahore Corporate Cup'
    },
    {
      id: 5,
      date: '2025-10-01',
      time: '17:00',
      homeTeam: 'Your Team',
      awayTeam: 'Islamabad Panthers',
      venue: 'National Stadium, Karachi',
      status: 'Completed',
      result: 'Won',
      homeScore: '178/4',
      awayScore: '156/9',
      tournament: 'Karachi Premier League'
    },
    {
      id: 6,
      date: '2025-10-25',
      time: '18:00',
      homeTeam: 'Peshawar Zalmi',
      awayTeam: 'Quetta Gladiators',
      venue: 'Arbab Niaz Stadium, Peshawar',
      status: 'Upcoming',
      tournament: 'Pakistan Super League'
    }
  ];

  const upcomingMatches = allMatches.filter(m => m.status === 'Upcoming');
  const completedMatches = allMatches.filter(m => m.status === 'Completed');

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">All Matches</h1>
          <p className="text-muted-foreground text-lg">View all upcoming and past cricket matches</p>
        </div>

        {/* Upcoming Matches */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Upcoming Matches
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingMatches.map((match) => (
              <Card key={match.id} className="shadow-card hover:shadow-card-hover transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                      {match.tournament}
                    </Badge>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      {match.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{match.homeTeam} vs {match.awayTeam}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-2">
                    <MapPin className="h-4 w-4" />
                    {match.venue}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{match.date}</span>
                      <span>•</span>
                      <span>{match.time}</span>
                    </div>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Completed Matches */}
        <div>
          <h2 className="text-2xl font-bold mb-4 text-foreground flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Recent Results
          </h2>
          <div className="grid grid-cols-1 gap-4">
            {completedMatches.map((match) => (
              <Card key={match.id} className="shadow-card">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge className="bg-primary/10 text-primary hover:bg-primary/20">
                          {match.tournament}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{match.date}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 items-center">
                        <div className="text-right">
                          <p className="font-semibold text-foreground">{match.homeTeam}</p>
                          <p className="font-mono text-sm text-muted-foreground">{match.homeScore}</p>
                        </div>
                        <div className="text-center text-muted-foreground font-medium">vs</div>
                        <div className="text-left">
                          <p className="font-semibold text-foreground">{match.awayTeam}</p>
                          <p className="font-mono text-sm text-muted-foreground">{match.awayScore}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {match.venue}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge 
                        variant={match.result === 'Won' ? 'default' : 'destructive'}
                        className="flex items-center gap-1"
                      >
                        {match.result === 'Won' ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {match.result}
                      </Badge>
                      <Button size="sm" variant="outline">Details</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
