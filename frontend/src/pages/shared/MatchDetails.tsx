import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { matchService } from '@/services/match.service';
import { teamService } from '@/services/team.service';
import { approvalService } from '@/services/approval.service';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Target, History, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import type { Match, Team, MatchStatus } from '@/types/api.types';

export default function MatchDetails() {
  const { id, matchId } = useParams<{ id?: string; matchId?: string }>();
  const actualMatchId = matchId || id; // Use matchId if available, otherwise id
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast(); // Moved to top - must be called before any early returns
  const [match, setMatch] = useState<Match | null>(null);
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requestingApproval, setRequestingApproval] = useState(false); // Moved to top - must be called before any early returns

  useEffect(() => {
    const loadMatchData = async () => {
      if (!actualMatchId) return;

      try {
        setLoading(true);
        setError(null);
        
        // Load match details
        const matchData = await matchService.getById(actualMatchId);
        setMatch(matchData);
        
        // Try to get teams from match data first (if backend includes them)
        if (matchData.teamA && matchData.teamB) {
          setTeamA(matchData.teamA);
          setTeamB(matchData.teamB);
        } else {
          // Load team details separately
          const [teamAData, teamBData] = await Promise.all([
            teamService.getById(matchData.teamAId).catch(() => null),
            teamService.getById(matchData.teamBId).catch(() => null),
          ]);
          
          if (teamAData) setTeamA(teamAData);
          if (teamBData) setTeamB(teamBData);
        }
        
      } catch (err: any) {
        setError(err.response?.data?.message || err.message || 'Failed to load match');
      } finally {
        setLoading(false);
      }
    };

    loadMatchData();
  }, [actualMatchId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading match details...</p>
        </div>
      </div>
    );
  }

  if (error || !match) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Match Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This match does not exist'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const teamAName = teamA?.name || teamA?.teamName || 'Team A';
  const teamBName = teamB?.name || teamB?.teamName || 'Team B';

  // Check if user is captain of one of the teams
  const isTeamACaptain = teamA?.captainId === user?.id;
  const isTeamBCaptain = teamB?.captainId === user?.id;
  const isCaptain = isTeamACaptain || isTeamBCaptain;

  const handleRequestApproval = async (type: 'START_SCORING' | 'START_SECOND_INNINGS' | 'FINAL_SCORE') => {
    if (!actualMatchId) return;
    
    setRequestingApproval(true);
    try {
      await approvalService.requestApproval(actualMatchId, type);
      toast({
        title: 'Success',
        description: 'Approval request sent to opponent captain',
      });
      // Reload match to get updated status
      const matchData = await matchService.getById(actualMatchId);
      setMatch(matchData);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to request approval',
        variant: 'destructive',
      });
    } finally {
      setRequestingApproval(false);
    }
  };

  // Determine which approval actions are available based on match status
  const canRequestStartScoring = match.status === 'SCHEDULED' && isCaptain;
  const canRequestSecondInnings = match.status === 'FIRST_INNINGS' && isCaptain;
  const canRequestFinalScore = match.status === 'SECOND_INNINGS' && isCaptain;
  const isPendingApproval = match.status === 'SCORING_PENDING' || match.status === 'SECOND_INNINGS_PENDING' || match.status === 'FINAL_PENDING';

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Match Header */}
      <div className="bg-white p-8 rounded-lg shadow mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-3 py-1 rounded text-sm font-medium ${
                match.status === 'LIVE' ? 'bg-red-100 text-red-800 animate-pulse' :
                match.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
                match.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {match.status}
              </span>
              <span className="text-sm text-gray-600">{match.matchType || 'LEAGUE'}</span>
            </div>
            <h1 className="text-3xl font-bold">Match Details</h1>
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between mb-6">
          {/* Team A */}
          <div className="flex-1 text-center">
            {teamA?.logoUrl ? (
              <img src={teamA.logoUrl} alt={teamAName} className="w-24 h-24 rounded-full mx-auto mb-3 object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-4xl mx-auto mb-3">🏏</div>
            )}
            <h2 className="text-2xl font-bold">{teamAName}</h2>
            {teamA?.city && <p className="text-gray-600">{teamA.city}</p>}
          </div>

          <div className="text-4xl font-bold text-gray-400 px-8">VS</div>

          {/* Team B */}
          <div className="flex-1 text-center">
            {teamB?.logoUrl ? (
              <img src={teamB.logoUrl} alt={teamBName} className="w-24 h-24 rounded-full mx-auto mb-3 object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center text-4xl mx-auto mb-3">🏏</div>
            )}
            <h2 className="text-2xl font-bold">{teamBName}</h2>
            {teamB?.city && <p className="text-gray-600">{teamB.city}</p>}
          </div>
        </div>

        {/* Match Info */}
        <div className="grid grid-cols-2 gap-4 pt-6 border-t">
          <div>
            <span className="font-semibold">📍 Venue:</span> {match.venue}
          </div>
          <div>
            <span className="font-semibold">📅 Date:</span> {new Date(match.matchDate).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Approval Status Alert */}
      {isPendingApproval && (
        <Alert className="mb-6">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            {match.status === 'SCORING_PENDING' && 'Waiting for opponent captain to approve start of scoring...'}
            {match.status === 'SECOND_INNINGS_PENDING' && 'Waiting for opponent captain to approve start of second innings...'}
            {match.status === 'FINAL_PENDING' && 'Waiting for opponent captain to approve final score...'}
          </AlertDescription>
        </Alert>
      )}

      {/* Match Actions */}
      {(user?.role === 'captain' || user?.role === 'admin') && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-2xl font-bold mb-4">Match Actions</h2>
          
          {/* Approval Request Buttons */}
          {isCaptain && (
            <div className="mb-6 space-y-3">
              {canRequestStartScoring && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold mb-1">Request to Start Scoring</h3>
                        <p className="text-sm text-muted-foreground">
                          Request approval from opponent captain to begin ball-by-ball scoring
                        </p>
                      </div>
                      <Button
                        onClick={() => handleRequestApproval('START_SCORING')}
                        disabled={requestingApproval}
                      >
                        {requestingApproval ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Requesting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Request Approval
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {canRequestSecondInnings && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold mb-1">Request to Start Second Innings</h3>
                        <p className="text-sm text-muted-foreground">
                          Request approval from opponent captain to begin second innings
                        </p>
                      </div>
                      <Button
                        onClick={() => handleRequestApproval('START_SECOND_INNINGS')}
                        disabled={requestingApproval}
                      >
                        {requestingApproval ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Requesting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Request Approval
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {canRequestFinalScore && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold mb-1">Request Final Score Approval</h3>
                        <p className="text-sm text-muted-foreground">
                          Request approval from opponent captain to finalize match score
                        </p>
                      </div>
                      <Button
                        onClick={() => handleRequestApproval('FINAL_SCORE')}
                        disabled={requestingApproval}
                      >
                        {requestingApproval ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Requesting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Request Approval
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(match.status === 'FIRST_INNINGS' || match.status === 'SECOND_INNINGS') && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Ball-by-Ball Scoring
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Enter balls one by one with detailed tracking of runs, wickets, and extras.
                  </p>
                  <Button asChild className="w-full">
                    <Link to={`/match/${actualMatchId}/ball-by-ball`}>Open Scoring</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Audit Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  View complete history of all actions and changes made during this match.
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/match/${actualMatchId}/audit`}>View Audit Log</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Match Stats */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4">Match Statistics</h2>
        <div className="text-center py-8 text-gray-500">
          {match.status === 'COMPLETED' ? 'Match completed' : match.status === 'LIVE' ? 'Match in progress...' : 'Match not started yet'}
        </div>
      </div>
    </div>
  );
}

