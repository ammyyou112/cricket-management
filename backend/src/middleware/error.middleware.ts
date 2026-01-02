import { Request, Response, NextFunction } from 'express';
import { AppError, ValidationError } from '@/utils/errors';
import { ResponseUtil } from '@/utils/response';
import logger from '@/utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error({
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle custom AppError
  if (err instanceof AppError) {
    if (err instanceof ValidationError) {
      return ResponseUtil.validationError(res, err.errors);
    }

    return ResponseUtil.error(
      res,
      err.message,
      err.statusCode,
      process.env.NODE_ENV === 'development' ? err.stack : undefined
    );
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    if (prismaError.code === 'P2002') {
      return ResponseUtil.error(res, 'Resource already exists', 409);
    }
    
    if (prismaError.code === 'P2025') {
      return ResponseUtil.error(res, 'Resource not found', 404);
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ResponseUtil.error(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return ResponseUtil.error(res, 'Token expired', 401);
  }

  // Default server error
  return ResponseUtil.error(
    res,
    'Internal Server Error',
    500,
    process.env.NODE_ENV === 'development' ? err.message : undefined
  );
};

// 404 handler
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  ResponseUtil.error(res, `Route ${req.originalUrl} not found`, 404);
};
