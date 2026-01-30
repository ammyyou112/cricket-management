import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useMatchDetails } from '@/hooks/useMatch';
import { ballByBallService, type BallInput, type Ball, type ScoringData } from '@/services/ballByBall.service';
import { teamService } from '@/services/team.service';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Undo2, 
  Save, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  Activity,
  Users,
  Target
} from 'lucide-react';
import type { TeamMember } from '@/types/api.types';

interface Match {
  id: string;
  teamAId?: string;
  team_a_id?: string; // snake_case from backend
  teamBId?: string;
  team_b_id?: string; // snake_case from backend
  teamA?: { id: string; teamName: string; captainId?: string; captain_id?: string };
  teamB?: { id: string; teamName: string; captainId?: string; captain_id?: string };
  status: string;
  currentInnings?: number;
  scoringCaptainId?: string;
  teamAScore?: number;
  teamAWickets?: number;
  teamAOvers?: number;
  teamBScore?: number;
  teamBWickets?: number;
  teamBOvers?: number;
}

const BallByBallScoring = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Comprehensive scoring data state
  const [scoringData, setScoringData] = useState<ScoringData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [balls, setBalls] = useState<Ball[]>([]);

  // Form state
  const [batsmanOnStrike, setBatsmanOnStrike] = useState<string>('');
  const [batsmanNonStrike, setBatsmanNonStrike] = useState<string>('');
  const [bowler, setBowler] = useState<string>('');
  const [runs, setRuns] = useState<number>(0);
  const [isWicket, setIsWicket] = useState(false);
  const [wicketType, setWicketType] = useState<'BOWLED' | 'CAUGHT' | 'LBW' | 'RUN_OUT' | 'STUMPED' | 'HIT_WICKET'>('BOWLED');
  const [dismissedPlayer, setDismissedPlayer] = useState<string>('');
  const [fielder, setFielder] = useState<string>('');
  const [isWide, setIsWide] = useState(false);
  const [isNoBall, setIsNoBall] = useState(false);
  const [isBye, setIsBye] = useState(false);
  const [isLegBye, setIsLegBye] = useState(false);

  // Helper function to validate UUID
  const isValidUUID = (id: any): boolean => {
    if (!id || typeof id !== 'string') return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  // Load comprehensive scoring data (replaces separate match/teams/balls loading)
  useEffect(() => {
    const loadScoringData = async () => {
      if (!matchId) return;
      setLoadingData(true);
      try {
        const data = await ballByBallService.getScoringData(matchId);
        setScoringData(data);
        setBalls(data.balls || []);
        
        // Set initial players from last ball if available
        if (data.balls && data.balls.length > 0) {
          const lastBall = data.balls[data.balls.length - 1];
          if (lastBall.innings === data.match.currentInnings) {
            setBatsmanOnStrike(lastBall.batsmanOnStrike);
            setBatsmanNonStrike(lastBall.batsmanNonStrike);
            setBowler(lastBall.bowler);
          }
        }
      } catch (error) {
        console.error('Failed to load scoring data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load match data',
          variant: 'destructive',
        });
      } finally {
        setLoadingData(false);
      }
    };
    loadScoringData();
  }, [matchId, toast]);

  // Get current batting team members (from scoring data)
  const getCurrentBattingTeam = () => {
    return scoringData?.players.batting || [];
  };

  // Get current bowling team members (from scoring data)
  const getCurrentBowlingTeam = () => {
    return scoringData?.players.bowling || [];
  };

  // Enter ball mutation
  const enterBallMutation = useMutation({
    mutationFn: async (ballData: BallInput) => {
      if (!matchId) throw new Error('Match ID required');
      return ballByBallService.enterBall(matchId, ballData);
    },
    onSuccess: async (newBall) => {
      toast({
        title: 'Ball entered',
        description: `Runs: ${newBall.runs}${newBall.isWicket ? ' (Wicket!)' : ''}`,
      });
      
      // Reset form
      setRuns(0);
      setIsWicket(false);
      setIsWide(false);
      setIsNoBall(false);
      setIsBye(false);
      setIsLegBye(false);
      setDismissedPlayer('');
      setFielder('');
      
      // Reload scoring data after entering ball (this will update all state including balls, scores, etc.)
      try {
        const data = await ballByBallService.getScoringData(matchId!);
        setScoringData(data);
        setBalls(data.balls || []);
        
        // Set players from last ball if available
        if (data.balls && data.balls.length > 0) {
          const lastBall = data.balls[data.balls.length - 1];
          if (lastBall.innings === data.match.currentInnings) {
            setBatsmanOnStrike(lastBall.batsmanOnStrike);
            setBatsmanNonStrike(lastBall.batsmanNonStrike);
            setBowler(lastBall.bowler);
          }
        }
      } catch (error) {
        console.error('Failed to reload scoring data:', error);
        // Still update local balls array as fallback
        setBalls([...balls, newBall]);
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to enter ball',
        variant: 'destructive',
      });
    },
  });

  // Undo last ball mutation
  const undoBallMutation = useMutation({
    mutationFn: async () => {
      if (!matchId) throw new Error('Match ID required');
      return ballByBallService.undoLastBall(matchId, scoringData?.match.currentInnings);
    },
    onSuccess: async () => {
      toast({
        title: 'Success',
        description: 'Last ball undone',
      });
      
      // Reload scoring data after undo
      try {
        const data = await ballByBallService.getScoringData(matchId!);
        setScoringData(data);
        setBalls(data.balls || []);
      } catch (error) {
        console.error('Failed to reload scoring data after undo:', error);
        // Fallback: remove last ball from local state
        if (balls.length > 0) {
          setBalls(balls.slice(0, -1));
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to undo ball',
        variant: 'destructive',
      });
    },
  });

  const handleEnterBall = () => {
    if (!matchId || !batsmanOnStrike || !batsmanNonStrike || !bowler) {
      toast({
        title: 'Validation Error',
        description: 'Please select all players (batsman on strike, non-strike, and bowler)',
        variant: 'destructive',
      });
      return;
    }

    // Calculate next ball number
    if (!scoringData) return;
    const currentInnings = scoringData.match.currentInnings;
    const currentInningsBalls = balls.filter(b => b.innings === currentInnings);
    const currentOverNumber = scoringData.currentOverNumber || Math.floor(currentInningsBalls.length / 6) + 1;
    const legalBallsInOver = currentInningsBalls
      .filter(b => b.overNumber === currentOverNumber)
      .filter(b => !b.isWide && !b.isNoBall).length;
    
    const nextBallNumber = legalBallsInOver + 1;
    const nextOverNumber = nextBallNumber > 6 ? currentOverNumber + 1 : currentOverNumber;
    const actualBallNumber = nextBallNumber > 6 ? 1 : nextBallNumber;

    const ballData: BallInput = {
      innings: currentInnings,
      overNumber: nextOverNumber,
      ballNumber: actualBallNumber,
      batsmanOnStrike,
      batsmanNonStrike,
      bowler,
      runs,
      isWicket,
      wicketType: isWicket ? wicketType : undefined,
      dismissedPlayer: isWicket ? dismissedPlayer : undefined,
      fielder: isWicket && (wicketType === 'CAUGHT' || wicketType === 'RUN_OUT' || wicketType === 'STUMPED') ? fielder : undefined,
      isWide,
      isNoBall,
      isBye,
      isLegBye,
    };

    enterBallMutation.mutate(ballData);
  };

  const handleUndo = () => {
    if (balls.length === 0) {
      toast({
        title: 'No balls',
        description: 'No balls to undo',
        variant: 'destructive',
      });
      return;
    }
    undoBallMutation.mutate();
  };

  if (loadingData) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!scoringData) {
    return (
      <Alert>
        <AlertTitle>Match not found</AlertTitle>
        <AlertDescription>The match you're looking for doesn't exist or couldn't be loaded.</AlertDescription>
      </Alert>
    );
  }

  const match = scoringData.match;
  const currentInnings = match.currentInnings;

  // Simplified authorization - only check role, not team ownership
  // Team ownership validation will happen on ball submission (backend)
  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Alert variant="destructive">
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription className="mb-4">Please login to access scoring.</AlertDescription>
          <Button 
            variant="outline" 
            onClick={() => navigate('/login')}
            size="sm"
          >
            Go to Login
          </Button>
        </Alert>
      </div>
    );
  }

  // Only check role - allow any captain to view the page
  // Backend will validate team ownership when submitting balls
  // Note: Frontend stores roles in lowercase ('captain', 'admin', 'player')
  const userRole = user.role?.toLowerCase() || '';
  const isCaptain = userRole === 'captain' || userRole === 'admin';
  
  if (!isCaptain) {
    return (
      <div className="container mx-auto p-6 max-w-2xl">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription className="mb-4">
            Only team captains can access the ball-by-ball scoring page.
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-2 text-sm text-muted-foreground">
                Debug: Your role is "{user.role}" (expected "captain" or "admin")
              </div>
            )}
          </AlertDescription>
          <Button 
            variant="outline" 
            onClick={() => navigate(-1)}
            size="sm"
          >
            Go Back
          </Button>
        </Alert>
      </div>
    );
  }

  // Debug logging (only in development)
  if (process.env.NODE_ENV === 'development') {
    console.log('[BallByBallScoring] Scoring Data:', {
      userId: user.id,
      userRole: user.role,
      match: scoringData.match,
      players: { batting: scoringData.players.batting.length, bowling: scoringData.players.bowling.length },
      ballsCount: scoringData.balls.length,
      isAuthorized: scoringData.isAuthorized
    });
  }

  // Helper function for safe number display
  const safeNumber = (value: any, decimals: number = 0): string => {
    const num = Number(value);
    return isNaN(num) ? '0' : num.toFixed(decimals);
  };

  const battingTeam = getCurrentBattingTeam();
  const bowlingTeam = getCurrentBowlingTeam();
  const currentScore = currentInnings === 1 
    ? (match.teamA?.score || { runs: 0, wickets: 0, overs: 0 })
    : (match.teamB?.score || { runs: 0, wickets: 0, overs: 0 });
  
  // Calculate current over and ball from balls
  const currentInningsBalls = balls.filter(b => b.innings === currentInnings);
  const currentOver = scoringData.currentOverNumber || Math.floor(currentInningsBalls.length / 6) + 1;
  const currentBall = (currentInningsBalls.length % 6) + 1;

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      {/* Match Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl">
                {match.teamA.name} vs {match.teamB.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {match.status} • Innings {currentInnings}
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {currentScore?.runs || 0}/{currentScore?.wickets || 0} ({safeNumber(currentScore?.overs, 1)})
            </Badge>
            <div className="text-sm text-muted-foreground">
              {match.battingTeam.name} batting • {match.bowlingTeam.name} bowling
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scoring Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Enter Ball
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Over Display */}
              <div className="bg-muted p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Current Over</div>
                <div className="text-2xl font-bold">
                  {currentOver}.{currentBall}
                </div>
              </div>

              {/* Player Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Batsman on Strike *</Label>
                  <Select value={batsmanOnStrike} onValueChange={setBatsmanOnStrike}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select batsman" />
                    </SelectTrigger>
                    <SelectContent>
                      {battingTeam.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Non-Strike Batsman *</Label>
                  <Select value={batsmanNonStrike} onValueChange={setBatsmanNonStrike}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select batsman" />
                    </SelectTrigger>
                    <SelectContent>
                      {battingTeam
                        .filter((player) => player.id !== batsmanOnStrike)
                        .map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            {player.name} {player.type ? `(${player.type})` : ''}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Bowler *</Label>
                  <Select value={bowler} onValueChange={setBowler}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select bowler" />
                    </SelectTrigger>
                    <SelectContent>
                      {bowlingTeam.map((player) => (
                        <SelectItem key={player.id} value={player.id}>
                          {player.name} {player.type ? `(${player.type})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Runs Input */}
              <div className="space-y-2">
                <Label>Runs</Label>
                <div className="grid grid-cols-7 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6].map((run) => (
                    <Button
                      key={run}
                      type="button"
                      variant={runs === run ? 'default' : 'outline'}
                      onClick={() => setRuns(run)}
                      className="h-12"
                    >
                      {run}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Extras */}
              <div className="space-y-2">
                <Label>Extras</Label>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    type="button"
                    variant={isWide ? 'default' : 'outline'}
                    onClick={() => {
                      setIsWide(!isWide);
                      setIsNoBall(false);
                      setIsBye(false);
                      setIsLegBye(false);
                    }}
                  >
                    Wide
                  </Button>
                  <Button
                    type="button"
                    variant={isNoBall ? 'default' : 'outline'}
                    onClick={() => {
                      setIsNoBall(!isNoBall);
                      setIsWide(false);
                      setIsBye(false);
                      setIsLegBye(false);
                    }}
                  >
                    No Ball
                  </Button>
                  <Button
                    type="button"
                    variant={isBye ? 'default' : 'outline'}
                    onClick={() => {
                      setIsBye(!isBye);
                      setIsWide(false);
                      setIsNoBall(false);
                      setIsLegBye(false);
                    }}
                  >
                    Bye
                  </Button>
                  <Button
                    type="button"
                    variant={isLegBye ? 'default' : 'outline'}
                    onClick={() => {
                      setIsLegBye(!isLegBye);
                      setIsWide(false);
                      setIsNoBall(false);
                      setIsBye(false);
                    }}
                  >
                    Leg Bye
                  </Button>
                </div>
              </div>

              {/* Wicket */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isWicket"
                    checked={isWicket}
                    onChange={(e) => setIsWicket(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isWicket">Wicket</Label>
                </div>
                {isWicket && (
                  <div className="space-y-2 pl-6">
                    <Select value={wicketType} onValueChange={(v: any) => setWicketType(v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BOWLED">Bowled</SelectItem>
                        <SelectItem value="CAUGHT">Caught</SelectItem>
                        <SelectItem value="LBW">LBW</SelectItem>
                        <SelectItem value="RUN_OUT">Run Out</SelectItem>
                        <SelectItem value="STUMPED">Stumped</SelectItem>
                        <SelectItem value="HIT_WICKET">Hit Wicket</SelectItem>
                      </SelectContent>
                    </Select>
                    {(wicketType === 'CAUGHT' || wicketType === 'RUN_OUT' || wicketType === 'STUMPED') && (
                      <Select value={fielder} onValueChange={setFielder}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select fielder" />
                        </SelectTrigger>
                        <SelectContent>
                          {bowlingTeam.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    <Select value={dismissedPlayer} onValueChange={setDismissedPlayer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Dismissed player" />
                      </SelectTrigger>
                      <SelectContent>
                        {battingTeam.map((member) => (
                          <SelectItem key={member.id} value={member.id}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleEnterBall}
                  disabled={enterBallMutation.isPending}
                  className="flex-1"
                >
                  {enterBallMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entering...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Enter Ball
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleUndo}
                  disabled={undoBallMutation.isPending || balls.length === 0}
                >
                  {undoBallMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Undo2 className="mr-2 h-4 w-4" />
                      Undo
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ball History */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Balls</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <Skeleton className="h-32 w-full" />
              ) : balls.length === 0 ? (
                <p className="text-sm text-muted-foreground">No balls entered yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {balls.slice(-10).reverse().map((ball) => (
                    <div key={ball.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="text-sm">
                        <div className="font-medium">
                          {ball.overNumber}.{ball.ballNumber}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {ball.runs} run{ball.runs !== 1 ? 's' : ''}
                          {ball.isWide && ' (Wide)'}
                          {ball.isNoBall && ' (No Ball)'}
                          {ball.isWicket && ' (Wicket!)'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BallByBallScoring;

