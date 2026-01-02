import { PrismaClient, UserRole, PlayerType, TeamMemberStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL,
    },
  },
});

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (in development only!)
  if (process.env.NODE_ENV === 'development') {
    console.log('🗑️  Clearing existing data...');
    await prisma.notification.deleteMany();
    await prisma.scoreUpdate.deleteMany();
    await prisma.playerStat.deleteMany();
    await prisma.matchScore.deleteMany();
    await prisma.match.deleteMany();
    await prisma.tournament.deleteMany();
    await prisma.teamMember.deleteMany();
    await prisma.team.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
  }

  // Create users
  console.log('👤 Creating users...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@cricket360.com',
      password: hashedPassword,
      fullName: 'Admin User',
      role: UserRole.ADMIN,
      city: 'Lahore',
    },
  });

  const captain1 = await prisma.user.create({
    data: {
      email: 'captain1@cricket360.com',
      password: hashedPassword,
      fullName: 'John Captain',
      role: UserRole.CAPTAIN,
      playerType: PlayerType.ALL_ROUNDER,
      city: 'Karachi',
    },
  });

  const captain2 = await prisma.user.create({
    data: {
      email: 'captain2@cricket360.com',
      password: hashedPassword,
      fullName: 'Sarah Captain',
      role: UserRole.CAPTAIN,
      playerType: PlayerType.BATSMAN,
      city: 'Islamabad',
    },
  });

  const player1 = await prisma.user.create({
    data: {
      email: 'player1@cricket360.com',
      password: hashedPassword,
      fullName: 'Mike Batsman',
      role: UserRole.PLAYER,
      playerType: PlayerType.BATSMAN,
      city: 'Lahore',
    },
  });

  const player2 = await prisma.user.create({
    data: {
      email: 'player2@cricket360.com',
      password: hashedPassword,
      fullName: 'Tom Bowler',
      role: UserRole.PLAYER,
      playerType: PlayerType.BOWLER,
      city: 'Karachi',
    },
  });

  const player3 = await prisma.user.create({
    data: {
      email: 'player3@cricket360.com',
      password: hashedPassword,
      fullName: 'Alex Keeper',
      role: UserRole.PLAYER,
      playerType: PlayerType.WICKET_KEEPER,
      city: 'Islamabad',
    },
  });

  console.log('✅ Created 6 users (1 admin, 2 captains, 3 players)');

  // Create teams
  console.log('🏏 Creating teams...');

  const team1 = await prisma.team.create({
    data: {
      teamName: 'Lahore Lions',
      captainId: captain1.id,
      description: 'Champions of Lahore',
      city: 'Lahore',
    },
  });

  const team2 = await prisma.team.create({
    data: {
      teamName: 'Karachi Kings',
      captainId: captain2.id,
      description: 'Kings of Karachi',
      city: 'Karachi',
    },
  });

  console.log('✅ Created 2 teams');

  // Create team members
  console.log('👥 Adding team members...');

  await prisma.teamMember.createMany({
    data: [
      {
        teamId: team1.id,
        playerId: captain1.id,
        status: TeamMemberStatus.ACTIVE,
        joinedAt: new Date(),
      },
      {
        teamId: team1.id,
        playerId: player1.id,
        status: TeamMemberStatus.ACTIVE,
        joinedAt: new Date(),
      },
      {
        teamId: team1.id,
        playerId: player2.id,
        status: TeamMemberStatus.ACTIVE,
        joinedAt: new Date(),
      },
      {
        teamId: team2.id,
        playerId: captain2.id,
        status: TeamMemberStatus.ACTIVE,
        joinedAt: new Date(),
      },
      {
        teamId: team2.id,
        playerId: player3.id,
        status: TeamMemberStatus.ACTIVE,
        joinedAt: new Date(),
      },
    ],
  });

  console.log('✅ Added team members');

  // Create tournament
  console.log('🏆 Creating tournament...');

  const tournament = await prisma.tournament.create({
    data: {
      tournamentName: 'Pakistan Premier League 2025',
      startDate: new Date('2025-02-01'),
      endDate: new Date('2025-03-31'),
      status: 'UPCOMING',
      createdBy: admin.id,
      description: 'Annual cricket championship',
      location: 'Pakistan',
    },
  });

  console.log('✅ Created tournament');

  // Create matches
  console.log('⚽ Creating matches...');

  await prisma.match.create({
    data: {
      tournamentId: tournament.id,
      teamAId: team1.id,
      teamBId: team2.id,
      venue: 'National Stadium Karachi',
      matchDate: new Date('2025-02-15T14:00:00Z'),
      matchType: 'LEAGUE',
      status: 'SCHEDULED',
    },
  });

  console.log('✅ Created matches');

  console.log('');
  console.log('🎉 Database seeding completed!');
  console.log('');
  console.log('📝 Test credentials:');
  console.log('   Admin: admin@cricket360.com / password123');
  console.log('   Captain 1: captain1@cricket360.com / password123');
  console.log('   Captain 2: captain2@cricket360.com / password123');
  console.log('   Player 1: player1@cricket360.com / password123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
