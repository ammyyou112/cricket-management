import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { approvalService } from '@/services/approval.service';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface Approval {
  id: string;
  match: {
    id: string;
    teamA: { teamName: string };
    teamB: { teamName: string };
  };
  requester: {
    fullName: string;
    email: string;
  };
  status: string;
  requestedAt: string;
}

export default function ApprovalRequests() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [requests, setRequests] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await approvalService.getPendingApprovals();
      setRequests(response.data || []);
    } catch (error: any) {
      console.error('Failed to load approvals:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending approvals',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (approvalId: string, approve: boolean) => {
    try {
      await approvalService.respondToApproval(approvalId, approve);
      toast({
        title: 'Success',
        description: approve ? 'Match approved!' : 'Request rejected',
      });
      loadRequests();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to respond',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Match Start Approvals</h1>
        <p className="text-gray-600">Approve or reject match start requests from opponent captains</p>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No pending approval requests</p>
          </CardContent>
        </Card>
      ) : (
        requests.map((request) => (
          <Card key={request.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {request.match.teamA.teamName} vs {request.match.teamB.teamName}
                </span>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Pending
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Captain <strong>{request.requester.fullName}</strong> wants to start scoring
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(request.requestedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => handleRespond(request.id, true)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    onClick={() => handleRespond(request.id, false)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

