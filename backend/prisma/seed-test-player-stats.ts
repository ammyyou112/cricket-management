/**
 * Seed Test Player Stats
 * Adds 5 match statistics for test5@test.com to test AI analysis
 * 
 * Run with: npx ts-node -r tsconfig-paths/register prisma/seed-test-player-stats.ts
 */

import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🏏 Seeding test player stats for test5@test.com...\n');

  // Find the user
  const user = await prisma.user.findUnique({
    where: { email: 'test5@test.com' },
    select: { id: true, fullName: true, email: true },
  });

  if (!user) {
    console.error('❌ User test5@test.com not found!');
    console.log('   Please create the user first or check the email address.\n');
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.fullName} (${user.email})`);
  console.log(`   User ID: ${user.id}\n`);

  // Find or get a team for this player
  let team = await prisma.team.findFirst({
    where: {
      members: {
        some: {
          playerId: user.id,
          status: 'ACTIVE',
        },
      },
    },
  });

  // If no team found, create a dummy team or use first available team
  if (!team) {
    const firstTeam = await prisma.team.findFirst();
    if (firstTeam) {
      team = firstTeam;
      console.log(`📋 Using existing team: ${team.teamName}`);
    } else {
      // Create a dummy team
      const captain = await prisma.user.findFirst({
        where: { role: 'CAPTAIN' },
      });
      
      if (!captain) {
        console.error('❌ No captain found to create team. Please create a team first.\n');
        process.exit(1);
      }

      team = await prisma.team.create({
        data: {
          teamName: `Test Team ${Date.now()}`,
          captainId: captain.id,
          city: 'Test City',
        },
      });
      console.log(`📋 Created test team: ${team.teamName}`);
    }
  }

  // Check existing stats
  const existingStats = await prisma.playerStat.count({
    where: { playerId: user.id },
  });

  if (existingStats >= 5) {
    console.log(`ℹ️  User already has ${existingStats} match stats.`);
    console.log('   Deleting old stats to create fresh ones...\n');
    await prisma.playerStat.deleteMany({
      where: { playerId: user.id },
    });
  }

  // Get or create matches
  const matches = [];
  const today = new Date();
  
  for (let i = 0; i < 5; i++) {
    const matchDate = new Date(today);
    matchDate.setDate(today.getDate() - (14 - i * 3)); // Spread over last 14 days

    // Find or create a match
    let match = await prisma.match.findFirst({
      where: {
        matchDate: {
          gte: new Date(matchDate.setHours(0, 0, 0, 0)),
          lt: new Date(matchDate.setHours(23, 59, 59, 999)),
        },
      },
    });

    if (!match) {
      // Create a dummy match
      const tournament = await prisma.tournament.findFirst();
      
      if (!tournament) {
        console.error('❌ No tournament found. Please create a tournament first.\n');
        process.exit(1);
      }

      // Get another team for the match
      const teamB = await prisma.team.findFirst({
        where: { id: { not: team.id } },
      }) || team;

      match = await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          teamAId: team.id,
          teamBId: teamB.id,
          venue: 'Test Stadium',
          matchDate: matchDate,
          matchType: 'FRIENDLY',
          status: 'COMPLETED',
        },
      });
    }

    matches.push(match);
  }

  console.log(`📅 Created/found ${matches.length} matches\n`);

  // Match statistics data (showing improvement trend)
  const matchStats = [
    { runsScored: 45, ballsFaced: 30, wicketsTaken: 0, oversBowled: 0, runsConceded: 0, catches: 1, stumpings: 0 },
    { runsScored: 52, ballsFaced: 35, wicketsTaken: 0, oversBowled: 0, runsConceded: 0, catches: 0, stumpings: 0 },
    { runsScored: 67, ballsFaced: 42, wicketsTaken: 0, oversBowled: 0, runsConceded: 0, catches: 2, stumpings: 0 },
    { runsScored: 28, ballsFaced: 25, wicketsTaken: 0, oversBowled: 0, runsConceded: 0, catches: 0, stumpings: 0 },
    { runsScored: 55, ballsFaced: 38, wicketsTaken: 0, oversBowled: 0, runsConceded: 0, catches: 1, stumpings: 0 },
  ];

  // Create player stats
  console.log('📊 Creating player statistics...\n');
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const stats = matchStats[i];
    const matchDate = new Date(today);
    matchDate.setDate(today.getDate() - (14 - i * 3));

    await prisma.playerStat.create({
      data: {
        playerId: user.id,
        matchId: match.id,
        teamId: team.id,
        runsScored: stats.runsScored,
        ballsFaced: stats.ballsFaced,
        wicketsTaken: stats.wicketsTaken,
        oversBowled: stats.oversBowled,
        runsConceded: stats.runsConceded,
        catches: stats.catches,
        stumpings: stats.stumpings,
        fours: Math.floor(stats.runsScored * 0.3),
        sixes: Math.floor(stats.runsScored * 0.1),
        runOuts: 0,
        createdAt: matchDate,
      },
    });

    console.log(`   ✅ Match ${i + 1}: ${stats.runsScored} runs, ${stats.ballsFaced} balls, ${stats.catches} catches`);
  }

  console.log('\n🎉 Test player stats created successfully!');
  console.log(`\n📝 Summary:`);
  console.log(`   Player: ${user.fullName} (${user.email})`);
  console.log(`   Matches: ${matches.length}`);
  console.log(`   Total Runs: ${matchStats.reduce((sum, s) => sum + s.runsScored, 0)}`);
  console.log(`   Total Catches: ${matchStats.reduce((sum, s) => sum + s.catches, 0)}`);
  console.log(`\n✅ You can now test AI analysis for this player!\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding test player stats:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

