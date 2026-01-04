import { prisma } from '@/config/database';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '@/utils/errors';
import { TeamMember, User, TeamMemberStatus, UserRole, NotificationType } from '@prisma/client';

export interface CreateTeamInput {
  name: string;
  description?: string;
  logoUrl?: string;
  city?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  captainId: string;
}

export interface UpdateTeamInput {
  name?: string;
  description?: string;
  logoUrl?: string;
}

export interface GetTeamsQuery {
  search?: string;
  captainId?: string;
  page?: number;
  limit?: number;
}

export interface TeamWithMembers {
  id: string;
  name: string;
  captainId: string;
  logoUrl: string | null;
  description: string | null;
  city: string | null;
  locationLatitude: any;
  locationLongitude: any;
  createdAt: Date;
  updatedAt: Date;
  captain: Omit<User, 'password'>;
  members: Array<TeamMember & { user: Omit<User, 'password'> }>;
  _count?: {
    members: number;
  };
}

export class TeamService {
  /**
   * Create a new team
   */
  static async createTeam(input: CreateTeamInput): Promise<TeamWithMembers> {
    // Check if user is captain or admin
    const user = await prisma.user.findUnique({
      where: { id: input.captainId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role !== UserRole.CAPTAIN && user.role !== UserRole.ADMIN) {
      throw new ForbiddenError('Only captains and admins can create teams');
    }

    // Check if team name already exists
    const existingTeam = await prisma.team.findFirst({
      where: { teamName: input.name },
    });

    if (existingTeam) {
      throw new ConflictError('Team with this name already exists');
    }

    // Get captain's location if not provided
    let locationLatitude = input.locationLatitude;
    let locationLongitude = input.locationLongitude;
    
    // If location not provided, use captain's location
    if (!locationLatitude || !locationLongitude) {
      locationLatitude = user.locationLatitude ? Number(user.locationLatitude) : undefined;
      locationLongitude = user.locationLongitude ? Number(user.locationLongitude) : undefined;
    }

    // Create team with captain as first active member
    const team = await prisma.team.create({
      data: {
        teamName: input.name,
        description: input.description,
        logoUrl: input.logoUrl,
        city: input.city,
        locationLatitude: locationLatitude,
        locationLongitude: locationLongitude,
        captainId: input.captainId,
        members: {
          create: {
            playerId: input.captainId,
            status: TeamMemberStatus.ACTIVE,
            joinedAt: new Date(),
          },
        },
      },
      include: {
        captain: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            playerType: true,
            profilePictureUrl: true,
            city: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        members: {
          include: {
            player: {
              select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                playerType: true,
                profilePictureUrl: true,
                city: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    // Transform teamName to name for API response
    const { teamName, ...rest } = team;
    return { ...rest, name: teamName } as any as TeamWithMembers;
  }

  /**
   * Get all teams with pagination and filters
   */
  static async getTeams(query: GetTeamsQuery): Promise<{
    teams: TeamWithMembers[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { teamName: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.captainId) {
      where.captainId = query.captainId;
    }

    const total = await prisma.team.count({ where });

    const teams = await prisma.team.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        captain: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            playerType: true,
            profilePictureUrl: true,
            city: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        members: {
          include: {
            player: {
              select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                playerType: true,
                profilePictureUrl: true,
                city: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    // Transform teamName to name and player to user for API response
    const transformedTeams = teams.map((team: any) => {
      const { teamName, members, ...rest } = team;
      const transformedMembers = members.map((member: any) => {
        const { player, ...memberRest } = member;
        return { ...memberRest, user: player };
      });
      return { ...rest, name: teamName, members: transformedMembers };
    });

    return {
      teams: transformedTeams as TeamWithMembers[],
      total,
      page,
      limit,
    };
  }

  /**
   * Get team by ID with members
   */
  static async getTeamById(teamId: string): Promise<TeamWithMembers> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        captain: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            playerType: true,
            profilePictureUrl: true,
            city: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        members: {
          include: {
            player: {
              select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                playerType: true,
                profilePictureUrl: true,
                city: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Transform teamName to name and player to user
    const { teamName, members, ...rest } = team as any;
    const transformedMembers = members.map((member: any) => {
      const { player, ...memberRest } = member;
      return { ...memberRest, user: player };
    });

    return { ...rest, name: teamName, members: transformedMembers } as TeamWithMembers;
  }

  /**
   * Update team details
   */
  static async updateTeam(
    teamId: string,
    userId: string,
    userRole: string,
    input: UpdateTeamInput
  ): Promise<TeamWithMembers> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Only captain or admin can update team
    if (team.captainId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only team captain or admin can update team details');
    }

    // Prepare update data
    const updateData: any = {};
    if (input.description !== undefined) updateData.description = input.description;
    if (input.logoUrl !== undefined) updateData.logoUrl = input.logoUrl;
    if (input.name !== undefined) {
      // If updating name, check for conflicts
      if (input.name !== team.teamName) {
        const existingTeam = await prisma.team.findFirst({
          where: { teamName: input.name },
        });

        if (existingTeam) {
          throw new ConflictError('Team with this name already exists');
        }
      }
      updateData.teamName = input.name;
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: updateData,
      include: {
        captain: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            playerType: true,
            profilePictureUrl: true,
            city: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        members: {
          include: {
            player: {
              select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                playerType: true,
                profilePictureUrl: true,
                city: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    // Transform teamName to name and player to user
    const { teamName, members, ...rest } = updatedTeam as any;
    const transformedMembers = members.map((member: any) => {
      const { player, ...memberRest } = member;
      return { ...memberRest, user: player };
    });

    return { ...rest, name: teamName, members: transformedMembers } as TeamWithMembers;
  }

  /**
   * Delete team
   */
  static async deleteTeam(
    teamId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Only captain or admin can delete team
    if (team.captainId !== userId && userRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only team captain or admin can delete team');
    }

    // Delete team and all related records in a transaction
    // This ensures data integrity and prevents foreign key constraint errors
    try {
      await prisma.$transaction(async (tx) => {
        // Step 1: Find all matches involving this team
        const matchesWithTeam = await tx.match.findMany({
          where: {
            OR: [
              { teamAId: teamId },
              { teamBId: teamId },
              { winnerTeamId: teamId },
            ],
          },
          select: { id: true },
        });
        
        const matchIds = matchesWithTeam.map((m) => m.id);
        
        // Step 2: Delete score updates related to matches (if any matches exist)
        if (matchIds.length > 0) {
          await tx.scoreUpdate.deleteMany({
            where: { matchId: { in: matchIds } },
          });
        }
        
        // Step 3: Delete score updates directly related to this team
        await tx.scoreUpdate.deleteMany({
          where: { battingTeamId: teamId },
        });
        
        // Step 4: Delete match scores related to matches (if any matches exist)
        if (matchIds.length > 0) {
          await tx.matchScore.deleteMany({
            where: { matchId: { in: matchIds } },
          });
        }
        
        // Step 5: Delete match scores directly related to this team
        await tx.matchScore.deleteMany({
          where: { battingTeamId: teamId },
        });
        
        // Step 6: Delete player stats related to matches (if any matches exist)
        if (matchIds.length > 0) {
          await tx.playerStat.deleteMany({
            where: { matchId: { in: matchIds } },
          });
        }
        
        // Step 7: Delete player stats directly related to this team
        await tx.playerStat.deleteMany({
          where: { teamId: teamId },
        });
        
        // Step 8: Delete all matches where this team is involved
        if (matchIds.length > 0) {
          await tx.match.deleteMany({
            where: { id: { in: matchIds } },
          });
        }
        
        // Step 9: Team members are automatically deleted due to onDelete: Cascade
        // Step 10: Finally, delete the team itself
        await tx.team.delete({
          where: { id: teamId },
        });
      });
    } catch (error: any) {
      // Log the specific error for debugging
      console.error('Error deleting team:', error);
      console.error('Error code:', error?.code);
      console.error('Error message:', error?.message);
      console.error('Error meta:', error?.meta);
      console.error('Error stack:', error?.stack);
      
      // Handle Prisma-specific errors
      if (error?.code === 'P2003') {
        throw new BadRequestError(`Cannot delete team: Foreign key constraint violation. ${error?.meta?.field_name || ''}`);
      }
      
      if (error?.code === 'P2025') {
        throw new NotFoundError('Team not found or already deleted');
      }
      
      // Re-throw with more context
      throw new Error(`Failed to delete team: ${error?.message || 'Unknown error'}`);
    }
  }

  /**
   * Add member to team (simple - no invitation system yet)
   */
  static async addMember(
    teamId: string,
    newMemberId: string,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<TeamMember> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Only captain or admin can add members
    if (team.captainId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only team captain or admin can add members');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: newMemberId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_playerId: {
          teamId,
          playerId: newMemberId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError('User is already a team member');
    }

    // Add member as ACTIVE
    const member = await prisma.teamMember.create({
      data: {
        teamId,
        playerId: newMemberId,
        status: TeamMemberStatus.ACTIVE,
        joinedAt: new Date(),
      },
    });

    return member;
  }

  /**
   * Remove member from team
   */
  static async removeMember(
    teamId: string,
    memberId: string,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<void> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Cannot remove captain
    if (memberId === team.captainId) {
      throw new BadRequestError('Cannot remove team captain');
    }

    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_playerId: {
          teamId,
          playerId: memberId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError('Team member not found');
    }

    // Only captain or admin can remove members
    if (team.captainId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only team captain or admin can remove members');
    }

    await prisma.teamMember.delete({
      where: {
        teamId_playerId: {
          teamId,
          playerId: memberId,
        },
      },
    });
  }

  /**
   * Request to join a team (player-initiated)
   * Creates a PENDING team member and notification for captain
   */
  static async requestToJoin(
    teamId: string,
    playerId: string
  ): Promise<TeamMember> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        captain: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Check if player exists
    const player = await prisma.user.findUnique({
      where: { id: playerId },
    });

    if (!player) {
      throw new NotFoundError('Player not found');
    }

    // Check if already a member or has pending request
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_playerId: {
          teamId,
          playerId,
        },
      },
    });

    if (existingMember) {
      if (existingMember.status === TeamMemberStatus.ACTIVE) {
        throw new ConflictError('You are already a member of this team');
      }
      if (existingMember.status === TeamMemberStatus.PENDING) {
        throw new ConflictError('You already have a pending request for this team');
      }
      if (existingMember.status === TeamMemberStatus.INVITED) {
        throw new ConflictError('You have already been invited to this team');
      }
    }

    // Create join request (PENDING status) and notification in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create pending team member
      const member = await tx.teamMember.create({
        data: {
          teamId,
          playerId,
          status: TeamMemberStatus.PENDING,
        },
      });

      // Create notification for captain
      await tx.notification.create({
        data: {
          userId: team.captainId,
          type: NotificationType.JOIN_REQUEST,
          title: 'New Join Request',
          message: `${player.fullName} wants to join ${team.teamName}`,
          link: `/captain/requests`,
        },
      });

      return member;
    });

    return result;
  }

  /**
   * Get pending join requests for a team (captain/admin only)
   */
  static async getPendingRequests(
    teamId: string,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<TeamMember[]> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Only captain or admin can view requests
    if (team.captainId !== requestingUserId && requestingUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only team captain or admin can view join requests');
    }

    // Get all pending requests for this team
    const requests = await prisma.teamMember.findMany({
      where: {
        teamId,
        status: TeamMemberStatus.PENDING,
      },
      include: {
        player: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            playerType: true,
            profilePictureUrl: true,
            city: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return requests;
  }

  /**
   * Get player invitations (INVITED status for a specific player)
   */
  static async getPlayerInvitations(playerId: string): Promise<TeamMember[]> {
    const invitations = await prisma.teamMember.findMany({
      where: {
        playerId,
        status: TeamMemberStatus.INVITED,
      },
      include: {
        team: {
          select: {
            id: true,
            teamName: true,
            logoUrl: true,
            description: true,
            city: true,
            captain: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return invitations;
  }

  /**
   * Get team members (ACTIVE members only for squad display)
   */
  static async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Get ALL members first for debugging
    const allMembers = await prisma.teamMember.findMany({
      where: { teamId },
      select: {
        id: true,
        teamId: true,
        playerId: true,
        status: true,
        joinedAt: true,
      },
    });

    console.log(`🔍 [getTeamMembers] Team ${teamId} - All members:`, allMembers);
    console.log(`🔍 [getTeamMembers] ACTIVE members:`, allMembers.filter(m => m.status === TeamMemberStatus.ACTIVE));

    // Get only ACTIVE members
    const members = await prisma.teamMember.findMany({
      where: {
        teamId,
        status: TeamMemberStatus.ACTIVE,
      },
      include: {
        player: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            playerType: true,
            profilePictureUrl: true,
            city: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      // Order by joinedAt (ascending)
      // Note: In PostgreSQL, NULL values are sorted last by default in ASC order
      orderBy: {
        joinedAt: 'asc',
      },
    });

    console.log(`✅ [getTeamMembers] Returning ${members.length} ACTIVE members for team ${teamId}`);
    return members;
  }

  /**
   * Get user's teams
   */
  static async getUserTeams(userId: string): Promise<TeamWithMembers[]> {
    const teams = await prisma.team.findMany({
      where: {
        members: {
          some: {
            playerId: userId,
            status: TeamMemberStatus.ACTIVE,
          },
        },
      },
      include: {
        captain: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            playerType: true,
            profilePictureUrl: true,
            city: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        members: {
          include: {
            player: {
              select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                playerType: true,
                profilePictureUrl: true,
                city: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Transform teamName to name and player to user
    const transformedTeams = teams.map((team: any) => {
      const { teamName, members, ...rest } = team;
      const transformedMembers = members.map((member: any) => {
        const { player, ...memberRest } = member;
        return { ...memberRest, user: player };
      });
      return { ...rest, name: teamName, members: transformedMembers };
    });

    return transformedTeams as TeamWithMembers[];
  }

  /**
   * Invite member to team (replaces simple addMember)
   */
  static async inviteMember(
    teamId: string,
    invitedUserId: string,
    captainId: string,
    captainRole: string
  ): Promise<TeamMember> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Only captain or admin can invite members
    if (team.captainId !== captainId && captainRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only team captain or admin can invite members');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: invitedUserId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user is already a member
    const existingMember = await prisma.teamMember.findUnique({
      where: {
        teamId_playerId: {
          teamId,
          playerId: invitedUserId,
        },
      },
    });

    if (existingMember) {
      throw new ConflictError('User is already a member or has been invited');
    }

    // Create invitation and notification in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create invitation (INVITED status)
      const member = await tx.teamMember.create({
        data: {
          teamId,
          playerId: invitedUserId,
          status: TeamMemberStatus.INVITED,
        },
      });

      // Create notification for the invited player
      await tx.notification.create({
        data: {
          userId: invitedUserId,
          type: NotificationType.INVITATION,
          title: 'Team Invitation',
          message: `You've been invited to join ${team.teamName}`,
          link: `/player/invitations`,
        },
      });

      return member;
    });

    return result;
  }

  /**
   * Update member status (accept/reject invitation or update status)
   */
  static async updateMemberStatus(
    teamId: string,
    memberId: string,
    newStatus: TeamMemberStatus,
    requestingUserId: string,
    requestingUserRole: string
  ): Promise<TeamMember> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_playerId: {
          teamId,
          playerId: memberId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError('Team member not found');
    }

    // Logic for who can update status:
    // - Member can accept/reject their own invitation
    // - Captain can change any member status
    // - Admin can change any member status
    const isMemberThemselves = requestingUserId === memberId;
    const isCaptain = team.captainId === requestingUserId;
    const isAdmin = requestingUserRole === UserRole.ADMIN;

    if (!isMemberThemselves && !isCaptain && !isAdmin) {
      throw new ForbiddenError('You do not have permission to update this member status');
    }

    // If member is accepting/rejecting invitation
    if (isMemberThemselves && member.status === TeamMemberStatus.INVITED) {
      if (newStatus !== TeamMemberStatus.ACTIVE && newStatus !== TeamMemberStatus.REJECTED) {
        throw new BadRequestError('You can only accept (ACTIVE) or reject (REJECTED) invitations');
      }
    }

    // Prepare update data
    const updateData: any = { status: newStatus };
    if (newStatus === TeamMemberStatus.ACTIVE && !member.joinedAt) {
      updateData.joinedAt = new Date();
    }

    console.log(`🔄 [updateMemberStatus] Updating member ${memberId} in team ${teamId}:`, {
      oldStatus: member.status,
      newStatus: newStatus,
      updateData: updateData,
      currentMember: member,
    });

    const updatedMember = await prisma.teamMember.update({
      where: {
        teamId_playerId: {
          teamId,
          playerId: memberId,
        },
      },
      data: updateData,
    });

    console.log(`✅ [updateMemberStatus] Member updated successfully:`, {
      id: updatedMember.id,
      teamId: updatedMember.teamId,
      playerId: updatedMember.playerId,
      status: updatedMember.status,
      joinedAt: updatedMember.joinedAt,
    });

    return updatedMember;
  }

  /**
   * Leave team (for members)
   */
  static async leaveTeam(teamId: string, userId: string): Promise<void> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Captain cannot leave team
    if (userId === team.captainId) {
      throw new BadRequestError('Captain cannot leave team. Transfer captaincy first.');
    }

    const member = await prisma.teamMember.findUnique({
      where: {
        teamId_playerId: {
          teamId,
          playerId: userId,
        },
      },
    });

    if (!member) {
      throw new NotFoundError('You are not a member of this team');
    }

    await prisma.teamMember.delete({
      where: {
        teamId_playerId: {
          teamId,
          playerId: userId,
        },
      },
    });
  }

  /**
   * Transfer captain role
   */
  static async transferCaptain(
    teamId: string,
    newCaptainId: string,
    currentCaptainId: string,
    currentUserRole: string
  ): Promise<TeamWithMembers> {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
    });

    if (!team) {
      throw new NotFoundError('Team not found');
    }

    // Only current captain or admin can transfer captaincy
    if (team.captainId !== currentCaptainId && currentUserRole !== UserRole.ADMIN) {
      throw new ForbiddenError('Only current captain or admin can transfer captaincy');
    }

    // Check if new captain is a member
    const newCaptainMember = await prisma.teamMember.findUnique({
      where: {
        teamId_playerId: {
          teamId,
          playerId: newCaptainId,
        },
      },
    });

    if (!newCaptainMember) {
      throw new BadRequestError('New captain must be a team member');
    }

    if (newCaptainMember.status !== TeamMemberStatus.ACTIVE) {
      throw new BadRequestError('New captain must be an active team member');
    }

    // Check if new captain has captain or admin role
    const newCaptainUser = await prisma.user.findUnique({
      where: { id: newCaptainId },
    });

    if (!newCaptainUser) {
      throw new NotFoundError('New captain user not found');
    }

    if (newCaptainUser.role !== UserRole.CAPTAIN && newCaptainUser.role !== UserRole.ADMIN) {
      throw new BadRequestError('New captain must have CAPTAIN or ADMIN role');
    }

    // Transfer captaincy
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { captainId: newCaptainId },
      include: {
        captain: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            playerType: true,
            profilePictureUrl: true,
            city: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        members: {
          include: {
            player: {
              select: {
                id: true,
                email: true,
                fullName: true,
                role: true,
                playerType: true,
                profilePictureUrl: true,
                city: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    });

    // Transform teamName to name and player to user
    const { teamName, members, ...rest } = updatedTeam as any;
    const transformedMembers = members.map((member: any) => {
      const { player, ...memberRest } = member;
      return { ...memberRest, user: player };
    });

    return { ...rest, name: teamName, members: transformedMembers } as TeamWithMembers;
  }
}

