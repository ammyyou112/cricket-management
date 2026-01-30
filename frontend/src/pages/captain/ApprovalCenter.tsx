import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalService, type ApprovalRequest, type ApprovalType } from '@/services/approval.service';
import { matchService } from '@/services/match.service';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function ApprovalCenter() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedType, setSelectedType] = useState<'all' | ApprovalType>('all');

  // Fetch pending approvals
  const { data: approvals, isLoading, refetch } = useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: async () => {
      return approvalService.getPendingApprovalsNew();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Respond to approval mutation
  const respondMutation = useMutation({
    mutationFn: async ({ approvalId, approve }: { approvalId: string; approve: boolean }) => {
      return approvalService.respondToApprovalNew(approvalId, approve);
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Success',
        description: variables.approve ? 'Approval granted' : 'Approval rejected',
      });
      refetch();
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to respond to approval',
        variant: 'destructive',
      });
    },
  });

  const handleRespond = (approvalId: string, approve: boolean) => {
    respondMutation.mutate({ approvalId, approve });
  };

  const getApprovalTypeLabel = (type: ApprovalType) => {
    switch (type) {
      case 'START_SCORING':
        return 'Start Scoring';
      case 'START_SECOND_INNINGS':
        return 'Start Second Innings';
      case 'FINAL_SCORE':
        return 'Final Score';
      default:
        return type;
    }
  };

  const getApprovalTypeColor = (type: ApprovalType) => {
    switch (type) {
      case 'START_SCORING':
        return 'bg-blue-500';
      case 'START_SECOND_INNINGS':
        return 'bg-orange-500';
      case 'FINAL_SCORE':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const filteredApprovals = approvals?.filter(approval => 
    selectedType === 'all' || approval.type === selectedType
  ) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Approval Center</h1>
          <p className="text-muted-foreground mt-1">
            Manage match approval requests
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Filter Tabs */}
      <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="START_SCORING">Start Scoring</TabsTrigger>
          <TabsTrigger value="START_SECOND_INNINGS">Second Innings</TabsTrigger>
          <TabsTrigger value="FINAL_SCORE">Final Score</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Approvals List */}
      {filteredApprovals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No pending approvals</p>
            <p className="text-sm text-muted-foreground mt-2">
              {selectedType === 'all' 
                ? 'You have no pending approval requests'
                : `No pending ${getApprovalTypeLabel(selectedType as ApprovalType).toLowerCase()} requests`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredApprovals.map((approval) => {
            const requestedAt = new Date(approval.requestedAt);
            const autoApproveAt = new Date(approval.autoApproveAt);
            const timeUntilAutoApprove = autoApproveAt.getTime() - Date.now();
            const minutesRemaining = Math.max(0, Math.floor(timeUntilAutoApprove / 60000));

            return (
              <Card key={approval.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getApprovalTypeColor(approval.type)}>
                          {getApprovalTypeLabel(approval.type)}
                        </Badge>
                        <Badge variant="outline">
                          {approval.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-xl">
                        {approval.match?.teamA?.teamName} vs {approval.match?.teamB?.teamName}
                      </CardTitle>
                      <CardDescription className="mt-2">
                        Requested by {approval.requester?.fullName || 'Unknown'}
                        {' • '}
                        {formatDistanceToNow(requestedAt, { addSuffix: true })}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Auto-approval countdown */}
                    {approval.autoApproveEnabled && timeUntilAutoApprove > 0 && (
                      <Alert>
                        <Clock className="h-4 w-4" />
                        <AlertTitle>Auto-approval in {minutesRemaining} minutes</AlertTitle>
                        <AlertDescription>
                          This request will be automatically approved if no action is taken.
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleRespond(approval.id, true)}
                        disabled={respondMutation.isPending}
                        className="flex-1"
                      >
                        {respondMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleRespond(approval.id, false)}
                        disabled={respondMutation.isPending}
                        className="flex-1"
                      >
                        {respondMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </>
                        )}
                      </Button>
                      {approval.match && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/matches/${approval.matchId}`)}
                        >
                          View Match
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

