import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Target, Calendar, TrendingUp, Users, Plus } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Mock: Check if user is team admin (in real app, this would come from user.role)
  const isTeamAdmin = user.email.includes('admin'); // Simple mock check

  const mockJoinRequests = [
    { id: 1, playerName: 'Ali Raza', role: 'Batsman', city: 'Karachi', requestedAt: '2 hours ago' },
    { id: 2, playerName: 'Usman Qadir', role: 'All-rounder', city: 'Lahore', requestedAt: '5 hours ago' },
    { id: 3, playerName: 'Babar Azam', role: 'Bowler', city: 'Islamabad', requestedAt: '1 day ago' },
  ];

  const handleApproveRequest = (playerName: string) => {
    toast.success(`${playerName} has been added to your team!`);
  };

  const handleDeclineRequest = (playerName: string) => {
    toast.error(`Request from ${playerName} declined.`);
  };

  const handleScheduleMatch = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Match scheduled successfully!');
    setScheduleDialogOpen(false);
  };

  const handleUpdateStats = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Stats updated successfully!');
    setStatsDialogOpen(false);
  };

  const playerStats = [
    { label: 'Matches Played', value: '24', icon: Calendar },
    { label: 'Total Runs', value: '856', icon: Target },
    { label: 'Wickets Taken', value: '18', icon: Trophy },
    { label: 'Batting Average', value: '42.8', icon: TrendingUp },
  ];

  const recentMatches = [
    { opponent: 'Karachi Strikers', result: 'Won', score: '165/6', date: '2025-10-15' },
    { opponent: 'Lahore Warriors', result: 'Lost', score: '142/8', date: '2025-10-08' },
    { opponent: 'Islamabad Panthers', result: 'Won', score: '178/4', date: '2025-10-01' },
  ];

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            Welcome back, {user.name}!
          </h1>
          <p className="text-muted-foreground text-lg">
            Here's your cricket performance overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {playerStats.map((stat, index) => (
            <Card key={index} className="shadow-card hover:shadow-card-hover transition-all bg-gradient-card">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
                <div className="p-2 bg-gradient-hero rounded-lg">
                  <stat.icon className="h-4 w-4 text-primary-foreground" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Matches */}
          <Card className="lg:col-span-2 shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Recent Matches
              </CardTitle>
              <CardDescription>Your last 3 match performances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentMatches.map((match, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-semibold text-foreground">{match.opponent}</p>
                      <p className="text-sm text-muted-foreground">{match.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-semibold text-foreground">{match.score}</p>
                      <p
                        className={`text-sm font-medium ${
                          match.result === 'Won' ? 'text-primary' : 'text-destructive'
                        }`}
                      >
                        {match.result}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" className="w-full mt-4" onClick={() => navigate('/matches')}>
                View All Matches
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                Quick Actions
              </CardTitle>
              <CardDescription>Manage your cricket activities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start bg-gradient-hero hover:opacity-90" onClick={() => navigate('/teams')}>
                <Users className="h-4 w-4 mr-2" />
                Join a Team
              </Button>
              
              <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Match
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Schedule Match</DialogTitle>
                    <DialogDescription>Fill in the details to schedule a new match</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleScheduleMatch}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="opponent">Opponent Team</Label>
                        <Input id="opponent" placeholder="Enter opponent team name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Match Date</Label>
                        <Input id="date" type="date" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="time">Match Time</Label>
                        <Input id="time" type="time" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="venue">Venue</Label>
                        <Input id="venue" placeholder="Enter match venue" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea id="notes" placeholder="Additional details" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="bg-gradient-hero hover:opacity-90">Schedule Match</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>

              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/tournaments')}>
                <Trophy className="h-4 w-4 mr-2" />
                View Tournaments
              </Button>

              <Dialog open={statsDialogOpen} onOpenChange={setStatsDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Target className="h-4 w-4 mr-2" />
                    Update Stats
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Update Your Stats</DialogTitle>
                    <DialogDescription>Update your cricket performance statistics</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateStats}>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="runs">Runs Scored</Label>
                        <Input id="runs" type="number" placeholder="0" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="wickets">Wickets Taken</Label>
                        <Input id="wickets" type="number" placeholder="0" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="catches">Catches</Label>
                        <Input id="catches" type="number" placeholder="0" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="match-result">Match Result</Label>
                        <Input id="match-result" placeholder="Won/Lost" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="match-notes">Match Notes</Label>
                        <Textarea id="match-notes" placeholder="Any highlights or notes" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="bg-gradient-hero hover:opacity-90">Update Stats</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        {/* Team Admin Section - Join Requests */}
        {isTeamAdmin && (
          <Card className="shadow-card mt-6">
            <CardHeader>
              <CardTitle className="text-foreground">Join Requests</CardTitle>
              <CardDescription>Players requesting to join your team</CardDescription>
            </CardHeader>
            <CardContent>
              {mockJoinRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No pending requests</p>
              ) : (
                <div className="space-y-4">
                  {mockJoinRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{request.playerName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {request.role} • {request.city} • {request.requestedAt}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleApproveRequest(request.playerName)}
                          className="bg-gradient-hero hover:opacity-90"
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeclineRequest(request.playerName)}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
