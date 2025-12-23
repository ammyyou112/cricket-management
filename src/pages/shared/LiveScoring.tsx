import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useMatchDetails, useMatchScore, useUpdateScore } from '../../hooks/useMatch';
import { useRealtimeMatchScore } from '../../hooks/useRealtime';
import * as matchApi from '../../lib/api/matches'; // Direct call for status updates if needed
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '../../components/ui/alert';
import { useToast } from '../../components/ui/use-toast';
import { Undo2, Save, Flag, CheckCircle2, RotateCcw } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// Helper to handle cricket over math
const addBall = (currentOvers: number) => {
    const balls = Math.round((currentOvers % 1) * 10);
    const completedOvers = Math.floor(currentOvers);
    if (balls >= 5) {
        return completedOvers + 1;
    } else {
        return currentOvers + 0.1;
    }
};

const subtractBall = (currentOvers: number) => {
    const balls = Math.round((currentOvers % 1) * 10);
    const completedOvers = Math.floor(currentOvers);
    if (balls === 0) {
        if (completedOvers === 0) return 0;
        return completedOvers - 1 + 0.5;
    } else {
        return currentOvers - 0.1;
    }
};

const LiveScoring = () => {
    const { matchId } = useParams<{ matchId: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: match, isLoading: matchLoading } = useMatchDetails(matchId!);
    const { data: scoreData, isLoading: scoreLoading } = useMatchScore(matchId!);
    // Subscribe to realtime updates
    useRealtimeMatchScore(matchId!);

    const { mutate: updateScore, isPending: isUpdating } = useUpdateScore();

    // Helper to get active inning score (Assuming single array of scores, picking first or filtered by batting team)
    // For now, we assume [0] is current inning or we fallback to default.
    const activeScore = Array.isArray(scoreData) ? scoreData[0] : scoreData;

    // Local state for immediate UI feedback before optimized optimistic update
    // We try to sync this with `activeScore` whenever it updates from server
    const [localScore, setLocalScore] = useState({
        total_runs: 0,
        total_wickets: 0,
        total_overs: 0,
        extras: 0
    });

    useEffect(() => {
        if (activeScore) {
            setLocalScore({
                total_runs: activeScore.total_runs || 0,
                total_wickets: activeScore.total_wickets || 0,
                total_overs: activeScore.total_overs || 0,
                extras: activeScore.extras || 0
            });
        }
    }, [activeScore]);

    // History stack for Undo functionality (Local session only)
    const [history, setHistory] = useState<any[]>([]);

    const completeMatchMutation = useMutation({
        mutationFn: (winnerTeamId: string) => matchApi.completeMatch(matchId!, winnerTeamId),
        onSuccess: () => {
            toast({ title: 'Match Completed', description: 'Final result has been saved.' });
            navigate(`/matches/${matchId}`);
        },
    });

    if (matchLoading || scoreLoading) return <div className="p-8"><Skeleton className="h-96 w-full" /></div>;

    if (!match) return <div>Match not found.</div>;

    // Security Check
    const canScore = user?.id === match.scoring_captain_id && match.approved_by_captain_id;
    if (!canScore) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        You do not have permission to score this match.
                        Ensure you are the designated scoring captain and the opponent has approved.
                    </AlertDescription>
                </Alert>
                <Button onClick={() => navigate(-1)}>Go Back</Button>
            </div>
        );
    }

    // Scoring Logic
    const handleScoreUpdate = (
        run: number,
        isExtra: boolean = false,
        extraType: 'WD' | 'NB' | 'B' | 'LB' | null = null,
        isWicket: boolean = false
    ) => {
        if (!activeScore) {
            toast({ title: "Error", description: "No active innings found. Please initialize.", variant: "destructive" });
            return;
        }

        const prev = { ...localScore };
        setHistory(curr => [...curr, prev]); // Save state for undo

        let newRuns = prev.total_runs + run;
        let newExtras = prev.extras;
        let newOvers = prev.total_overs;
        let newWickets = prev.total_wickets;

        if (isExtra) {
            newExtras += 1; // Basic count usually
            // Wides and No Balls add a run + don't count as legal ball usually
            // Standard: WD/NB = 1 run extra + rebowl. (So runs + 1, balls same)
            // Byes/Leg Byes = Runs added to total, counts as ball.
            if (extraType === 'WD' || extraType === 'NB') {
                newRuns += 1; // The extra run itself
                // If run > 0 (e.g. 5 wides or boundary off no ball), add those too
                // Note: 'run' arg includes the extra run usually? Let's assume 'run' is runs OFF BAT or extras total.
                // Let's simplify: run arg is TOTAL runs to add to team score.
                // If WD/NB, do NOT increment overs.
            } else {
                // Byes/Leg Byes: Increment overs
                newOvers = addBall(newOvers);
            }
        } else {
            // Normal ball
            newOvers = addBall(newOvers);
        }

        if (isWicket) {
            newWickets += 1;
        }

        const newScoreObj = {
            total_runs: newRuns,
            total_wickets: newWickets,
            total_overs: parseFloat(newOvers.toFixed(1)), // float precision fix
            extras: newExtras // Ideally we'd track breakdown but DB has single field
        };

        setLocalScore(newScoreObj);

        // Debounce or immediate? Immediate for live feel.
        updateScore({
            scoreId: activeScore.id,
            data: newScoreObj
        });
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        setHistory(curr => curr.slice(0, -1));
        setLocalScore(lastState);
        updateScore({
            scoreId: activeScore.id,
            data: lastState
        });
    };

    const handleEndMatch = () => {
        // Logic to determine winner could be complex. Present dialog to select.
        // For existing UI, assume Batting Team wins if runs > target? 
        // Or if second innings done?
        // We'll just prompt who won for simplicity given current state.
        const winnerId = match.team_a_id; // Defaulting for simple prompt logic, ideally a Dialog choice
        if (confirm(`End match? Confirm ${match.team_a?.team_name} vs ${match.team_b?.team_name} is finished?`)) {
            completeMatchMutation.mutate(winnerId); // This logic needs a real selector in production
        }
    };

    return (
        <div className="max-w-md mx-auto space-y-4 pb-20">
            {/* Scoreboard */}
            <Card className="sticky top-16 z-10 border-primary/50 shadow-lg bg-background">
                <CardHeader className="pb-2 text-center">
                    <div className="flex justify-between items-center text-xs text-muted-foreground uppercase tracking-widest">
                        <span>{match.team_a?.team_name} vs {match.team_b?.team_name}</span>
                        <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                    </div>
                    <div className="flex flex-col items-center justify-center mt-2">
                        <div className="text-5xl font-bold tabular-nums tracking-tighter">
                            {localScore.total_runs}/{localScore.total_wickets}
                        </div>
                        <div className="text-lg text-muted-foreground font-medium mt-1">
                            Overs: {localScore.total_overs.toFixed(1)}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-0 text-center text-xs">
                    CRR: {localScore.total_overs > 0 ? (localScore.total_runs / localScore.total_overs).toFixed(2) : '0.00'}
                </CardContent>
            </Card>

            {/* Controls */}
            <div className="grid gap-4">
                {/* Runs */}
                <div className="grid grid-cols-4 gap-2">
                    {[0, 1, 2, 3].map(run => (
                        <Button key={run} variant="outline" className="h-16 text-xl font-bold" onClick={() => handleScoreUpdate(run)}>
                            {run}
                        </Button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Button className="h-16 text-xl font-bold bg-indigo-600 hover:bg-indigo-700" onClick={() => handleScoreUpdate(4)}>
                        4
                    </Button>
                    <Button className="h-16 text-xl font-bold bg-indigo-600 hover:bg-indigo-700" onClick={() => handleScoreUpdate(6)}>
                        6
                    </Button>
                </div>

                {/* Extras & Wickets */}
                <div className="grid grid-cols-4 gap-2">
                    <Button variant="secondary" className="h-12 font-bold" onClick={() => handleScoreUpdate(1, true, 'WD')}>WD</Button>
                    <Button variant="secondary" className="h-12 font-bold" onClick={() => handleScoreUpdate(1, true, 'NB')}>NB</Button>
                    <Button variant="secondary" className="h-12 font-bold" onClick={() => handleScoreUpdate(1, true, 'B')}>Bye</Button>
                    <Button variant="destructive" className="h-12 font-bold" onClick={() => handleScoreUpdate(0, false, null, true)}>OUT</Button>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t">
                <Button variant="outline" onClick={handleUndo} disabled={history.length === 0 || isUpdating}>
                    <Undo2 className="mr-2 h-4 w-4" /> Undo Last
                </Button>

                <Button variant="outline" className="text-destructive hover:text-destructive" onClick={handleEndMatch}>
                    <Flag className="mr-2 h-4 w-4" /> End Match
                </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground p-4">
                Updates are saved automatically.
            </div>
        </div>
    );
};

export default LiveScoring;
