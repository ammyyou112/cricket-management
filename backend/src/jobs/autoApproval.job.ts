import { prisma } from '@/config/database';
import { ApprovalStatus, ApprovalType, MatchStatus, AuditAction } from '@prisma/client';
import logger from '@/utils/logger';
import { auditService } from '@/services/audit.service';
import { notificationService } from '@/services/notification.service';
import { StatsService } from '@/services/stats.service';
import { retryDbOperation } from '@/utils/dbRetry';

/**
 * Process auto-approvals for expired approval requests
 * This should be called by a cron job every minute
 */
export async function processAutoApprovals(): Promise<void> {
  try {
    const now = new Date();

    // Find pending approvals past their auto-approve time (with retry)
    const expiredApprovals = await retryDbOperation(
      () => prisma.approvalRequest.findMany({
      where: {
        status: ApprovalStatus.PENDING,
        autoApproveEnabled: true,
        autoApproveAt: { lte: now }
      },
      include: {
        match: {
          include: {
            teamA: { select: { captainId: true, teamName: true } },
            teamB: { select: { captainId: true, teamName: true } }
          }
        },
        requester: { select: { id: true, fullName: true, email: true } }
      }
      })
    );

    if (expiredApprovals.length === 0) {
      return; // No approvals to process
    }

    logger.info(`Processing ${expiredApprovals.length} auto-approvals`);

    for (const approval of expiredApprovals) {
      try {
        await processSingleAutoApproval(approval);
      } catch (error) {
        logger.error(`Failed to auto-approve ${approval.id}:`, error);
        // Continue with next approval
      }
    }
  } catch (error) {
    logger.error('Error processing auto-approvals:', error);
  }
}

/**
 * Process a single auto-approval
 */
async function processSingleAutoApproval(approval: any): Promise<void> {
  // Get opponent captain ID first
  const opponentCaptainId = approval.match.teamA.captainId === approval.requestedBy
    ? approval.match.teamB.captainId
    : approval.match.teamA.captainId;

  // Determine next status based on approval type
  let nextStatus: MatchStatus;
  let approvalsArray: string[] = [];
  let isFinalScore = false;
  
  switch (approval.type) {
    case ApprovalType.START_SCORING:
      nextStatus = MatchStatus.FIRST_INNINGS;
      break;
    case ApprovalType.START_SECOND_INNINGS:
      nextStatus = MatchStatus.SECOND_INNINGS;
      break;
    case ApprovalType.FINAL_SCORE:
      // For final score, check if both captains have approved
      const currentMatch = await prisma.match.findUnique({
        where: { id: approval.matchId },
        select: { finalScoreApprovedBy: true }
      });
      
      if (currentMatch?.finalScoreApprovedBy) {
        const currentApprovals = currentMatch.finalScoreApprovedBy;
        if (typeof currentApprovals === 'string') {
          approvalsArray = JSON.parse(currentApprovals) as string[];
        } else if (Array.isArray(currentApprovals)) {
          // Type guard to ensure all elements are strings
          approvalsArray = currentApprovals.filter((item): item is string => typeof item === 'string');
        }
      }
      
      // Add auto-approver (opponent captain)
      if (!approvalsArray.includes(opponentCaptainId)) {
        approvalsArray.push(opponentCaptainId);
      }
      
      // Add requester (they approved by submitting)
      if (!approvalsArray.includes(approval.requestedBy)) {
        approvalsArray.push(approval.requestedBy);
      }
      
      // Check if both captains have approved
      const bothCaptainsApproved = approvalsArray.length >= 2;
      nextStatus = bothCaptainsApproved ? MatchStatus.COMPLETED : MatchStatus.FINAL_PENDING;
      isFinalScore = true;
      break;
    default:
      throw new Error(`Invalid approval type: ${approval.type}`);
  }

  // Use transaction for atomic update with increased timeout
  await retryDbOperation(
    () => prisma.$transaction(async (tx) => {
    // Update approval status
    await tx.approvalRequest.update({
      where: { id: approval.id },
      data: {
        status: ApprovalStatus.AUTO_APPROVED,
        approvedBy: opponentCaptainId, // System approved on behalf of opponent
        approvedAt: new Date(),
        wasAutoApproved: true
      }
    });

    // Update match status
    await tx.match.update({
      where: { id: approval.matchId },
      data: {
        status: nextStatus,
        // Update approval tracking fields
        ...(approval.type === ApprovalType.START_SCORING && {
          scoringStartApprovedBy: opponentCaptainId,
          scoringStartApprovedAt: new Date()
        }),
        ...(approval.type === ApprovalType.START_SECOND_INNINGS && {
          secondInningsApprovedBy: opponentCaptainId,
          secondInningsApprovedAt: new Date(),
          firstInningsComplete: true
        }),
        ...(isFinalScore && {
          secondInningsComplete: true,
          finalScoreApprovedAt: nextStatus === MatchStatus.COMPLETED ? new Date() : null,
          finalScoreApprovedBy: JSON.stringify(approvalsArray)
        })
      }
    });
  }, {
    timeout: 15000 // 15 seconds (increased from default 5 seconds)
  }),
  {
    maxRetries: 2,
    initialDelay: 1000,
    maxDelay: 5000
  });

  // Create audit log
  await auditService.logAction({
    matchId: approval.matchId,
    action: AuditAction.APPROVAL_AUTO_APPROVED,
    performedBy: opponentCaptainId, // System acts on behalf of opponent
    approvalType: approval.type,
    wasAutoApproved: true,
    newState: {
      status: 'AUTO_APPROVED',
      nextStatus,
      autoApprovedAt: new Date().toISOString()
    }
  });

  // Send notification to requester
  try {
    const opponentCaptain = approval.match.teamA.captainId === approval.requestedBy
      ? approval.match.teamB
      : approval.match.teamA;

    await notificationService.createNotification({
      userId: approval.requestedBy,
      type: 'APPROVAL_AUTO_APPROVED',
      title: 'Approval Auto-Approved',
      message: `Your ${approval.type} request for match ${approval.match.teamA.teamName} vs ${approval.match.teamB.teamName} was auto-approved after timeout.`,
      link: `/matches/${approval.matchId}`
    });

    // Also notify opponent if they have notifyOnAutoApprove enabled
    const opponentSettings = await prisma.captainSettings.findUnique({
      where: { userId: opponentCaptainId }
    });

    if (opponentSettings?.notifyOnAutoApprove) {
      await notificationService.createNotification({
        userId: opponentCaptainId,
        type: 'APPROVAL_AUTO_APPROVED',
        title: 'Approval Auto-Approved',
        message: `An approval request for match ${approval.match.teamA.teamName} vs ${approval.match.teamB.teamName} was auto-approved.`,
        link: `/matches/${approval.matchId}`
      });
    }
  } catch (error) {
    logger.error(`Failed to send auto-approval notification for ${approval.id}:`, error);
    // Don't throw - notification failure shouldn't break auto-approval
  }

  // Calculate stats if match is completed
  if (nextStatus === MatchStatus.COMPLETED) {
    try {
      await StatsService.calculateStatsFromBalls(approval.matchId);
      logger.info(`Stats calculated for match ${approval.matchId}`);
    } catch (error) {
      logger.error(`Failed to calculate stats for match ${approval.matchId}:`, error);
      // Don't fail auto-approval if stats calculation fails
    }
  }

  logger.info(`Auto-approved ${approval.type} for match ${approval.matchId}`);
}

/**
 * Start the auto-approval job
 * Runs every 5 minutes (reduced frequency to reduce database load)
 */
export function startAutoApprovalJob(): void {
  // Run every 5 minutes instead of 1 minute (reduce load)
  const JOB_INTERVAL = 5 * 60 * 1000; // 5 minutes

  const runJob = async () => {
    try {
      await processAutoApprovals();
    } catch (error) {
      logger.error('❌ Auto-approval job failed:', error);
      // Don't crash, just log and continue
    }
  };

  // Start job with delay to let server stabilize
  setTimeout(() => {
    logger.info('✅ Auto-approval job started (runs every 5 minutes)');
    runJob(); // Run immediately after delay
    setInterval(runJob, JOB_INTERVAL);
  }, 10000); // Wait 10 seconds after server start
}

