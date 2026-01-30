/**
 * Cricket 360 - Database Configuration
 * Prisma client setup and connection management with retry logic
 */

import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Create Prisma client with connection pooling
export const prisma =
  global.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'error', 'warn'] 
      : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Connection retry logic
let retryCount = 0;
const MAX_RETRIES = 5;

// Test database connection with retry
export const connectDatabase = async (): Promise<void> => {
  while (retryCount < MAX_RETRIES) {
    try {
      await prisma.$connect();
      console.log('✅ Database connected successfully');
      
      // Test query to verify connection
      await prisma.$queryRaw`SELECT 1`;
      console.log('✅ Database connection verified');
      
      // Reset retry count on success
      retryCount = 0;
      return;
    } catch (error) {
      retryCount++;
      console.error(`❌ Database connection attempt ${retryCount}/${MAX_RETRIES} failed:`, error);
      
      if (retryCount === MAX_RETRIES) {
        console.error('❌ Database connection failed after all retries');
        throw error;
      }
      
      // Exponential backoff
      const waitTime = Math.min(1000 * Math.pow(2, retryCount - 1), 10000);
      console.log(`⏳ Waiting ${waitTime}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
};

// Graceful shutdown handlers
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  console.log('✅ Database disconnected (beforeExit)');
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  console.log('✅ Database disconnected (SIGINT)');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  console.log('✅ Database disconnected (SIGTERM)');
  process.exit(0);
});

// Legacy function for backward compatibility
export const disconnectDatabase = async () => {
  await prisma.$disconnect();
  console.log('🔌 Database disconnected');
};

