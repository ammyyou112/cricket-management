import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { teamService } from '@/services/team.service';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Mail, CheckCircle2, XCircle, Users, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { TeamMember } from '@/types/api.types';

export default function MyInvitations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch invitations
  const { data: invitations, isLoading, error } = useQuery({
    queryKey: ['myInvitations', user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not found');
      return await teamService.getMyInvitations();
    },
    enabled: !!user?.id,
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async ({ teamId, playerId }: { teamId: string; playerId: string }) => {
      return await teamService.updateMemberStatus(teamId, playerId, 'ACTIVE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myInvitations', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['myTeams', user?.id] });
      toast({
        title: 'Invitation Accepted',
        description: 'You have successfully joined the team!',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to accept invitation',
        variant: 'destructive',
      });
    },
  });

  // Reject invitation mutation
  const rejectInvitationMutation = useMutation({
    mutationFn: async ({ teamId, playerId }: { teamId: string; playerId: string }) => {
      return await teamService.updateMemberStatus(teamId, playerId, 'REJECTED');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myInvitations', user?.id] });
      toast({
        title: 'Invitation Rejected',
        description: 'You have declined the team invitation.',
      });
    },
    onError: (err: any) => {
      toast({
        title: 'Error',
        description: err.message || 'Failed to reject invitation',
        variant: 'destructive',
      });
    },
  });

  const handleAccept = (teamId: string, playerId: string) => {
    if (!confirm('Are you sure you want to accept this invitation and join the team?')) {
      return;
    }
    acceptInvitationMutation.mutate({ teamId, playerId });
  };

  const handleReject = (teamId: string, playerId: string) => {
    if (!confirm('Are you sure you want to reject this invitation?')) {
      return;
    }
    rejectInvitationMutation.mutate({ teamId, playerId });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12 bg-red-50 rounded-lg">
          <div className="text-red-600 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2">Failed to Load Invitations</h2>
          <p className="text-gray-600 mb-4">{error instanceof Error ? error.message : 'Unknown error'}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Team Invitations</h1>
        <p className="text-gray-600">View and respond to team invitations from captains</p>
      </div>

      {!invitations || invitations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-semibold mb-2">No Invitations</h3>
            <p className="text-gray-600 mb-6">
              You don't have any pending team invitations at the moment.
            </p>
            <Button onClick={() => navigate('/player/teams')} variant="outline">
              Browse Available Teams
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invitations.map((invitation: any) => {
            const team = invitation.team;
            const captain = team?.captain;
            const invitationDate = invitation.createdAt
              ? new Date(invitation.createdAt)
              : null;

            return (
              <Card key={invitation.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    {/* Team Logo */}
                    <div className="flex-shrink-0">
                      {team?.logoUrl ? (
                        <img
                          src={team.logoUrl}
                          alt={team.teamName}
                          className="w-20 h-20 rounded-full object-cover border-4 border-gray-100"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                          <Users className="w-10 h-10 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Team Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="text-xl font-bold mb-1">{team?.teamName || 'Unknown Team'}</h3>
                          {team?.description && (
                            <p className="text-gray-600 text-sm mb-2">{team.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-300">
                          <Mail className="w-3 h-3 mr-1" />
                          Invited
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                        {team?.city && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="font-semibold">City:</span>
                            <span>{team.city}</span>
                          </div>
                        )}
                        {captain && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <span className="font-semibold">Captain:</span>
                            <span>{captain.fullName || captain.email}</span>
                          </div>
                        )}
                        {invitationDate && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>
                              Invited {format(invitationDate, 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3">
                        <Button
                          onClick={() => handleAccept(team.id, invitation.playerId)}
                          disabled={
                            acceptInvitationMutation.isPending ||
                            rejectInvitationMutation.isPending
                          }
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          {acceptInvitationMutation.isPending ? 'Accepting...' : 'Accept Invitation'}
                        </Button>
                        <Button
                          onClick={() => handleReject(team.id, invitation.playerId)}
                          disabled={
                            acceptInvitationMutation.isPending ||
                            rejectInvitationMutation.isPending
                          }
                          variant="outline"
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          {rejectInvitationMutation.isPending ? 'Rejecting...' : 'Reject'}
                        </Button>
                        <Button
                          onClick={() => navigate(`/teams/${team.id}`)}
                          variant="outline"
                        >
                          View Team
                        </Button>
                      </div>
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

