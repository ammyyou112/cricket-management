import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verificationService } from '@/services/verification.service';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

interface Verification {
  id: string;
  match: {
    id: string;
    teamA: { teamName: string };
    teamB: { teamName: string };
  };
  submitter: {
    fullName: string;
    email: string;
  };
  teamAScore: number;
  teamBScore: number;
  teamAWickets: number;
  teamBWickets: number;
  status: string;
  submittedAt: string;
}

export default function ScoreVerification() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pendingVerifications, setPendingVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingVerifications();
  }, []);

  const loadPendingVerifications = async () => {
    try {
      setLoading(true);
      const response = await verificationService.getPendingVerifications();
      setPendingVerifications(response.data || []);
    } catch (error: any) {
      console.error('Failed to load verifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load pending verifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (verificationId: string, agree: boolean) => {
    try {
      await verificationService.verifyScore(verificationId, { agree });
      toast({
        title: 'Success',
        description: agree ? 'Score verified!' : 'Score disputed',
      });
      loadPendingVerifications();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to verify score',
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
        <h1 className="text-3xl font-bold mb-2">Score Verifications</h1>
        <p className="text-gray-600">Review and verify match scores submitted by opponent captains</p>
      </div>

      {pendingVerifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No pending score verifications</p>
          </CardContent>
        </Card>
      ) : (
        pendingVerifications.map((verification) => (
          <Card key={verification.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  {verification.match.teamA.teamName} vs {verification.match.teamB.teamName}
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
                    Submitted by: <strong>{verification.submitter.fullName}</strong>
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(verification.submittedAt).toLocaleString()}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium mb-2">Submitted Score:</p>
                  <div className="text-2xl font-bold">
                    {verification.teamAScore}-{verification.teamAWickets} vs{' '}
                    {verification.teamBScore}-{verification.teamBWickets}
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => handleVerify(verification.id, true)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Verify (Agree)
                  </Button>
                  <Button
                    onClick={() => handleVerify(verification.id, false)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Dispute
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

