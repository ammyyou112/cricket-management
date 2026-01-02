/**
 * Cricket 360 - Main Server Entry Point
 * Starts the Express server with Socket.io
 */

import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import { configureApp, configureErrorHandling } from '@/config/app';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { APP_CONFIG } from '@/config/constants';
import logger from '@/utils/logger';
import router from '@/routes';
import { initializeSocket } from '@/sockets/socket';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

// Create Express app
const app = express();

// Configure middleware
configureApp(app);

// Mount API routes
app.use(APP_CONFIG.API_PREFIX, router);

// Configure error handling
configureErrorHandling(app);

// Create HTTP server from Express app
const httpServer = http.createServer(app);

// Initialize Socket.io
initializeSocket(httpServer);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDatabase();

    // Start HTTP server (with Socket.io)
    httpServer.listen(Number(APP_CONFIG.PORT), APP_CONFIG.HOST as string, () => {
      logger.info(`🚀 Server running on http://${APP_CONFIG.HOST}:${APP_CONFIG.PORT}`);
      logger.info(`📍 API available at http://${APP_CONFIG.HOST}:${APP_CONFIG.PORT}${APP_CONFIG.API_PREFIX}`);
      logger.info(`🔌 Socket.io server ready for real-time connections`);
      logger.info(`🌍 Environment: ${APP_CONFIG.NODE_ENV}`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      httpServer.close(async () => {
        logger.info('HTTP server closed');
        await disconnectDatabase();
        logger.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
export { httpServer };

