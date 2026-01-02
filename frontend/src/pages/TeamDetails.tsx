import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { teamService } from '../services/team.service';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Skeleton } from '../components/ui/skeleton';
import { useToast } from '../components/ui/use-toast';
import { ArrowLeft, Users, MapPin, Calendar, Shield, Trophy, TrendingUp } from 'lucide-react';
import type { Team } from '../types/api.types';

export default function TeamDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeam = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);
        console.log('🔍 Loading team:', id);
        
        const teamData = await teamService.getById(id);
        console.log('✅ Team loaded:', teamData);
        setTeam(teamData);
        
      } catch (err: any) {
        console.error('❌ Failed to load team:', err);
        setError(err.message || 'Failed to load team details');
        toast({
          title: 'Error',
          description: err.message || 'Failed to load team details',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadTeam();
  }, [id, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Skeleton className="h-12 w-12 rounded-full mx-auto mb-4" />
              <Skeleton className="h-8 w-64 mx-auto mb-2" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-muted/30 py-8 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-lg shadow-lg max-w-md">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Team Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This team does not exist'}</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => navigate('/teams')}
              variant="default"
            >
              Browse Teams
            </Button>
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isCaptain = user?.id === team.captainId;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';
  const teamName = team.teamName || team.name || 'Unnamed Team';

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        {/* Team Header */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Team Logo */}
              <div className="flex-shrink-0">
                {team.logoUrl ? (
                  <img
                    src={team.logoUrl}
                    alt={teamName}
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary/20 shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                    <Shield className="h-16 w-16 text-white" />
                  </div>
                )}
              </div>

              {/* Team Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-4xl font-bold mb-2 text-foreground">{teamName}</h1>
                {team.description && (
                  <p className="text-muted-foreground mb-4 text-lg">{team.description}</p>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {team.city && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{team.city}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Created {new Date(team.createdAt).toLocaleDateString()}</span>
                  </div>
                  {team.captain && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>Captain: {team.captain.fullName || team.captain.full_name || 'Unknown'}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{team._count?.members || team.members?.length || 0} Members</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  {isCaptain && (
                    <Button
                      onClick={() => navigate('/captain/team-management')}
                      className="bg-primary hover:bg-primary/90"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      Manage Team
                    </Button>
                  )}
                  {isAdmin && (
                    <Button
                      onClick={() => navigate('/admin/teams')}
                      variant="outline"
                    >
                      Admin Panel
                    </Button>
                  )}
                  <Button
                    onClick={() => navigate('/teams')}
                    variant="outline"
                  >
                    Browse All Teams
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Matches Played</p>
                  <p className="text-3xl font-bold text-primary">0</p>
                </div>
                <Trophy className="h-12 w-12 text-primary/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Wins</p>
                  <p className="text-3xl font-bold text-green-600">0</p>
                </div>
                <TrendingUp className="h-12 w-12 text-green-600/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-md">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Active Players</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {team._count?.members || team.members?.length || 0}
                  </p>
                </div>
                <Users className="h-12 w-12 text-blue-600/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members */}
        {team.members && team.members.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Members ({team.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {team.members.map((member) => {
                  const memberUser = member.user || member.player;
                  const isMemberCaptain = memberUser?.id === team.captainId;
                  
                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <Avatar>
                        <AvatarImage src={memberUser?.profilePictureUrl || memberUser?.profile_picture} />
                        <AvatarFallback>
                          {memberUser?.fullName?.charAt(0) || memberUser?.full_name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {memberUser?.fullName || memberUser?.full_name || 'Unknown'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {isMemberCaptain && (
                            <Badge variant="default" className="text-xs">Captain</Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {member.status || 'ACTIVE'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

