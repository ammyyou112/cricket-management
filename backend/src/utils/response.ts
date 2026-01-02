import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '@/types/api.types';

export class ResponseUtil {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
  ): Response {
    const response: ApiResponse<T> = {
      success: true,
      message,
      data,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully'
  ): Response {
    return this.success(res, data, message, 201);
  }

  static paginated<T>(
    res: Response,
    data: T[],
    pagination: {
      page: number;
      limit: number;
      total: number;
    },
    message: string = 'Success'
  ): Response {
    const response: PaginatedResponse<T[]> = {
      success: true,
      message,
      data,
      pagination: {
        ...pagination,
        totalPages: Math.ceil(pagination.total / pagination.limit),
      },
    };
    return res.status(200).json(response);
  }

  static error(
    res: Response,
    message: string = 'An error occurred',
    statusCode: number = 500,
    error?: string
  ): Response {
    const response: ApiResponse = {
      success: false,
      message,
      error,
    };
    return res.status(statusCode).json(response);
  }

  static validationError(
    res: Response,
    errors: Record<string, string[]>
  ): Response {
    const response: ApiResponse = {
      success: false,
      message: 'Validation failed',
      errors,
    };
    return res.status(422).json(response);
  }
}
