import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth'; // assuming user ID is needed for logic
import { useMyTeams } from '../../hooks/useTeam';
import { useUpcomingMatches, useLiveMatches, useRequestScoring, useApproveScoring } from '../../hooks/useMatch';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Skeleton } from '../../components/ui/skeleton';
import { useToast } from '../../components/ui/use-toast';
import { PlayCircle, Clock, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const MatchControl = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const { data: myTeams } = useMyTeams(user?.id);
    const captainTeam = myTeams?.find(t => t.captain_id === user?.id);

    // Fetching ALL matches then filtering. Ideally, an API endpoint like /matches/my-matches is better.
    // Reusing existing hooks:
    const { data: upcoming, isLoading: upcomingLoading } = useUpcomingMatches();
    const { data: live, isLoading: liveLoading } = useLiveMatches();

    const { mutate: requestScoring, isPending: isRequesting } = useRequestScoring();
    const { mutate: approveScoring, isPending: isApproving } = useApproveScoring();

    // Filter Logic
    const filterMatches = (matches: any[] = []) => {
        if (!captainTeam) return [];
        return matches.filter(m => m.team_a_id === captainTeam.id || m.team_b_id === captainTeam.id);
    };

    const myUpcomingMatches = filterMatches(upcoming);
    const myLiveMatches = filterMatches(live);

    const handleStartScoring = (matchId: string) => {
        if (!captainTeam) return;
        requestScoring({ matchId, captainId: captainTeam.captain_id }, {
            onSuccess: () => {
                toast({ title: 'Request Sent', description: 'Waiting for opponent captain to approve.' });
            }
        });
    };

    const handleApproveScoring = (matchId: string) => {
        if (!captainTeam) return;
        approveScoring({ matchId, approvingCaptainId: captainTeam.captain_id }, {
            onSuccess: () => {
                toast({ title: 'Approved', description: 'Scoring can now begin.' });
                navigate(`/match/${matchId}/scorer`);
            }
        });
    };

    const handleEnterScorer = (matchId: string) => {
        navigate(`/match/${matchId}/scorer`);
    };

    if (!captainTeam) return <div className="p-8 text-center">You are not leading any team.</div>;

    const MatchCard = ({ match, type }: { match: any, type: 'live' | 'upcoming' }) => {
        const isMyTeamA = match.team_a_id === captainTeam.id;
        const opponent = isMyTeamA ? match.team_b : match.team_a;

        // Logic for buttons
        // 1. If scoring_captain_id is set and it's ME -> Show "Opponent Approval Pending" or "Enter Scorer" if approved
        // 2. If scoring_captain_id is set and it's OPPONENT -> Show "Approve Scoring" button
        // 3. If NOT set -> Show "Start Scoring" (Request)

        let actionArea = null;

        if (type === 'live') {
            actionArea = (
                <Button className="w-full" onClick={() => handleEnterScorer(match.id)}>
                    <PlayCircle className="mr-2 h-4 w-4" /> Continue Scoring
                </Button>
            );
        } else {
            // Scheduled / Upcoming Logic
            if (match.scoring_captain_id) {
                if (match.scoring_captain_id === user?.id) {
                    if (match.approved_by_captain_id) {
                        actionArea = (
                            <Button className="w-full" onClick={() => handleEnterScorer(match.id)}>
                                <PlayCircle className="mr-2 h-4 w-4" /> Start Match
                            </Button>
                        );
                    } else {
                        actionArea = <Badge variant="outline" className="w-full justify-center py-2">Waiting for Approval</Badge>;
                    }
                } else {
                    // Opponent requested
                    if (!match.approved_by_captain_id) {
                        actionArea = (
                            <Button className="w-full" variant="secondary" onClick={() => handleApproveScoring(match.id)} disabled={isApproving}>
                                <CheckCircle2 className="mr-2 h-4 w-4" /> Approve Scorer
                            </Button>
                        );
                    } else {
                        actionArea = <Badge variant="secondary" className="w-full justify-center py-2">Scoring Approved (Opponent)</Badge>;
                    }
                }
            } else {
                actionArea = (
                    <Button className="w-full" onClick={() => handleStartScoring(match.id)} disabled={isRequesting}>
                        Start Scoring Request
                    </Button>
                );
            }
        }

        return (
            <Card>
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-lg">vs {opponent?.team_name}</CardTitle>
                            <div className="text-sm text-muted-foreground flex items-center mt-1">
                                <Calendar className="mr-1 h-3 w-3" />
                                {format(new Date(match.match_date), 'MMM dd, HH:mm')}
                            </div>
                        </div>
                        <Badge variant={type === 'live' ? 'destructive' : 'default'} className="uppercase">
                            {match.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-sm mb-4">Venue: {match.venue}</div>
                    {actionArea}
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Match Control</h1>
            </div>

            <Tabs defaultValue="upcoming" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="upcoming">Scheduled</TabsTrigger>
                    <TabsTrigger value="live">Live Now</TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming" className="mt-4">
                    {upcomingLoading ? <Skeleton className="h-32 w-full" /> :
                        myUpcomingMatches.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {myUpcomingMatches.map(m => <MatchCard key={m.id} match={m} type="upcoming" />)}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">No scheduled matches found.</div>
                        )
                    }
                </TabsContent>

                <TabsContent value="live" className="mt-4">
                    {liveLoading ? <Skeleton className="h-32 w-full" /> :
                        myLiveMatches.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {myLiveMatches.map(m => <MatchCard key={m.id} match={m} type="live" />)}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">No live matches currently.</div>
                        )
                    }
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default MatchControl;
