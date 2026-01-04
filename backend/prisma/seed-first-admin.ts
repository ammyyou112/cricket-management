/**
 * Seed First Admin Account
 * 
 * This script creates the first admin account if one doesn't already exist.
 * Run manually once: npx ts-node prisma/seed-first-admin.ts
 * 
 * Usage:
 *   - Set ADMIN_EMAIL and ADMIN_PASSWORD environment variables
 *   - Or edit the defaults below
 *   - Run: npx ts-node -r tsconfig-paths/register prisma/seed-first-admin.ts
 */

import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DIRECT_URL || process.env.DATABASE_URL,
    },
  },
});

async function main() {
  console.log('🔐 Creating first admin account...\n');

  // Get admin credentials from environment or use defaults
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@cricket360.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
  const adminName = process.env.ADMIN_NAME || 'System Administrator';

  // Check if admin already exists
  const existingAdmin = await prisma.user.findFirst({
    where: {
      role: UserRole.ADMIN,
    },
  });

  if (existingAdmin) {
    console.log('⚠️  Admin account already exists!');
    console.log(`   Email: ${existingAdmin.email}`);
    console.log(`   Name: ${existingAdmin.fullName}`);
    console.log(`   ID: ${existingAdmin.id}\n`);
    console.log('✅ No action needed. Use existing admin account.\n');
    return;
  }

  // Check if email is already taken
  const existingUser = await prisma.user.findUnique({
    where: {
      email: adminEmail,
    },
  });

  if (existingUser) {
    console.error(`❌ Error: Email ${adminEmail} is already registered as ${existingUser.role}`);
    console.error('   Please use a different email address.\n');
    process.exit(1);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      fullName: adminName,
      role: UserRole.ADMIN,
      city: 'Lahore',
    },
  });

  console.log('✅ Admin account created successfully!\n');
  console.log('📝 Admin Credentials:');
  console.log(`   Email: ${admin.email}`);
  console.log(`   Name: ${admin.fullName}`);
  console.log(`   Password: ${adminPassword}`);
  console.log(`   ID: ${admin.id}\n`);
  console.log('⚠️  IMPORTANT: Change the password after first login!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error creating admin account:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

