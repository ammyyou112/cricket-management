import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { useAuth } from '../../hooks/useAuth';
import { useMatchDetails, useMatchScore, useUpdateScore } from '../../hooks/useMatch';
import { useRealtimeMatchScore } from '../../hooks/useRealtime';
import { useOfflineDetection } from '../../hooks/useOfflineDetection';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { saveOfflineMatchUpdate } from '../../lib/offlineStorage';
import { BottomSheet } from '../../components/mobile/BottomSheet';
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
import { Undo2, Save, Flag, CheckCircle2, RotateCcw, Wifi, WifiOff, Cloud, CloudOff, ChevronDown, ChevronUp, Loader2, Plus } from 'lucide-react';
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
    const { isOnline, justCameOnline } = useOfflineDetection();
    const { pendingCount, isSyncing } = useOfflineSync();
    
    // Subscribe to realtime updates (hook will handle online check internally if needed)
    useRealtimeMatchScore(isOnline ? matchId! : undefined);

    const { mutate: updateScore, isPending: isUpdating } = useUpdateScore();
    
    // Mobile-specific state
    const [isScoreboardCollapsed, setIsScoreboardCollapsed] = useState(false);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    
    // Pull to refresh
    const { isPulling, isRefreshing, pullProgress } = usePullToRefresh({
        onRefresh: async () => {
            queryClient.invalidateQueries({ queryKey: ['matchScore', matchId] });
            queryClient.invalidateQueries({ queryKey: ['match', matchId] });
        },
        enabled: isOnline
    });
    
    // Swipe handlers for mobile navigation
    const swipeHandlers = useSwipeable({
        onSwipedUp: () => setIsScoreboardCollapsed(true),
        onSwipedDown: () => setIsScoreboardCollapsed(false),
        trackMouse: false
    });
    
    // Haptic feedback helper
    const triggerHaptic = (pattern: number | number[] = 10) => {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    };

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
        mutationFn: async (winnerTeamId: string) => {
            if (!isOnline) {
                // Save to offline storage
                await saveOfflineMatchUpdate(matchId!, 'complete', { winnerTeamId });
                return { data: { id: matchId, winner_team_id: winnerTeamId }, error: null };
            }
            return matchApi.completeMatch(matchId!, winnerTeamId);
        },
        onSuccess: () => {
            if (isOnline) {
                toast({ title: 'Match Completed', description: 'Final result has been saved.' });
                navigate(`/matches/${matchId}`);
            } else {
                toast({ 
                    title: 'Match completion saved locally', 
                    description: 'Will sync when connection is restored.' 
                });
            }
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
        // Haptic feedback on score update
        triggerHaptic();
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

        // Get batting team ID from activeScore or match
        const battingTeamId = activeScore?.batting_team_id || match?.team_a_id;

        const newScoreObj = {
            batting_team_id: battingTeamId,
            total_runs: newRuns,
            total_wickets: newWickets,
            total_overs: parseFloat(newOvers.toFixed(1)), // float precision fix
            extras: newExtras // Ideally we'd track breakdown but DB has single field
        };

        setLocalScore({
            total_runs: newRuns,
            total_wickets: newWickets,
            total_overs: parseFloat(newOvers.toFixed(1)),
            extras: newExtras
        });

        // Update score (will use offline storage if offline)
        updateScore({
            matchId: matchId!,
            data: newScoreObj
        }, {
            onSuccess: () => {
                if (!isOnline) {
                    toast({
                        title: 'Saved locally',
                        description: 'Score saved offline. Will sync when connection is restored.',
                    });
                }
            },
            onError: (error) => {
                if (isOnline) {
                    toast({
                        title: 'Update failed',
                        description: 'Failed to update score. Please try again.',
                        variant: 'destructive',
                    });
                }
            }
        });
    };

    const handleUndo = () => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        setHistory(curr => curr.slice(0, -1));
        setLocalScore(lastState);
        
        const battingTeamId = activeScore?.batting_team_id || match?.team_a_id;
        updateScore({
            matchId: matchId!,
            data: {
                batting_team_id: battingTeamId,
                ...lastState
            }
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
        <div className="max-w-md mx-auto space-y-4 pb-20 md:pb-4">
            {/* Pull to Refresh Indicator */}
            {isPulling && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-primary/10 backdrop-blur-sm py-4 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                        {pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
                    </p>
                </div>
            )}

            {/* Offline/Online Status Banner */}
            {!isOnline && (
                <Alert className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
                    <WifiOff className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                    <AlertTitle className="text-orange-800 dark:text-orange-200">Offline Mode</AlertTitle>
                    <AlertDescription className="text-orange-700 dark:text-orange-300">
                        Scores are being saved locally and will sync when connection is restored.
                        {pendingCount > 0 && ` (${pendingCount} pending)`}
                    </AlertDescription>
                </Alert>
            )}

            {isOnline && justCameOnline && pendingCount > 0 && (
                <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <Cloud className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertTitle className="text-green-800 dark:text-green-200">Back Online</AlertTitle>
                    <AlertDescription className="text-green-700 dark:text-green-300">
                        {isSyncing 
                            ? `Syncing ${pendingCount} pending update${pendingCount > 1 ? 's' : ''}...`
                            : `Syncing ${pendingCount} pending update${pendingCount > 1 ? 's' : ''}...`
                        }
                    </AlertDescription>
                </Alert>
            )}

            {/* Sticky Score Summary for Mobile */}
            <div className="md:hidden sticky top-0 bg-background/95 backdrop-blur-sm shadow-sm z-30 p-3 border-b">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xs text-muted-foreground">{match.team_a?.team_name} vs {match.team_b?.team_name}</p>
                        <p className="text-2xl font-bold tabular-nums">
                            {localScore.total_runs}/{localScore.total_wickets}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-muted-foreground">Overs</p>
                        <p className="text-xl font-semibold">{localScore.total_overs.toFixed(1)}</p>
                    </div>
                </div>
            </div>

            {/* Scoreboard - Collapsible on Mobile */}
            <Card 
                className={`sticky top-0 md:top-16 z-10 border-primary/50 shadow-lg bg-background transition-all duration-300 ${
                    isScoreboardCollapsed ? 'md:block hidden' : ''
                }`}
                {...swipeHandlers}
            >
                <CardHeader className="pb-2 text-center">
                    <div className="flex justify-between items-center text-xs text-muted-foreground uppercase tracking-widest">
                        <span className="hidden md:inline">{match.team_a?.team_name} vs {match.team_b?.team_name}</span>
                        <div className="flex items-center gap-2">
                            {!isOnline && (
                                <Badge variant="outline" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                                    <WifiOff className="h-3 w-3 mr-1" />
                                    <span className="hidden md:inline">OFFLINE</span>
                                </Badge>
                            )}
                            <Badge variant="destructive" className="animate-pulse">LIVE</Badge>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="md:hidden h-6 w-6 p-0"
                                onClick={() => setIsScoreboardCollapsed(!isScoreboardCollapsed)}
                            >
                                {isScoreboardCollapsed ? (
                                    <ChevronDown className="h-4 w-4" />
                                ) : (
                                    <ChevronUp className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
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

            {/* Controls - Mobile Optimized */}
            <div className="grid gap-4">
                {/* Runs - Larger touch targets on mobile */}
                <div className="grid grid-cols-4 gap-3 md:gap-2">
                    {[0, 1, 2, 3].map(run => (
                        <Button 
                            key={run} 
                            variant="outline" 
                            className="h-16 md:h-16 min-h-[44px] text-xl md:text-xl font-bold touch-manipulation active:scale-95 transition-transform" 
                            onClick={() => handleScoreUpdate(run)}
                        >
                            {run}
                        </Button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-3 md:gap-2">
                    <Button 
                        className="h-16 md:h-16 min-h-[44px] text-xl md:text-xl font-bold bg-indigo-600 hover:bg-indigo-700 touch-manipulation active:scale-95 transition-transform" 
                        onClick={() => handleScoreUpdate(4)}
                    >
                        4
                    </Button>
                    <Button 
                        className="h-16 md:h-16 min-h-[44px] text-xl md:text-xl font-bold bg-indigo-600 hover:bg-indigo-700 touch-manipulation active:scale-95 transition-transform" 
                        onClick={() => handleScoreUpdate(6)}
                    >
                        6
                    </Button>
                </div>

                {/* Extras & Wickets - Larger on mobile */}
                <div className="grid grid-cols-4 gap-3 md:gap-2">
                    <Button 
                        variant="secondary" 
                        className="h-14 md:h-12 min-h-[44px] font-bold touch-manipulation active:scale-95 transition-transform" 
                        onClick={() => handleScoreUpdate(1, true, 'WD')}
                    >
                        WD
                    </Button>
                    <Button 
                        variant="secondary" 
                        className="h-14 md:h-12 min-h-[44px] font-bold touch-manipulation active:scale-95 transition-transform" 
                        onClick={() => handleScoreUpdate(1, true, 'NB')}
                    >
                        NB
                    </Button>
                    <Button 
                        variant="secondary" 
                        className="h-14 md:h-12 min-h-[44px] font-bold touch-manipulation active:scale-95 transition-transform" 
                        onClick={() => handleScoreUpdate(1, true, 'B')}
                    >
                        Bye
                    </Button>
                    <Button 
                        variant="destructive" 
                        className="h-14 md:h-12 min-h-[44px] font-bold touch-manipulation active:scale-95 transition-transform" 
                        onClick={() => handleScoreUpdate(0, false, null, true)}
                    >
                        OUT
                    </Button>
                </div>
                
                {/* Advanced Options Button - Mobile Only */}
                <Button
                    variant="outline"
                    className="md:hidden h-14 min-h-[44px] touch-manipulation"
                    onClick={() => setShowAdvancedOptions(true)}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    More Options
                </Button>
            </div>

            {/* Actions - Mobile Optimized */}
            <div className="flex items-center justify-between gap-3 md:gap-4 pt-4 border-t">
                <Button 
                    variant="outline" 
                    onClick={handleUndo} 
                    disabled={history.length === 0 || isUpdating}
                    className="min-h-[44px] touch-manipulation flex-1 md:flex-initial"
                >
                    <Undo2 className="mr-2 h-4 w-4" /> 
                    <span className="hidden sm:inline">Undo Last</span>
                    <span className="sm:hidden">Undo</span>
                </Button>

                <Button 
                    variant="outline" 
                    className="text-destructive hover:text-destructive min-h-[44px] touch-manipulation flex-1 md:flex-initial" 
                    onClick={handleEndMatch}
                >
                    <Flag className="mr-2 h-4 w-4" /> 
                    <span className="hidden sm:inline">End Match</span>
                    <span className="sm:hidden">End</span>
                </Button>
            </div>

            <div className="text-center text-xs text-muted-foreground p-4">
                {isOnline 
                    ? 'Updates are saved automatically.'
                    : 'Updates are saved locally. Will sync when online.'
                }
            </div>

            {/* Bottom Sheet for Advanced Options - Mobile Only */}
            <BottomSheet
                isOpen={showAdvancedOptions}
                onClose={() => setShowAdvancedOptions(false)}
                title="Advanced Scoring"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="h-14 min-h-[44px] touch-manipulation"
                            onClick={() => {
                                handleScoreUpdate(5);
                                setShowAdvancedOptions(false);
                            }}
                        >
                            5 Runs
                        </Button>
                        <Button
                            variant="outline"
                            className="h-14 min-h-[44px] touch-manipulation"
                            onClick={() => {
                                handleScoreUpdate(7);
                                setShowAdvancedOptions(false);
                            }}
                        >
                            7 Runs
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="h-14 min-h-[44px] touch-manipulation"
                            onClick={() => {
                                handleScoreUpdate(1, true, 'LB');
                                setShowAdvancedOptions(false);
                            }}
                        >
                            Leg Bye
                        </Button>
                        <Button
                            variant="outline"
                            className="h-14 min-h-[44px] touch-manipulation"
                            onClick={() => {
                                handleUndo();
                                setShowAdvancedOptions(false);
                            }}
                            disabled={history.length === 0}
                        >
                            Undo Last
                        </Button>
                    </div>
                </div>
            </BottomSheet>

            {/* Floating Action Button - Mobile Only */}
            <button
                className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center md:hidden z-40 touch-manipulation active:scale-95 transition-transform"
                onClick={() => setShowAdvancedOptions(true)}
                aria-label="More options"
            >
                <Plus className="h-6 w-6" />
            </button>
        </div>
    );
};

export default LiveScoring;
