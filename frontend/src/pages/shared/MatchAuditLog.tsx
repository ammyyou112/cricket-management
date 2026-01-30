import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { auditService, type AuditLog, type AuditAction } from '@/services/audit.service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { 
  History, 
  User, 
  Clock, 
  FileText,
  Filter
} from 'lucide-react';

export default function MatchAuditLog() {
  const { matchId } = useParams<{ matchId: string }>();
  const [actionFilter, setActionFilter] = useState<'all' | AuditAction>('all');

  // Validate matchId is a valid UUID (not the literal string ":matchId")
  const isValidMatchId = matchId && matchId !== ':matchId' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(matchId);

  // Fetch audit logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', matchId, actionFilter],
    queryFn: async () => {
      if (!matchId || !isValidMatchId) {
        throw new Error('Valid match ID required');
      }
      return auditService.getMatchAuditLogs(matchId);
    },
    enabled: !!matchId && isValidMatchId,
  });

  const getActionLabel = (action: AuditAction) => {
    return action.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getActionColor = (action: AuditAction) => {
    if (action.includes('APPROVAL')) return 'bg-blue-500';
    if (action.includes('BALL')) return 'bg-green-500';
    if (action.includes('STATUS')) return 'bg-purple-500';
    if (action.includes('STATS')) return 'bg-orange-500';
    return 'bg-gray-500';
  };

  const filteredLogs = logs?.filter(log => 
    actionFilter === 'all' || log.action === actionFilter
  ) || [];

  if (!matchId || !isValidMatchId) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Invalid match ID. Please navigate from a match details page.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <History className="h-8 w-8" />
            Match Audit Log
          </h1>
          <p className="text-muted-foreground mt-1">
            Complete history of all actions performed during this match
          </p>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={actionFilter} onValueChange={(v) => setActionFilter(v as any)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="BALL_ENTERED">Ball Entered</SelectItem>
                <SelectItem value="BALL_DELETED">Ball Deleted</SelectItem>
                <SelectItem value="APPROVAL_REQUESTED">Approval Requested</SelectItem>
                <SelectItem value="APPROVAL_GRANTED">Approval Granted</SelectItem>
                <SelectItem value="APPROVAL_REJECTED">Approval Rejected</SelectItem>
                <SelectItem value="APPROVAL_AUTO_APPROVED">Auto-Approved</SelectItem>
                <SelectItem value="STATUS_CHANGED">Status Changed</SelectItem>
                <SelectItem value="STATS_CALCULATED">Stats Calculated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>
            {filteredLogs.length} {filteredLogs.length === 1 ? 'Entry' : 'Entries'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="border rounded-lg p-4 space-y-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className={getActionColor(log.action)}>
                          {getActionLabel(log.action)}
                        </Badge>
                        {log.wasAutoApproved && (
                          <Badge variant="outline">Auto-Approved</Badge>
                        )}
                        {log.ballNumber && (
                          <Badge variant="outline">
                            Over {log.overNumber}.{log.ballNumber}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {format(new Date(log.performedAt), 'PPp')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {log.user?.fullName || log.performedBy}
                      </span>
                      {log.user?.email && (
                        <span className="text-muted-foreground">
                          ({log.user.email})
                        </span>
                      )}
                    </div>

                    {log.newState && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-3 w-3" />
                          <span className="font-medium">Details:</span>
                        </div>
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(log.newState, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

