/**
 * Test Supabase Database Connection
 * Run: node test-connection.js
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testConnection() {
  try {
    console.log('🔵 Testing database connection...');
    console.log('📋 Using DATABASE_URL:', process.env.DATABASE_URL?.replace(/:[^:@]+@/, ':****@') || 'Not set');
    
    // Try to connect
    await prisma.$connect();
    console.log('✅ Connected successfully!');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT NOW() as current_time, version() as pg_version`;
    console.log('✅ Query successful!');
    console.log('   Current time:', result[0]?.current_time);
    console.log('   PostgreSQL version:', result[0]?.pg_version?.substring(0, 50) + '...');
    
    // Test a simple table query (if User table exists)
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ User table accessible! Total users: ${userCount}`);
    } catch (err) {
      console.log('⚠️  User table not found or not accessible (this is OK if migrations not run yet)');
    }
    
    await prisma.$disconnect();
    console.log('✅ All good! Database connection is working perfectly.');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Connection failed!');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.message.includes('Tenant or user not found')) {
      console.error('\n💡 SOLUTION:');
      console.error('   This error means the connection string format is wrong.');
      console.error('   Make sure you are using Session Mode (port 5432) not Transaction Pooler (6543)');
      console.error('   Username should be: postgres (not postgres.projectref)');
      console.error('   Format: postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres');
    }
    
    if (error.message.includes("Can't reach database server")) {
      console.error('\n💡 SOLUTION:');
      console.error('   - Check if Supabase project is ACTIVE (not paused)');
      console.error('   - Verify password is correct');
      console.error('   - Check firewall/network connectivity');
    }
    
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testConnection();

