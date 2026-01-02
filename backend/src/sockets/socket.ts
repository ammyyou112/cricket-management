/**
 * Cricket 360 - Socket.io Server Setup
 * Real-time communication for live scoring
 */

import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import logger from '@/utils/logger';

let io: Server | null = null;

export const initializeSocket = (httpServer: HTTPServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join match room
    socket.on('join-match', (matchId: string) => {
      socket.join(`match:${matchId}`);
      logger.info(`Client ${socket.id} joined match room: ${matchId}`);
      
      socket.emit('joined-match', {
        matchId,
        message: 'Successfully joined match room',
      });
    });

    // Leave match room
    socket.on('leave-match', (matchId: string) => {
      socket.leave(`match:${matchId}`);
      logger.info(`Client ${socket.id} left match room: ${matchId}`);
    });

    // Join tournament room
    socket.on('join-tournament', (tournamentId: string) => {
      socket.join(`tournament:${tournamentId}`);
      logger.info(`Client ${socket.id} joined tournament room: ${tournamentId}`);
      
      socket.emit('joined-tournament', {
        tournamentId,
        message: 'Successfully joined tournament room',
      });
    });

    // Leave tournament room
    socket.on('leave-tournament', (tournamentId: string) => {
      socket.leave(`tournament:${tournamentId}`);
      logger.info(`Client ${socket.id} left tournament room: ${tournamentId}`);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`Socket error from ${socket.id}:`, error);
    });
  });

  logger.info('Socket.io server initialized');
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Event emitters for broadcasting updates
export const emitMatchScoreUpdate = (matchId: string, scoreData: any) => {
  if (io) {
    io.to(`match:${matchId}`).emit('match-score-updated', {
      matchId,
      timestamp: new Date().toISOString(),
      data: scoreData,
    });
    logger.info(`Emitted score update for match: ${matchId}`);
  }
};

export const emitMatchStatusUpdate = (matchId: string, status: string) => {
  if (io) {
    io.to(`match:${matchId}`).emit('match-status-updated', {
      matchId,
      status,
      timestamp: new Date().toISOString(),
    });
    logger.info(`Emitted status update for match: ${matchId} - ${status}`);
  }
};

export const emitPlayerStatUpdate = (matchId: string, playerStatData: any) => {
  if (io) {
    io.to(`match:${matchId}`).emit('player-stat-updated', {
      matchId,
      timestamp: new Date().toISOString(),
      data: playerStatData,
    });
    logger.info(`Emitted player stat update for match: ${matchId}`);
  }
};

export const emitMatchCreated = (tournamentId: string, matchData: any) => {
  if (io) {
    io.to(`tournament:${tournamentId}`).emit('match-created', {
      tournamentId,
      timestamp: new Date().toISOString(),
      data: matchData,
    });
    logger.info(`Emitted match created for tournament: ${tournamentId}`);
  }
};

