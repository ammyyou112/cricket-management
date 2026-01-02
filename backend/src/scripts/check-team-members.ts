import { prisma } from '../config/database';
import { TeamMemberStatus } from '@prisma/client';

async function checkTeamMembers() {
  try {
    console.log('🔍 Checking all teams and their members...\n');

    // Get all teams
    const teams = await prisma.team.findMany({
      select: {
        id: true,
        teamName: true,
        captainId: true,
      },
    });

    console.log(`Found ${teams.length} teams\n`);

    for (const team of teams) {
      console.log(`\n📋 Team: ${team.teamName} (ID: ${team.id})`);
      console.log(`   Captain ID: ${team.captainId}`);

      // Get ALL members (all statuses)
      const allMembers = await prisma.teamMember.findMany({
        where: { teamId: team.id },
        include: {
          player: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
        },
      });

      console.log(`   Total members in DB: ${allMembers.length}`);

      if (allMembers.length === 0) {
        console.log('   ⚠️  No members found for this team');
        continue;
      }

      // Group by status
      const byStatus = {
        ACTIVE: allMembers.filter(m => m.status === TeamMemberStatus.ACTIVE),
        PENDING: allMembers.filter(m => m.status === TeamMemberStatus.PENDING),
        INVITED: allMembers.filter(m => m.status === TeamMemberStatus.INVITED),
        REJECTED: allMembers.filter(m => m.status === TeamMemberStatus.REJECTED),
      };

      console.log(`   Status breakdown:`);
      console.log(`     ACTIVE: ${byStatus.ACTIVE.length}`);
      console.log(`     PENDING: ${byStatus.PENDING.length}`);
      console.log(`     INVITED: ${byStatus.INVITED.length}`);
      console.log(`     REJECTED: ${byStatus.REJECTED.length}`);

      // Show ACTIVE members
      if (byStatus.ACTIVE.length > 0) {
        console.log(`\n   ✅ ACTIVE Members:`);
        byStatus.ACTIVE.forEach((member, idx) => {
          console.log(`     ${idx + 1}. ${member.player.fullName} (${member.player.email})`);
          console.log(`        Member ID: ${member.id}`);
          console.log(`        Player ID: ${member.playerId}`);
          console.log(`        Status: ${member.status}`);
          console.log(`        Joined At: ${member.joinedAt || 'NULL'}`);
        });
      }

      // Show PENDING members
      if (byStatus.PENDING.length > 0) {
        console.log(`\n   ⏳ PENDING Members:`);
        byStatus.PENDING.forEach((member, idx) => {
          console.log(`     ${idx + 1}. ${member.player.fullName} (${member.player.email})`);
          console.log(`        Member ID: ${member.id}`);
          console.log(`        Player ID: ${member.playerId}`);
          console.log(`        Status: ${member.status}`);
          console.log(`        Created At: ${member.createdAt}`);
        });
      }

      // Test the actual query used by getTeamMembers
      const activeMembersQuery = await prisma.teamMember.findMany({
        where: {
          teamId: team.id,
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
        orderBy: {
          joinedAt: 'asc',
        },
      });

      console.log(`\n   🔍 Query result (getTeamMembers): ${activeMembersQuery.length} members`);
      if (activeMembersQuery.length === 0 && byStatus.ACTIVE.length > 0) {
        console.log(`   ⚠️  ISSUE: There are ${byStatus.ACTIVE.length} ACTIVE members, but query returned 0!`);
        console.log(`   This suggests an issue with the orderBy clause when joinedAt is null.`);
      }
    }

    console.log('\n✅ Check complete!\n');
  } catch (error) {
    console.error('❌ Error checking team members:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTeamMembers();

