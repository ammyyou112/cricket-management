import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { teamService } from '@/services/team.service';
import { matchService } from '@/services/match.service';
import { approvalService } from '@/services/approval.service';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, Play, Target } from 'lucide-react';
import type { Team, Match, MatchStatus } from '@/types/api.types';

export default function MatchControl() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'live'>('upcoming');
  const [requestingApproval, setRequestingApproval] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load captain's teams
        const teamsData = await teamService.getMyTeams();
        const allTeams = Array.isArray(teamsData) ? teamsData : (teamsData.data || []);
        const captainTeams = allTeams.filter(t => t.captainId === user?.id || (t as any).captain_id === user?.id);
        
        console.log('✅ Captain teams loaded:', captainTeams.length);
        setTeams(captainTeams);
        
        if (captainTeams.length === 0) {
          setLoading(false);
          return;
        }
        
        // Load matches
        const matchesData = await matchService.getAll();
        const allMatches = Array.isArray(matchesData) ? matchesData : (matchesData.data || []);
        
        // Filter matches for captain's teams
        const teamIds = captainTeams.map(t => t.id);
        const teamMatches = allMatches.filter(m => 
          teamIds.includes(m.teamAId) || teamIds.includes(m.teamBId)
        );
        
        setMatches(teamMatches);
        
      } catch (err: any) {
        console.error('❌ Failed to load data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading matches...</p>
        </div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-6xl mb-4">🏏</div>
          <h2 className="text-2xl font-bold mb-2">No Team Found</h2>
          <p className="text-gray-600 mb-6">You are not leading any team yet</p>
          <button
            onClick={() => navigate('/captain/team/create')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create Team
          </button>
        </div>
      </div>
    );
  }

  const handleRequestApproval = async (matchId: string, type: 'START_SCORING' | 'START_SECOND_INNINGS' | 'FINAL_SCORE') => {
    setRequestingApproval(matchId);
    try {
      await approvalService.requestApproval(matchId, type);
      toast({
        title: 'Success',
        description: 'Approval request sent to opponent captain',
      });
      // Reload matches
      const matchesData = await matchService.getAll();
      const allMatches = Array.isArray(matchesData) ? matchesData : (matchesData.data || []);
      const teamIds = teams.map(t => t.id);
      const teamMatches = allMatches.filter(m => 
        teamIds.includes(m.teamAId) || teamIds.includes(m.teamBId)
      );
      setMatches(teamMatches);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request approval',
        variant: 'destructive',
      });
    } finally {
      setRequestingApproval(null);
    }
  };

  const getMatchStatusBadge = (status: MatchStatus) => {
    const statusColors: Record<string, string> = {
      'SCHEDULED': 'bg-blue-100 text-blue-800',
      'SCORING_PENDING': 'bg-yellow-100 text-yellow-800',
      'FIRST_INNINGS': 'bg-green-100 text-green-800',
      'SECOND_INNINGS_PENDING': 'bg-yellow-100 text-yellow-800',
      'SECOND_INNINGS': 'bg-green-100 text-green-800',
      'FINAL_PENDING': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-gray-100 text-gray-800',
      'LIVE': 'bg-red-100 text-red-800 animate-pulse',
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const upcomingMatches = matches.filter(m => 
    m.status === 'SCHEDULED' || 
    m.status === 'SCORING_PENDING' || 
    m.status === 'FIRST_INNINGS' ||
    m.status === 'SECOND_INNINGS_PENDING' ||
    m.status === 'SECOND_INNINGS' ||
    m.status === 'FINAL_PENDING'
  );
  const liveMatches = matches.filter(m => m.status === 'LIVE');

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Match Control</h1>
        <p className="text-gray-600">Control and manage your team's matches</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setFilter('upcoming')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'upcoming'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Scheduled ({upcomingMatches.length})
        </button>
        <button
          onClick={() => setFilter('live')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            filter === 'live'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Live ({liveMatches.length})
        </button>
      </div>

      {/* Matches List */}
      {filter === 'upcoming' && (
        <div>
          {upcomingMatches.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No scheduled matches found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMatches.map((match) => {
                const isTeamACaptain = teams.some(t => t.id === match.teamAId && (t.captainId === user?.id || (t as any).captain_id === user?.id));
                const isTeamBCaptain = teams.some(t => t.id === match.teamBId && (t.captainId === user?.id || (t as any).captain_id === user?.id));
                const isCaptain = isTeamACaptain || isTeamBCaptain;
                const canRequestStartScoring = match.status === 'SCHEDULED' && isCaptain;
                const canRequestSecondInnings = match.status === 'FIRST_INNINGS' && isCaptain;
                const canRequestFinalScore = match.status === 'SECOND_INNINGS' && isCaptain;
                const canScore = (match.status === 'FIRST_INNINGS' || match.status === 'SECOND_INNINGS') && isCaptain;
                const isRequesting = requestingApproval === match.id;

                return (
                  <Card key={match.id} className="hover:shadow-lg transition">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-lg">Match Details</CardTitle>
                        <Badge className={getMatchStatusBadge(match.status as MatchStatus)}>
                          {match.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        📍 {match.venue}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        📅 {new Date(match.matchDate).toLocaleString()}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {canRequestStartScoring && (
                        <Button
                          onClick={() => handleRequestApproval(match.id, 'START_SCORING')}
                          disabled={isRequesting}
                          className="w-full"
                          variant="default"
                        >
                          {isRequesting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Requesting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Request Start Scoring
                            </>
                          )}
                        </Button>
                      )}

                      {canRequestSecondInnings && (
                        <Button
                          onClick={() => handleRequestApproval(match.id, 'START_SECOND_INNINGS')}
                          disabled={isRequesting}
                          className="w-full"
                          variant="default"
                        >
                          {isRequesting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Requesting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Request Second Innings
                            </>
                          )}
                        </Button>
                      )}

                      {canRequestFinalScore && (
                        <Button
                          onClick={() => handleRequestApproval(match.id, 'FINAL_SCORE')}
                          disabled={isRequesting}
                          className="w-full"
                          variant="default"
                        >
                          {isRequesting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Requesting...
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Request Final Score Approval
                            </>
                          )}
                        </Button>
                      )}

                      {canScore && (
                        <Button asChild className="w-full" variant="default">
                          <Link to={`/match/${match.id}/ball-by-ball`}>
                            <Target className="mr-2 h-4 w-4" />
                            Start Scoring
                          </Link>
                        </Button>
                      )}

                      {(match.status === 'SCORING_PENDING' || match.status === 'SECOND_INNINGS_PENDING' || match.status === 'FINAL_PENDING') && (
                        <div className="text-sm text-yellow-600 text-center py-2">
                          ⏳ Waiting for opponent approval
                        </div>
                      )}

                      <Button
                        asChild
                        variant="outline"
                        className="w-full"
                        onClick={() => navigate(`/matches/${match.id}`)}
                      >
                        <Link to={`/matches/${match.id}`}>View Details</Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {filter === 'live' && (
        <div>
          {liveMatches.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No live matches currently</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {liveMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition border-l-4 border-red-500"
                >
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-bold">LIVE MATCH</h3>
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium animate-pulse">
                        LIVE
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      📍 {match.venue} • 📅 {new Date(match.matchDate).toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/captain/match/${match.id}/update-result`)}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Update Score
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
