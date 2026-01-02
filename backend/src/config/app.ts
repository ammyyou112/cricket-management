/**
 * Cricket 360 - Express App Configuration
 * Main Express application setup
 */

import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { corsOptions } from './cors';
import { apiLimiter } from '@/middleware/rateLimit.middleware';
import { errorHandler, notFoundHandler } from '@/middleware/error.middleware';
import logger from '@/utils/logger';

export const configureApp = (app: Application): void => {
  // Security middleware
  app.use(helmet());

  // CORS
  app.use(cors(corsOptions));

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Rate limiting
  app.use(apiLimiter);

  // Request logging
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // Trust proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);
};

export const configureErrorHandling = (app: Application): void => {
  // 404 handler
  app.use(notFoundHandler);

  // Global error handler
  app.use(errorHandler);
};

